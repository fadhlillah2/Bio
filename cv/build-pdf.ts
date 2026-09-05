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
import { existsSync, rmSync } from "node:fs";
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

// Resume profiles keep labels inline so column-aware extractors preserve the reading order.
export const RESUME_CSS = `
h1 { text-align: left; font-size: 22pt; line-height: 1.05; }
.hl { text-align: left; font-size: 9.4pt; margin-top: 1.2mm; text-wrap: initial; }
.ct { text-align: left; font-size: 8.2pt; line-height: 1.25; }
h2 { font-size: 10pt; letter-spacing: 0; border-bottom: 0.5pt solid #aaa;
     padding-bottom: 0.6mm; margin: 2mm 0 1mm; }
.b { padding-left: 3.2mm; text-indent: -3.2mm; break-inside: avoid; }
.b .m { display: inline-block; width: calc(3.2mm - 0.278em); text-indent: 0; }
.crow { margin-top: 1.5mm; }
.trow { margin: 0.3mm 0 0.5mm; }
.crow .loc, .trow .d { font-size: 8.5pt; }
.sk { padding-left: 0; text-indent: 0; }
.alias { font-size: 7.4pt; color: #555; }
p.body { orphans: 2; widows: 2; }
a, .nowrap { white-space: nowrap; }
`;

// Long experience entries may break between project groups, with each bullet run kept together.
export const FULL_RESUME_CSS = `
@page { margin: 9mm 10mm; }
body { font-size: 9pt; line-height: 1.15; }
.job { break-inside: avoid; }
.job:has(> p.body) { break-inside: auto; }
.job > .b:has(+ .b) { break-after: avoid; }
.job > p.body { margin-top: 0.7mm; break-after: avoid; }
`;

