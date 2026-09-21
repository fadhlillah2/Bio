#!/usr/bin/env bun
/**
 * Typeset a cv PDF from the canonical .txt — wording is preserved verbatim.
 *
 * Usage:  bun cv/build-pdf.ts cv/resume-vX.Y.txt [max_pages]
 *         (needs unpdf + pdf-lib installed)
 * Output: sibling .pdf (A4) via Chrome headless print-to-pdf (native Linux/macOS
 *         Chrome, or Windows Chrome under WSL), then verifies the PDF's extracted
 *         wording is identical to the .txt (whitespace/bullet markers aside) and
 *         fits max_pages (default 1; a 2-page resume needs 2).
 * Multi-page resumes keep each company or project group together.
 *
 * Port of build-pdf.py (kept alongside as the reference oracle). pypdf has no Bun
 * equivalent, so the read side (page count + text extraction) is unpdf and the
 * write side (/Title, /Author, /Lang stamp) is pdf-lib.
 */
import { existsSync, renameSync, rmSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

const DOC = `Typeset a cv PDF from the canonical .txt — wording is preserved verbatim.

Usage:  bun cv/build-pdf.ts cv/resume-vX.Y.txt [max_pages]
        (needs unpdf + pdf-lib installed)
Output: sibling .pdf (A4) via Chrome headless print-to-pdf (native Linux/macOS
        Chrome, or Windows Chrome under WSL), then verifies the PDF's extracted
        wording is identical to the .txt (whitespace/bullet markers aside) and
        fits max_pages (default 1; a 2-page resume needs 2).
Multi-page resumes keep each company or project group together.`;

const WSL_CHROME = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe";

// Mirrors Python's SystemExit with an error so the `finally` cleanups
// (.print.html / .tmp.pdf) still run. process.exit() would skip them.
class Fail extends Error {}
function fail(msg: string): never {
  throw new Fail(msg);
}

export function findChrome(): string {
  for (const c of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]) {
    const p = Bun.which(c);
    if (p) return p;
  }
  if (existsSync(WSL_CHROME)) return WSL_CHROME;
  fail("FAIL no Chrome found (native google-chrome/chromium or WSL Windows Chrome)");
}

// Base look, used as-is by the consulting one-pagers; RESUME_CSS overrides the header columns.
export const CSS = `
@page { size: A4; margin: 7.5mm 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 8.8pt; line-height: 1.17; color: #1a1a1a; }
a { color: inherit; text-decoration: none; }
h1 { font-size: 19pt; letter-spacing: 0; text-align: center; }
.hl { text-align: center; font-weight: bold; font-size: 9.4pt; margin-top: 1mm; text-wrap: balance; }
.ct { text-align: center; font-size: 8.6pt; color: #444; }
h2 { font-size: 9.8pt; letter-spacing: 1.2px; border-bottom: 1px solid #999;
     padding-bottom: 0.5mm; margin: 2mm 0 0.9mm; break-after: avoid; }
/* job headers render as one linear line "COMPANY · LOCATION" / "Title · Date" —
   no space-between gap, so column-aware PDF/ATS extractors keep the date with its
   own employer instead of detaching the right column (canon() ignores the middot) */
.crow, .trow { break-after: avoid; }
.crow { margin-top: 1.2mm; }
.crow .c { font-weight: bold; }
.crow .loc, .trow .d { color: #444; font-size: 8.6pt; }
.crow .loc::before, .trow .d::before { content: "·"; margin: 0 0.45em; color: #999; }
.trow .t { font-style: italic; }
.b { padding-left: 4mm; text-indent: -2.6mm; }
.b .m { color: #666; }
.sk { padding-left: 22mm; text-indent: -22mm; }
.sk b { font-weight: bold; }
.alias { margin-top: 1mm; font-size: 7.4pt; color: #777; }
`;

