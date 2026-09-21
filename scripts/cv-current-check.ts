/** Check current CV artifacts without Chrome (pdftoppm rasterises them). Run with Bun; --selftest uses temporary mutations. */
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { PDFDocument, PDFName, rgb } from "pdf-lib";
import { extractText, getDocumentProxy } from "unpdf";
import { canon, docTitle, headerLines, pyTitle, toHtml, visibleText } from "../cv/build-pdf.ts";

const ROOT = resolve(import.meta.dir, "..");

/** Mean darkness in % over every page of `pdftoppm -gray` output (concatenated binary PGMs). */
function meanInk(pgm: Uint8Array): number {
  let offset = 0, dark = 0, pixels = 0;
  while (offset < pgm.length) {
    const header = /^P5\s+(\d+)\s+(\d+)\s+255\s/.exec(new TextDecoder("latin1").decode(pgm.subarray(offset, offset + 32)));
    assert(header, "pdftoppm output is not binary PGM");
    const n = Number(header[1]) * Number(header[2]);
    offset += header[0].length;
    for (let k = 0; k < n; k++) dark += 255 - pgm[offset + k];
    offset += n; pixels += n;
  }
  assert(pixels > 0, "pdftoppm rendered no pixels");
  return dark / (255 * pixels) * 100;
}

async function checkCurrent(root: string): Promise<void> {
  // Artifact families are the contract; versions come only from current sources. Per family: page
  // budget; ink floor = % mean darkness of the rasterised pages at 36 dpi, about half of each
  // healthy artifact (6.0 / 6.4 / 7.4 / 5.4 on 2026-09-21; white type or a white box leaves < 1.6);
  // h1 = the name's glyph size in pt (body size x 1.4545 — Chrome's shrink-to-fit scales every item).
  const contract: Record<string, { pages: number; ink: number; h1: number }> = {
    resume: { pages: 2, ink: 2.5, h1: 12.36 }, "resume-onepager": { pages: 1, ink: 3.5, h1: 15.9975 },
    "consulting-onepager-en": { pages: 1, ink: 3, h1: 24 }, "consulting-onepager-id": { pages: 1, ink: 3, h1: 24 } };
  assert(Bun.which("pdftoppm"), "pdftoppm (poppler-utils) is required: the ink gate rasterises every PDF");
  const files = readdirSync(join(root, "cv")).filter(n => /\.(txt|pdf)$/.test(n)).sort();
  const sources = files.filter(n => n.endsWith(".txt"));
  const families = sources.map(n => /^(.*)-v\d+\.\d+\.txt$/.exec(n)?.[1]);
  assert.deepEqual([...families].sort(), Object.keys(contract).sort(), "current sources: exactly one version per artifact family required");
  const expected = sources.flatMap(n => [n, n.replace(/\.txt$/, ".pdf")]).sort();
  assert.deepEqual(files, expected, "current files: each current source needs its matching PDF, no stale artifacts");

  for (const [i, file] of sources.entries()) {
    const stem = file.slice(0, -4), pdfFile = stem + ".pdf", spec = contract[families[i]!];
    const txt = readFileSync(join(root, "cv", file), "utf8");
    const bytes = readFileSync(join(root, "cv", pdfFile));
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    assert(pdf.getPageCount() > 0 && pdf.getPageCount() <= spec.pages, `${pdfFile}: pages exceed ${spec.pages}`);
    const name = headerLines(txt)[0];
    assert.equal(pdf.getTitle(), docTitle(stem, name), `${pdfFile}: title mismatch`);
    assert.equal(pdf.getAuthor(), pyTitle(name), `${pdfFile}: author mismatch`);
    assert.equal(pdf.catalog.get(PDFName.of("Lang"))?.toString(), stem.includes("-id-") ? "(id)" : "(en)", `${pdfFile}: lang mismatch`);
    const doc = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(doc, { mergePages: true });
    const actual = canon(text), wanted = canon(visibleText(txt));
    assert(actual === wanted, `${pdfFile}: wording differs from ${file}`);
    const uris = new Set<string>();
    let links = 0;
    for (let p = 1; p <= doc.numPages; p++) {
      for (const a of await (await doc.getPage(p)).getAnnotations()) {
        if (a.url ?? a.unsafeUrl) { links++; uris.add(a.url ?? a.unsafeUrl); }
      }
    }
    // Undo only the five HTML entities emitted by the generator, once each.
    const entities: Record<string, string> = { "&quot;": '"', "&#x27;": "'", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
    const hrefs = [...toHtml(txt, stem).matchAll(/href="([^"]*)"/g)]
      .map(match => match[1].replace(/&(?:quot|#x27|lt|gt|amp);/g, entity => entities[entity]));
    // a link wrapped across a line or page gets one annotation per fragment; canon() cannot see the break
    assert.equal(links, hrefs.length, `${pdfFile}: ${links} link annotations for ${hrefs.length} links (a URL wrapped?)`);
    for (const href of hrefs) assert(uris.has(href), `${pdfFile}: missing link annotation ${href}`);
    const h1 = ((await (await doc.getPage(1)).getTextContent()).items as { str?: string; height: number }[]).find(item => item.str?.trim());
    assert(h1 && Math.abs(h1.height - spec.h1) < 0.01, `${pdfFile}: h1 renders at ${h1?.height.toFixed(2)}pt, expected ${spec.h1}pt (shrink-to-fit?)`);
    const raster = Bun.spawnSync(["pdftoppm", "-gray", "-r", "36", join(root, "cv", pdfFile)]);
    assert(raster.success, `${pdfFile}: pdftoppm failed: ${raster.stderr}`);
    const ink = meanInk(new Uint8Array(raster.stdout));
    assert(ink >= spec.ink, `${pdfFile}: ink coverage ${ink.toFixed(2)}% is below the ${spec.ink}% floor (white type?)`);
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
    for (const field of ["title", "author", "lang", "pages", "links", "wrapped", "ink", "h1"]) {
      const doc = await PDFDocument.load(original, { updateMetadata: false });
      const [first] = doc.getPages();
      if (field === "title") doc.setTitle("Wrong title");
      if (field === "author") doc.setAuthor("Wrong author");
      if (field === "lang") doc.catalog.set(PDFName.of("Lang"), PDFName.of("wrong"));
      if (field === "pages") doc.addPage();
      if (field === "links") for (const page of doc.getPages()) page.node.delete(PDFName.of("Annots"));
      if (field === "wrapped") first.node.Annots()!.push(first.node.Annots()!.get(0));  // a second fragment of one link
      if (field === "ink") first.drawRectangle({ x: 0, y: 0, width: first.getWidth(), height: first.getHeight(), color: rgb(1, 1, 1) });
      if (field === "h1") first.scaleContent(0.7366, 0.7366);  // Chrome's shrink-to-fit on an over-wide URL
      await rejects(pdf, await doc.save(), new RegExp({ links: "link", wrapped: "link annotations", ink: "ink coverage" }[field] ?? field, "i"));
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