// The skills inventory uses a compact profile so all existing content still fits one page.
export const ONEPAGER_CSS = `
@page { margin: 8mm 10mm; }
body.onepager { font-size: 8.9pt; line-height: 1.15; }
body.onepager h2 { margin-top: 1.3mm; margin-bottom: 0.7mm; }
body.onepager .crow { margin-top: 1mm; }
body.onepager .trow { margin: 0.1mm 0 0.2mm; }
body.onepager .sk { font-size: 8.6pt; line-height: 1.13; }
body.onepager .alias { margin-top: 0.6mm; }
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
const pyTitle = (s: string) => s.replace(/\p{L}+/gu, capitalize);
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

export function twoCol(line: string): string[] | null {
  const parts = line.trim().split(/\s{2,}/);
  return parts.length === 2 ? parts : null;
}

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
  const head: string[] = [];
  let i = 0;
  while (head.length < 4) {  // name, headline, contact x2
    if (i >= lines.length) fail("FAIL header incomplete: need 4 non-blank lines (name, headline, contact x2)");
    if (lines[i].trim()) head.push(lines[i].trim());
    i++;
  }
  const e = (s: string) => {
    const linked = linkify(escapeHtml(s));
    if (stem.includes("consulting")) return linked;
    // Keep compound words intact: PDF readers can remove a literal hyphen at a line break.
    return linked.replace(/<a\b[^>]*>.*?<\/a>|[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+/g,
      (part) => part.startsWith("<a ") ? part : `<span class="nowrap">${part}</span>`);
  };
  const out = [`<h1>${e(head[0])}</h1>`, `<p class="hl">${e(head[1])}</p>`,
    `<p class="ct">${e(head[2])}</p>`, `<p class="ct">${e(head[3])}</p>`];
  let section: string | null = null;
  let unit: [string, string] | null = null;  // pending (kind, text) being accumulated
  let jobOpen = false;  // a <div class="job"> wraps each company block so it won't split across pages

  const flush = () => {
    if (!unit) return;
    const [kind, text] = unit;
    if (kind === "b") {
      out.push(`<div class="b"><span class="m">&bull;</span> ${e(text)}</div>`);
    } else if (kind === "sk") {
      const at = text.indexOf(" : ");  // str.partition
      const [label, rest] = at < 0 ? [text, ""] : [text.slice(0, at), text.slice(at + 3)];
      out.push(`<div class="sk"><b>${e(label)}</b> : ${e(rest)}</div>`);
    } else {
      out.push(`<p class="body">${e(text)}</p>`);
    }
    unit = null;
  };

  const closeJob = () => {
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
    } else if (cols && section !== "SUMMARY") {
      flush();
      const cls = isUpper(cols[0]) ? ["crow", "c", "loc"] : ["trow", "t", "d"];
      if (cls[0] === "crow") {  // a new company block starts — keep it on one page
        closeJob();
        out.push('<div class="job">');
        jobOpen = true;
      }
      out.push(`<div class="${cls[0]}"><span class="${cls[1]}">${e(cols[0])}</span>`
        + `<span class="${cls[2]}">${e(cols[1])}</span></div>`);
    } else if (section === "SUMMARY" && unit) {  // summary wraps without indent
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

export function canon(s: string): string {
  s = s.replace(/^\s*- /gm, " ");   // txt bullet markers
  s = s.replaceAll("•", " ");       // rendered bullet glyphs
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
  assert(h.includes('<div class="b"><span class="m">&bull;</span> bullet one wrapped tail</div>'), "bullet wrap");
  assert(h.includes('<div class="sk"><b>AI/LLM</b> : RAG, agents</div>'), "skills row");
  assert(h.includes('<p class="body">Prose line one wrapping without indent.</p>'), "summary wrap");
  assert(toHtml(src, "consulting-onepager-id-v9.9").includes("<html lang='id'>"), "id lang");
  assert(canon("- a  b\nc") === canon("• a b c") && canon("ab") !== canon("ac"), "canon");
  assert(canon("Bank·Jakarta") === canon("Bank Jakarta"), "header separator middot ignored in verify");
  assert(toHtml(src, "consulting-onepager-en-v9.9").includes('class="consulting"')
    && toHtml(src, "consulting-onepager-en-v9.9").includes("body.consulting"), "page-fill overrides applied");
  assert(!toHtml(src, "resume-v9.9-test").includes('class="consulting"'), "only for consulting docs");
  assert(toHtml(src, "resume-onepager-v9.9").includes('class="onepager"')
    && toHtml(src, "resume-onepager-v9.9").includes("body.onepager"), "1-pager densify applied");
  assert(toHtml(src, "resume-onepager-v9.9").includes("<title>Name — Resume One-Pager v9.9</title>"), "1-pager title");
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
    .includes('<div class="b"><span class="m">&bull;</span> a : b</div>'), "bullet with ' : ' stays a bullet");
  const compounds = toHtml(src.replace("- bullet one", "- field-level RBAC; github.com/x/rate-limiter"), "resume-v9.9-test");
  assert(compounds.includes('<span class="nowrap">field-level</span>'), "literal hyphen survives a line wrap");
  assert(compounds.includes('<a href="https://github.com/x/rate-limiter">github.com/x/rate-limiter</a>'),
    "compound-word formatting leaves proof links intact");
  // render-behaviour guards (can't run Chrome here, so lock the CSS the render depends on):
  assert(CSS.includes("letter-spacing: 0"), "h1 name extracts as one token FADHLILLAH, not FA D H L...");
  assert(CONSULTING_CSS.includes("white-space: nowrap"), "proof URLs never wrap→de-hyphenate into 404s");
  assert(ONEPAGER_CSS.includes("white-space: nowrap"), "same URL guard for the recruiter 1-pager");
  console.log("selftest OK");
}

async function main(): Promise<void> {
  const argv = Bun.argv.slice(2);
  if (argv.length < 1) fail(DOC);
  if (argv[0] === "--selftest") return selftest();
  const txtPath = argv[0];
  const stem = basename(txtPath, extname(txtPath));
  if (!(await Bun.file(txtPath).exists())) fail(`FAIL no such file: ${txtPath}`);
  if (argv.length > 1 && !/^\d+$/.test(argv[1])) {
    fail(`FAIL max_pages must be a positive integer, got ${pyRepr(argv[1])}`);
  }
  const maxPages = argv.length > 1 ? parseInt(argv[1], 10) : 1;
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
  await Bun.write(htmlPath, toHtml(txt, stem));
  try {
    const proc = Bun.spawn(
      [chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
        `--print-to-pdf=${chromePath(tmpPath, chrome)}`, chromePath(htmlPath, chrome)],
      { stdout: "pipe", stderr: "pipe", timeout: 120_000 },
    );
    const stderr = await new Response(proc.stderr).text();
    await proc.exited;
    if (proc.exitCode === null) fail("FAIL Chrome timed out after 120s");
    if (proc.exitCode !== 0) fail(`FAIL Chrome exited ${proc.exitCode}: ${stderr.slice(-500)}`);
  } finally {
    rmSync(htmlPath, { force: true });
  }

  let pages: number;
  try {
    const bytes = new Uint8Array(await Bun.file(tmpPath).arrayBuffer());
    // pdf.js detaches the buffer it is handed, so give it a copy — bytes is reused for the stamp
    const { totalPages, text } = await extractText(await getDocumentProxy(new Uint8Array(bytes)), { mergePages: true });
    pages = totalPages;
    const a = canon(txt), b = canon(text);
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
    await Bun.write(pdfPath, await writer.save());
  } finally {
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