// The consulting one-pagers carry ~40 lines of short content that, at the resume's
// dense 8.8pt/1.17, leaves the lower half of the A4 blank. These overrides scale the
// type/spacing up so the page fills gracefully while staying exactly 1 page. Tuned
// empirically against last-text y-position (see README lineage note for v1.2;
// leading/section gaps re-tuned for the ~6 extra outcome-led lines of v1.4).
export const CONSULTING_CSS = `
@page { margin: 12mm 14mm; }
body.consulting { font-size: 10.5pt; line-height: 1.33; }
body.consulting h1 { font-size: 24pt; }
body.consulting .hl { font-size: 12pt; margin-top: 2.5mm; }
body.consulting .ct { font-size: 10pt; line-height: 1.5; }
body.consulting h2 { font-size: 12.5pt; letter-spacing: 1.2px; margin: 3.4mm 0 1.6mm; padding-bottom: 1mm; }
body.consulting .b { padding-left: 6mm; text-indent: -3.6mm; margin-top: 1mm; }
body.consulting .sk { padding-left: 30mm; text-indent: -30mm; margin-top: 1mm; }
body.consulting p.body { margin-top: 1.2mm; }
/* Keep proof URLs unbroken: at 10.5pt a link like .../rate-limiter-project-go would wrap at a
   hyphen, and poppler/ATS plain-text extraction then de-hyphenates it into a dead 404 URL. */
body.consulting a { white-space: nowrap; }
`;

// Resume + recruiter one-pager: the Google Docs reference look (see README "Layout refresh").
// Everything but the page box is sized in em, so a profile can rescale the whole page by
// setting one body font-size. Measurements mirror img/Resume-Fadhlillah-7.1 (6).pdf at 11pt.
export const RESUME_CSS = `
@page { margin: 36pt 43pt; }
body { font-family: "Times New Roman", "Liberation Serif", Times, serif;
       font-size: 11pt; line-height: 1.35; color: #000; }
h1 { font-size: 1.4545em; text-align: center; line-height: 1.1; }
.hl { text-align: center; font-size: 1em; font-weight: normal; margin-top: 0; text-wrap: initial; }
.ct { text-align: center; font-size: 1em; color: #000; line-height: 1.35; }
.ct a { color: #1155cc; text-decoration: underline; }
h2 { font-size: 1.0909em; letter-spacing: 0; border-bottom: 1px solid #000;
     padding-bottom: 0; margin: 0.55em 0 0.333em; }
/* Location/date sit flush right on the header's own row, in DOM order on a shared baseline.
   Poppler -raw/-layout keep each pair on one line; its default mode gives the right-hand column
   a line of its own, still in reading order (COMPANY -> LOCATION). See README "Job headers". */
.crow, .trow { display: flex; justify-content: space-between; align-items: baseline; gap: 1em;
               line-height: 1.15; }
.crow { margin-top: 0; }
.trow { margin: 0; }
.crow .loc::before, .trow .d::before { content: none; }
.crow .loc { font-size: 0.909em; font-weight: bold; color: #666666; white-space: nowrap; }
.trow .t { font-weight: bold; font-style: normal; }
.trow .d { font-size: 1em; font-weight: bold; color: #000; white-space: nowrap; }
.edu .t, .deg { font-weight: bold; font-style: italic; }  /* degree line, with or without a date column */
.b { padding-left: 3.273em; text-indent: -1.636em; break-inside: avoid; }
.b .m { font-family: Arial, "Liberation Sans", Helvetica, sans-serif; color: #000;
        display: inline-block; width: calc(1.636em - 0.25em); text-indent: 0; }
.sk { padding-left: 7.3em; text-indent: -7.3em; line-height: 1.15; }
.sk b { display: inline-block; width: 6.545em; text-indent: 0; }
.alias { font-size: 0.8em; color: #555; }
p.body { text-align: justify; orphans: 2; widows: 2; }
a, .nowrap { white-space: nowrap; }
`;

// Long experience entries may break between project groups, with each bullet run kept together.
// Body size is the one knob that rescales a profile; 8.5pt is the largest that still fits 2 pages.
export const FULL_RESUME_CSS = `
body { font-size: 8.5pt; }
.job { break-inside: avoid; }
.job:has(> p.body) { break-inside: auto; }
.job > .b:has(+ .b) { break-after: avoid; }
.job > p.body { margin-top: 0.7mm; break-after: avoid; }
`;

// The recruiter one-pager keeps the reference's 11pt: its content is cut to fit one page, never its type.
export const ONEPAGER_CSS = `
body.onepager a { white-space: nowrap; }
`;

// --- Python stdlib bits with no JS equivalent -------------------------------
/** html.escape(s, quote=True) */
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

