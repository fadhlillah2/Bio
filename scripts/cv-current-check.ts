/** Check current CV artifacts without rendering. Run with Bun; --selftest uses temporary mutations. */
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PDFDocument, PDFName } from "pdf-lib";
import { extractText, getDocumentProxy } from "unpdf";
import { canon, docTitle, headerLines, pyTitle, toHtml, visibleText } from "../cv/build-pdf.ts";

const ROOT = resolve(import.meta.dir, "..");

async function checkCurrent(root: string): Promise<void> {
  // Artifact families and page budgets are the contract; versions come only from current sources.
  const budgets: Record<string, number> = { resume: 2, "resume-onepager": 1,
    "consulting-onepager-en": 1, "consulting-onepager-id": 1 };
  const files = readdirSync(join(root, "cv")).filter(n => /\.(txt|pdf)$/.test(n)).sort();
  const sources = files.filter(n => n.endsWith(".txt"));
  const families = sources.map(n => /^(.*)-v\d+\.\d+\.txt$/.exec(n)?.[1]);
  assert.deepEqual([...families].sort(), Object.keys(budgets).sort(), "current sources: exactly one version per artifact family required");
  const expected = sources.flatMap(n => [n, n.replace(/\.txt$/, ".pdf")]).sort();
  assert.deepEqual(files, expected, "current files: each current source needs its matching PDF, no stale artifacts");

  for (const [i, file] of sources.entries()) {
    const stem = file.slice(0, -4), pdfFile = stem + ".pdf";
    const txt = readFileSync(join(root, "cv", file), "utf8");
    const bytes = readFileSync(join(root, "cv", pdfFile));
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    assert(pdf.getPageCount() > 0 && pdf.getPageCount() <= budgets[families[i]!], `${pdfFile}: pages exceed ${budgets[families[i]!]}`);
    const name = headerLines(txt)[0];
    assert.equal(pdf.getTitle(), docTitle(stem, name), `${pdfFile}: title mismatch`);
    assert.equal(pdf.getAuthor(), pyTitle(name), `${pdfFile}: author mismatch`);
    assert.equal(pdf.catalog.get(PDFName.of("Lang"))?.toString(), stem.includes("-id-") ? "(id)" : "(en)", `${pdfFile}: lang mismatch`);
    const doc = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(doc, { mergePages: true });
    const actual = canon(text), wanted = canon(visibleText(txt));
    assert(actual === wanted, `${pdfFile}: wording differs from ${file}`);
    const uris = new Set<string>();
    for (let p = 1; p <= doc.numPages; p++) {
      for (const a of await (await doc.getPage(p)).getAnnotations()) {
        if (a.url ?? a.unsafeUrl) uris.add(a.url ?? a.unsafeUrl);
      }
    }
    // Undo only the five HTML entities emitted by the generator, once each.
    const entities: Record<string, string> = { "&quot;": '"', "&#x27;": "'", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
    for (const match of toHtml(txt, stem).matchAll(/href="([^"]*)"/g)) {
      const href = match[1].replace(/&(?:quot|#x27|lt|gt|amp);/g, entity => entities[entity]);
      assert(uris.has(href), `${pdfFile}: missing link annotation ${href}`);
    }
  }

  assert.deepEqual(readdirSync(join(root, "static/cv")).sort(), expected, "static files: must contain only current PDF/TXT artifacts");
  for (const file of expected) {
    assert(readFileSync(join(root, "cv", file)).equals(readFileSync(join(root, "static/cv", file))), `${file}: static copy differs`);
  }
  const referenced = new Set<string>();
  for await (const path of new Bun.Glob("src/**/*.svelte").scan({ cwd: root })) {
    for (const match of readFileSync(join(root, path), "utf8").matchAll(/\/cv\/([^"'{}\s]+\.(?:pdf|txt))/g)) {
      assert(expected.includes(match[1]), `${path}: stale or missing CV reference ${match[1]}`);
      referenced.add(match[1]);
    }
  }
  for (const file of expected.filter(n => n.endsWith(".pdf"))) {
    assert(referenced.has(file), `${file}: missing site reference`);
  }
  const current = readFileSync(join(root, "cv/README.md"), "utf8").split(/^## Current[^\n]*$/m)[1]?.split(/^## /m)[0] ?? "";
  const listed = [...current.matchAll(/\]\(([^)]+\.pdf)\)/g)].map(m => m[1]).sort();
  assert.deepEqual(listed, expected.filter(n => n.endsWith(".pdf")), "README Current: PDF list differs from current sources");
}

async function selftest() {
  const root = mkdtempSync(join(tmpdir(), "bio-cv-current-"));
  try {
    mkdirSync(join(root, "cv"));
    mkdirSync(join(root, "static/cv"), { recursive: true });
    for (const name of readdirSync(join(ROOT, "cv")).filter(n => /\.(txt|pdf)$/.test(n))) {
      cpSync(join(ROOT, "cv", name), join(root, "cv", name));
      cpSync(join(ROOT, "cv", name), join(root, "static/cv", name));
    }
    cpSync(join(ROOT, "cv/README.md"), join(root, "cv/README.md"));
    cpSync(join(ROOT, "src"), join(root, "src"), { recursive: true });
    await checkCurrent(root);
    const name = readdirSync(join(root, "cv")).find(n => /^resume-onepager-v.*\.txt$/.test(n))!;
    const txt = join(root, "cv", name), pdf = txt.replace(/\.txt$/, ".pdf");
    const original = readFileSync(pdf);
    let cases = 0;
    const rejects = async (file: string, bytes: string | Uint8Array | null, diagnostic: RegExp) => {
      const previous = readFileSync(file);
      try {
        if (bytes === null) rmSync(file); else writeFileSync(file, bytes);
        await assert.rejects(() => checkCurrent(root), diagnostic);
        cases++;
      } finally { writeFileSync(file, previous); }
    };
    await rejects(txt, readFileSync(txt, "utf8") + "\nUNSOURCED TEXT\n", /wording/);
    for (const field of ["title", "author", "lang", "pages", "links"]) {
      const doc = await PDFDocument.load(original, { updateMetadata: false });
      if (field === "title") doc.setTitle("Wrong title");
      if (field === "author") doc.setAuthor("Wrong author");
      if (field === "lang") doc.catalog.set(PDFName.of("Lang"), PDFName.of("wrong"));
      if (field === "pages") doc.addPage();
      if (field === "links") for (const page of doc.getPages()) page.node.delete(PDFName.of("Annots"));
      await rejects(pdf, await doc.save(), new RegExp(field === "links" ? "link" : field, "i"));
    }
    await rejects(join(root, "static/cv", name), "stale copy", /static copy/);
    const component = join(root, "src/lib/components/Topbar.svelte");
    await rejects(component, readFileSync(component, "utf8").replace(name.replace(/\.txt$/, ".pdf"), "resume-onepager-v0.0.pdf"), /reference/);
    const readme = join(root, "cv/README.md");
    await rejects(readme, readFileSync(readme, "utf8").replaceAll(name.replace(/\.txt$/, ".pdf"), "resume-onepager-v0.0.pdf"), /README Current/);
    await rejects(pdf, null, /current files/);
    const stale = join(root, "static/cv/stale.tmp.pdf");
    writeFileSync(stale, "partial");
    try { await assert.rejects(() => checkCurrent(root), /static files/); cases++; }
    finally { rmSync(stale); }
    await checkCurrent(root);
    console.log(`OK CV current selftest: valid fixture + ${cases} rejected mutations`);
  } finally { rmSync(root, { recursive: true, force: true }); }
}

if (import.meta.main) {
  if (process.argv[2] === "--selftest") await selftest();
  else { await checkCurrent(ROOT); console.log("OK current CV artifacts, static copies, site references, README Current"); }
}