/** str.splitlines() — unlike split("\n") it drops the trailing empty element */
const splitlines = (s: string): string[] => {
  const parts = s.split(/\r\n|[\n\r\v\f\u001c-\u001e\u0085\u2028\u2029]/);
  if (parts.length && parts[parts.length - 1] === "") parts.pop();
  return parts;
};

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
/** str.title() */
export const pyTitle = (s: string) => s.replace(/\p{L}+/gu, capitalize);
const isUpper = (s: string) => s !== s.toLowerCase() && s === s.toUpperCase();
const isLower = (s: string) => s !== s.toUpperCase() && s === s.toLowerCase();
const isAlnum = (s: string) => s !== "" && /^[\p{L}\p{N}]+$/u.test(s);
/** repr(str) — single-quoted like Python's {!r}, double-quoted only when the text has ' and no " */
const pyRepr = (s: string) => {
  const body = s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  return s.includes("'") && !s.includes('"') ? `"${body}"` : `'${body.replace(/'/g, "\\'")}'`;
};

// ---------------------------------------------------------------------------
export function linkify(escaped: string): string {
  return escaped.replace(  // URL must not end in '.' so trailing sentence punctuation stays outside the link
    /((?:github\.com|linkedin\.com|leetcode\.com|replit\.com|wa\.me|fadhlillah2\.github\.io)\/[\w./@-]*[\w/@-]|[\w.]+@gmail\.com)/g,
    // email is the only match without '/' — profile paths like replit.com/@X contain '@' too
    (m) => `<a href="${m.includes("/") ? "https://" : "mailto:"}${m}">${m}</a>`,
  );
}

/** Header link syntax: "label <target>" renders as a link whose visible text is only the label. */
const LINK_LABEL = /(\S+)\s*<([^<>]+)>/g;

export const linkHref = (target: string) =>
  // email is the only target without '/' — profile paths like replit.com/@X contain '@' too
  target.includes("/") ? `https://${target}` : `mailto:${target}`;

/** [label, href] for every "label <target>" in the header block (name + lines up to the first blank) */
export function headerTargets(txt: string): [string, string][] {
  const head = headerLines(txt);
  return head.flatMap((l) => [...l.matchAll(LINK_LABEL)].map((m): [string, string] => [m[1], linkHref(m[2])]));
}

export function headerHtml(s: string, e: (t: string) => string): string {
  let out = "", last = 0;
  for (const m of s.matchAll(LINK_LABEL)) {
    out += e(s.slice(last, m.index)) + `<a href="${escapeHtml(linkHref(m[2]))}">${escapeHtml(m[1])}</a>`;
    last = m.index + m[0].length;
  }
  return out + e(s.slice(last));
}

/** Name line plus every following non-blank line, i.e. everything above the first blank line. */
export function headerLines(txt: string): string[] {
  const lines = splitlines(txt);
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const head: string[] = [];
  while (i < lines.length && lines[i].trim()) head.push(lines[i++].trim());
  if (head.length < 2) fail("FAIL header incomplete: need a name line plus at least one header line");
  return head;
}

export function twoCol(line: string): string[] | null {
  const parts = line.trim().split(/\s{2,}/);
  return parts.length === 2 ? parts : null;
}

const PROSE = new Set(["SUMMARY", "OBJECTIVE"]);  // prose sections wrap without indent

const TITLE_WORDS = new Map([["id", "ID"], ["en", "EN"], ["onepager", "One-Pager"]]);

export function docTitle(stem: string, name: string): string {
  // "resume-vX.Y" -> "Fadhlillah — Resume vX.Y" (viewer-facing PDF title)
  const words = stem.split("-").map(
    (w) => TITLE_WORDS.get(w) ?? (/^v[\d.]+$/.test(w) ? w : capitalize(w)),
  );
  return `${pyTitle(name)} — ${words.join(" ")}`;
}

export function toHtml(txt: string, stem: string): string {
  const lines = splitlines(txt);
  const head = headerLines(txt);
  let i = 0;
  while (!lines[i].trim()) i++;
  i += head.length;
  const e = (s: string) => {
    const linked = linkify(escapeHtml(s));
    if (stem.includes("consulting")) return linked;
    // Keep compound words intact: PDF readers can remove a literal hyphen at a line break.
    return linked.replace(/<a\b[^>]*>.*?<\/a>|[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+/g,
      (part) => part.startsWith("<a ") ? part : `<span class="nowrap">${part}</span>`);
  };
  const out = [`<h1>${headerHtml(head[0], e)}</h1>`];
  for (const l of head.slice(1)) {  // a header line carrying any link is the contact line
    const h = headerHtml(l, e);
    out.push(`<p class="${h.includes("<a ") ? "ct" : "hl"}">${h}</p>`);
  }
  const bullet = stem.includes("consulting") ? "&bull;" : "&#9679;";  // reference uses U+25CF
  let section: string | null = null;
  let unit: [string, string] | null = null;  // pending (kind, text) being accumulated
  let jobOpen = false;  // a <div class="job"> wraps each company block so it won't split across pages
  let eduDeg = false;  // the line right after an EDUCATION company row is the degree line

  const flush = () => {
    if (!unit) return;
    const deg = eduDeg;  // an empty flush keeps the flag: the degree line has not been read yet
    eduDeg = false;
    const [kind, text] = unit;
    if (kind === "b") {
      out.push(`<div class="b"><span class="m">${bullet}</span> ${e(text)}</div>`);
    } else if (kind === "sk") {
      const at = text.indexOf(" : ");  // str.partition
      const [label, rest] = at < 0 ? [text, ""] : [text.slice(0, at), text.slice(at + 3)];
      out.push(`<div class="sk"><b>${e(label)}</b> : ${e(rest)}</div>`);
    } else {
      out.push(`<p class="body${deg ? " deg" : ""}">${e(text)}</p>`);
    }
    unit = null;
  };

  const closeJob = () => {
    eduDeg = false;
    if (jobOpen) {
      out.push("</div>");
      jobOpen = false;
    }
  };

  for (const line of lines.slice(i)) {
    if (!line.trim()) {
      flush();
      continue;
    }
    const cols = twoCol(line);
    if (/^[A-Z][A-Z &/]*$/.test(line) && !line.includes("  ")) {
      flush();
      closeJob();
      section = line;
      out.push(`<h2>${e(line)}</h2>`);
    } else if (line.startsWith("- ")) {  // before the skills regex: a bullet containing " : " is still a bullet
      flush();
      unit = ["b", line.slice(2).trim()];
    } else if (/^\S.{0,12}? : /.test(line)) {  // skills row "Label : values"
      flush();
      unit = ["sk", line.trim().replace(/^(\S[^:]*?)\s+: /, "$1 : ")];
    } else if (/^(Also searchable as|Target roles)/.test(line)) {  // de-emphasized keyword/role footer, not a cert line
      flush();
      out.push(`<p class="alias">${e(line.trim())}</p>`);
    } else if (line.startsWith(" ") && unit) {  // wrapped continuation
      unit = [unit[0], unit[1] + " " + line.trim()];
    } else if (cols && !PROSE.has(section!)) {
      flush();
      const cls = isUpper(cols[0]) ? ["crow", "c", "loc"] : ["trow", "t", "d"];
      if (cls[0] === "crow") {  // a new company block starts — keep it on one page
        closeJob();
        out.push('<div class="job">');
        jobOpen = true;
        eduDeg = section === "EDUCATION";  // a degree line without a date column still renders italic
      }
      const edu = cls[0] === "trow" && section === "EDUCATION" ? " edu" : "";  // degree line is italic
      if (cls[0] === "trow") eduDeg = false;  // a dated degree row is the degree line itself
      out.push(`<div class="${cls[0]}${edu}"><span class="${cls[1]}">${e(cols[0])}</span>`
        + `<span class="${cls[2]}">${e(cols[1])}</span></div>`);
    } else if (PROSE.has(section!) && unit) {  // summary/objective wraps without indent
      unit = [unit[0], unit[1] + " " + line.trim()];
    } else if (unit && unit[0] === "p" && isLower(line.slice(0, 1)) && isAlnum(unit[1].slice(-1))) {
      // unindented mid-sentence wrap: joins only lowercase lines after a word break,
      // so a new lowercase-brand item (e.g. freeCodeCamp) after ")" stays its own paragraph
      unit = [unit[0], unit[1] + " " + line.trim()];
    } else {
      flush();
      unit = ["p", line.trim()];
    }
  }
  flush();
  closeJob();
  const lang = stem.includes("-id-") ? "id" : "en";
  const title = escapeHtml(docTitle(stem, head[0]));
  const consulting = stem.includes("consulting");  // fills the page (see CONSULTING_CSS)
  // Only the full resume groups experience across page boundaries.
  let bodyAttr: string, extra: string;
  if (consulting) {
    [bodyAttr, extra] = [' class="consulting"', CONSULTING_CSS];
  } else if (stem.includes("onepager")) {
    [bodyAttr, extra] = [' class="onepager"', RESUME_CSS + ONEPAGER_CSS];
  } else {
    [bodyAttr, extra] = ["", RESUME_CSS + FULL_RESUME_CSS];
  }
  return `<!doctype html><html lang='${lang}'><head><meta charset='utf-8'>`
    + `<title>${title}</title><style>${CSS}${extra}</style></head><body${bodyAttr}>`
    + out.join("") + "</body></html>";
}

/** The .txt as the PDF text layer should read it: header "label <target>" targets are not rendered. */
export function visibleText(txt: string): string {
  const head = headerLines(txt);
  const lines = splitlines(txt);
  let i = 0;
  while (!lines[i].trim()) i++;
  return lines.map((l, k) => (k >= i && k < i + head.length ? l.replace(/\s*<[^<>]*>/g, "") : l)).join("\n");
}

export function canon(s: string): string {
  s = s.replace(/^\s*- /gm, " ");   // txt bullet markers
  s = s.replaceAll("•", " ");       // rendered bullet glyphs
  s = s.replaceAll("●", " ");
  s = s.replaceAll("·", " ");       // job-header separator (CSS ::before, absent from the .txt)
  return s.replace(/\s+/g, "");     // wording only: drop all whitespace
}

export function chromePath(p: string, chrome: string): string {
  // Windows Chrome under WSL needs C:\-style paths; native Chrome takes posix
  const abs = resolve(p);
  if (chrome === WSL_CHROME) {
    const m = /^\/mnt\/([a-z])\/(.*)$/.exec(abs);
    if (!m) fail(`FAIL WSL Chrome needs the repo under /mnt/<drive>/, got ${abs}`);
    return `${m[1].toUpperCase()}:\\${m[2].replaceAll("/", "\\")}`;
  }
  return abs;
}

/** Path.with_suffix — replaces the last extension only ("resume-v8.7.txt" -> "resume-v8.7.pdf") */
const withSuffix = (p: string, suffix: string) =>
  join(dirname(p), basename(p, extname(p)) + suffix);

export function selftest(): void {
  // Chrome-less check of the parser branches — fails loudly if the logic breaks
  const assert = (cond: unknown, what: string) => {
    if (!cond) fail(`selftest FAIL: ${what}`);
  };
  const src = "NAME\nHeadline here\nCity, ID | mail@gmail.com\nlinkedin.com/in/x | github.com/x\n\n"
    + "SUMMARY\nProse line one\nwrapping without indent.\n\nEXPERIENCE\n"
    + "COMPANY    CITY, ID\nRole Title    Jan 2020 – Now\n- bullet one\n  wrapped tail\n\n"
    + "SKILLS\nAI/LLM       : RAG, agents\n";
  const h = toHtml(src, "resume-v9.9-test");
  assert(h.includes("<title>Name — Resume v9.9 Test</title>") && h.includes("<html lang='en'>"), "title/lang");
  assert(h.includes('<div class="crow"><span class="c">COMPANY</span>'), "crow");
  assert(h.includes('<div class="trow"><span class="t">Role Title</span>'), "trow");
  assert(h.includes('<div class="b"><span class="m">&#9679;</span> bullet one wrapped tail</div>'), "bullet wrap");
  assert(toHtml(src, "consulting-onepager-en-v9.9").includes('<span class="m">&bull;</span>'), "consulting keeps its bullet glyph");
  assert(h.includes('<div class="sk"><b>AI/LLM</b> : RAG, agents</div>'), "skills row");
  assert(h.includes('<p class="body">Prose line one wrapping without indent.</p>'), "summary wrap");
  assert(toHtml(src, "consulting-onepager-id-v9.9").includes("<html lang='id'>"), "id lang");
  assert(canon("- a  b\nc") === canon("• a b c") && canon("ab") !== canon("ac"), "canon");
  assert(canon("- a  b\nc") === canon("● a b c"), "reference bullet glyph ignored in verify");
  assert(canon("Bank·Jakarta") === canon("Bank Jakarta"), "header separator middot ignored in verify");
  assert(canon(visibleText("NAME\nemail <a@b.com> • GitHub <github.com/x>\n\nSUMMARY\nP <kept>\n"))
    === canon("NAME\nemail • GitHub\n\nSUMMARY\nP <kept>\n"), "link targets dropped in the header only");
  assert(canon("a <b>") !== canon("a"), "body angle brackets still count as wording");
  assert(toHtml(src, "consulting-onepager-en-v9.9").includes('class="consulting"')
    && toHtml(src, "consulting-onepager-en-v9.9").includes("body.consulting"), "page-fill overrides applied");
  assert(!toHtml(src, "resume-v9.9-test").includes('class="consulting"'), "only for consulting docs");
  assert(toHtml(src, "resume-onepager-v9.9").includes('class="onepager"')
    && toHtml(src, "resume-onepager-v9.9").includes("body.onepager"), "1-pager densify applied");
  assert(toHtml(src, "resume-onepager-v9.9").includes("<title>Name — Resume One-Pager v9.9</title>"), "1-pager title");
  // header: name, then any number of lines up to the first blank; a line with a link is the contact line
  assert(h.includes('<h1>NAME</h1><p class="hl">Headline here</p><p class="ct">'), "headline vs contact split");
  const labelled = toHtml("NAME\nCity • email <a@b.com> • GitHub <github.com/x>\n\nSUMMARY\nP\n", "resume-v9.9-test");
  assert(labelled.includes('<p class="ct">City • <a href="mailto:a@b.com">email</a> • '
    + '<a href="https://github.com/x">GitHub</a></p>'), "link-label renders label only");
  assert(!labelled.includes('class="hl"'), "a two-line header is name + contact, no headline");
  assert(JSON.stringify(headerTargets("NAME\nemail <a@b.com> • WA <wa.me/1>\n\nX\n"))
    === '[["email","mailto:a@b.com"],["WA","https://wa.me/1"]]', "header targets for the link check");
  assert(((): boolean => { try { toHtml("NAME\n\nSUMMARY\n", "resume-v9.9-test"); return false; } catch { return true; } })(),
    "a lone name line is not a header");
  const lk = linkify("see replit.com/@X and mail@gmail.com");
  assert(lk.split("<a href=").length - 1 === 2, "two links");
  // scheme guard: a URL containing '@' must stay https, only bare emails get mailto
  assert(lk.includes('href="https://replit.com/@X"') && lk.includes('href="mailto:mail@gmail.com"'), "link schemes");
  assert(toHtml(src + "Also searchable as: X, Y\n", "resume-v9.9-test")
    .includes('<p class="alias">Also searchable as: X, Y</p>'), "keyword footer keeps its own style");
  assert(toHtml(src + "Target roles: X · Y\n", "resume-v9.9-test")
    .includes('<p class="alias">Target roles: X · Y</p>'), "role footer keeps alias style");
  assert(linkify("github.com/x/y.").includes('href="https://github.com/x/y"'), "trailing '.' stays outside the link");
  const wrap = toHtml(src.replace("- bullet one\n  wrapped tail",
    "Label line:\nAn unindented paragraph that\nwraps mid-sentence here."), "resume-v9.9-test");
  assert(wrap.includes('<p class="body">An unindented paragraph that wraps <span class="nowrap">mid-sentence</span> here.</p>'), "lowercase wrap joins");
  assert(wrap.includes('<p class="body">Label line:</p>'), "uppercase start stays its own paragraph");
  const certs = toHtml(src.replace("- bullet one\n  wrapped tail",
    "Cert one (Org)\nfreeCodeCamp — another item"), "resume-v9.9-test");
  assert(certs.includes('<p class="body">Cert one (Org)</p>'), "lowercase-brand item after ')' is NOT merged");
  assert(certs.includes('<p class="body">freeCodeCamp — another item</p>'), "freeCodeCamp own paragraph");
  assert(toHtml(src.replace("- bullet one", "- a : b\n- bullet one"), "resume-v9.9-test")
    .includes('<div class="b"><span class="m">&#9679;</span> a : b</div>'), "bullet with ' : ' stays a bullet");
  assert(toHtml(src.replace("EXPERIENCE", "EDUCATION"), "resume-v9.9-test").includes('<div class="trow edu">'),
    "EDUCATION degree line is marked for italics");
  const noDate = toHtml("NAME\nX <a@b.com>\n\nEDUCATION\nUNIV    CITY, ID\nBachelor of Things\nActivities: none\n",
    "resume-v9.9-test");
  assert(noDate.includes('<p class="body deg">Bachelor of Things</p>')
    && noDate.includes('<p class="body">Activities: none</p>'),
    "a dateless degree line is italic, the line after it is not");
  const dated = toHtml("NAME\nX <a@b.com>\n\nEDUCATION\nUNIV    CITY, ID\nBachelor of Things    Mar 2016 – May 2020\nActivities: none\n",
    "resume-v9.9-test");
  assert(dated.includes('<div class="trow edu">') && dated.includes('<p class="body">Activities: none</p>'),
    "a dated degree row does not italicize the line after it");
  const compounds = toHtml(src.replace("- bullet one", "- field-level RBAC; github.com/x/rate-limiter"), "resume-v9.9-test");
  assert(compounds.includes('<span class="nowrap">field-level</span>'), "literal hyphen survives a line wrap");
  assert(compounds.includes('<a href="https://github.com/x/rate-limiter">github.com/x/rate-limiter</a>'),
    "compound-word formatting leaves proof links intact");
  // render-behaviour guards (can't run Chrome here, so lock the CSS the render depends on):
  assert(CSS.includes("letter-spacing: 0"), "h1 name extracts as one token FADHLILLAH, not FA D H L...");
  assert(CONSULTING_CSS.includes("white-space: nowrap"), "proof URLs never wrap→de-hyphenate into 404s");
  assert(ONEPAGER_CSS.includes("white-space: nowrap"), "same URL guard for the recruiter 1-pager");
  assert(RESUME_CSS.includes("a, .nowrap { white-space: nowrap; }"),  // full selector: .crow .loc/.trow .d also say nowrap
    "same URL guard for the full resume, which has no profile CSS of its own");
  assert(RESUME_CSS.includes("align-items: baseline"), "job header columns share one baseline → linear extraction");
  assert(FULL_RESUME_CSS.includes("font-size") && !ONEPAGER_CSS.includes("font-size"),
    "the mirror owns its one body size; the one-pager stays at the reference 11pt — content is cut, not type");
  console.log("selftest OK");
}

async function main(): Promise<void> {
  const argv = Bun.argv.slice(2);
  if (argv.length < 1) fail(DOC);
  if (argv[0] === "--selftest") return selftest();
  const txtPath = argv[0];
  const stem = basename(txtPath, extname(txtPath));
  if (!(await Bun.file(txtPath).exists())) fail(`FAIL no such file: ${txtPath}`);
  const maxPages = argv.length > 1 ? Number(argv[1]) : 1;
  if (argv.length > 1 && (!/^\d+$/.test(argv[1]) || !Number.isFinite(maxPages) || maxPages <= 0)) {
    fail(`FAIL max_pages must be a positive integer, got ${pyRepr(argv[1])}`);
  }
  // fail fast: without the pdf libs we'd emit a PDF that is never verified nor metadata-stamped
  let extractText: any, getDocumentProxy: any, PDFDocument: any, PDFName: any, PDFString: any;
  try {
    ({ extractText, getDocumentProxy } = await import("unpdf"));
    ({ PDFDocument, PDFName, PDFString } = await import("pdf-lib"));
  } catch {
    fail("FAIL unpdf + pdf-lib are required (wording verify + Title/Author stamp) — bun add unpdf pdf-lib");
  }
  const chrome = findChrome();  // before any output is written, so a Chrome-less run leaves no orphan .print.html
  const txt = await Bun.file(txtPath).text();
  const htmlPath = withSuffix(txtPath, ".print.html");
  const pdfPath = withSuffix(txtPath, ".pdf");
  const tmpPath = withSuffix(txtPath, ".tmp.pdf");  // verify BEFORE touching the real .pdf — a failed run must not leave a broken artifact
  let pages: number;
  try {
    const html = toHtml(txt, stem);
    await Bun.write(htmlPath, html);
    const proc = Bun.spawn(
      [chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        `--print-to-pdf=${chromePath(tmpPath, chrome)}`, chromePath(htmlPath, chrome)],
      { stdout: "pipe", stderr: "pipe", timeout: 120_000 },
    );
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;
    if (proc.exitCode === null) fail("FAIL Chrome timed out after 120s");
    if (proc.exitCode !== 0) fail(`FAIL Chrome exited ${proc.exitCode}: ${stderr.slice(-500)}`);
    if (!existsSync(tmpPath)) fail("FAIL Chrome produced no PDF (exit 0, nothing written)");
    const bytes = new Uint8Array(await Bun.file(tmpPath).arrayBuffer());
    // pdf.js detaches the buffer it is handed, so give it a copy — bytes is reused for the stamp
    const doc = await getDocumentProxy(new Uint8Array(bytes));
    const { totalPages, text } = await extractText(doc, { mergePages: true });
    pages = totalPages;

    // one URI annotation per link: a URL wrapped across a line or page gets one per fragment,
    // poppler/ATS then de-hyphenate it into a 404 — and canon() cannot see the break
    const uris = new Set<string>();
    let links = 0;
    for (let p = 1; p <= totalPages; p++) {
      for (const a of await (await doc.getPage(p)).getAnnotations()) {
        if (a.url ?? a.unsafeUrl) { links++; uris.add(a.url ?? a.unsafeUrl); }
      }
    }
    const hrefs = html.split('href="').length - 1;
    if (links !== hrefs) fail(`FAIL ${links} link annotations for ${hrefs} links: a URL wrapped across a line or page`);
    // every "label <target>" in the header must survive as a clickable URI action
    const targets = headerTargets(txt);
    if (targets.length) {
      const missing = targets.filter(([, href]) => !uris.has(href)).map(([, href]) => href);
      if (missing.length) fail(`FAIL header link annotation missing: ${missing.join(", ")} (found: ${[...uris].join(", ") || "none"})`);
      const unlabelled = targets.filter(([label]) => !text.includes(label)).map(([label]) => label);
      if (unlabelled.length) fail(`FAIL header link label not visible in the PDF text: ${unlabelled.join(", ")}`);
    }
    const a = canon(visibleText(txt)), b = canon(text);
    if (a !== b) {
      const n = Math.min(a.length, b.length);
      let k = n;
      for (let j = 0; j < n; j++) {
        if (a[j] !== b[j]) { k = j; break; }
      }
      fail(`FAIL wording mismatch at char ${k}: txt=...${pyRepr(a.slice(k, k + 60))} pdf=...${pyRepr(b.slice(k, k + 60))}`);
    }
    if (pages > maxPages) fail(`FAIL ${pages} pages (must be <= ${maxPages})`);

    // stamp viewer-facing metadata (Chrome sets /Title from <title>; /Author and a
    // reliable document /Lang — id for the Indonesian one-pager — need a pass)
    const head0 = splitlines(txt).find((l) => l.trim())!.trim();
    // updateMetadata:false keeps Chrome's /Producer + /ModDate, matching pypdf's clone_from
    const writer = await PDFDocument.load(bytes, { updateMetadata: false });
    writer.setTitle(docTitle(stem, head0));
    writer.setAuthor(pyTitle(head0));
    writer.catalog.set(PDFName.of("Lang"), PDFString.of(stem.includes("-id-") ? "id" : "en"));
    // stamp into the verified temp, then rename: a run killed mid-write never leaves a truncated .pdf
    await Bun.write(tmpPath, await writer.save());
    renameSync(tmpPath, pdfPath);
  } finally {
    rmSync(htmlPath, { force: true });
    rmSync(tmpPath, { force: true });
  }
  console.log(`OK ${basename(pdfPath)}: ${pages} page(s), wording verified identical to ${basename(txtPath)}`);
}

if (import.meta.main) {
  try {
    await main();
  } catch (err) {
    if (!(err instanceof Fail)) throw err;
    process.stderr.write(err.message + "\n");
    process.exit(1);
  }
}
