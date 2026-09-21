/**
 * Renders the Open Graph cards in scripts/og/*.html to static/assets/img/og-*.png
 * (1200×630) with Chrome headless — the same Chrome lookup cv/build-pdf.ts uses.
 * Run after the copy in a template changes: bun run og
 */
import { mkdtempSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inflateSync } from "node:zlib";
import { findChrome, chromePath } from "../cv/build-pdf.ts";

const ROOT = resolve(import.meta.dir, "..");
// visible/text: DOM floors measured on healthy cards (cover 44/508, hybrid 12/279, fox 13/305).
// ink: lit-pixel band of the raster itself, because those DOM counters stay high when the paint layer
// breaks (opaque overlay, transparent text, content pushed off canvas). Both re-measure with a render.
const CARDS: Record<string, { png: string; visible: number; text: number; ink: [number, number] }> = {
  cover: { png: "og-cover.png", visible: 40, text: 470, ink: [18000, 52000] }, // healthy 25845 lit px
  "writeup-hybrid-retrieval": { png: "og-writeup-retrieval.png", visible: 11, text: 250, ink: [16000, 47000] }, // healthy 23510
  "writeup-fox-asset-project-management": { png: "og-writeup-fox-asset-project-management.png", visible: 11, text: 250, ink: [19000, 55000] }, // healthy 27581
};
const W = 1200, H = 630;

/** Pixels bright enough to read as ink in the PNG we are about to publish (8-bit RGB, non-interlaced). */
function litPixels(bytes: Uint8Array, view: DataView): number {
  if (bytes[24] !== 8 || bytes[25] !== 2 || bytes[28] !== 0) throw new Error(`unsupported PNG (depth ${bytes[24]}, color ${bytes[25]}, interlace ${bytes[28]})`);
  const idat: Uint8Array[] = [];
  for (let p = 8; p + 12 <= bytes.length; ) {
    const len = view.getUint32(p);
    if (String.fromCharCode(...bytes.subarray(p + 4, p + 8)) === "IDAT") idat.push(bytes.subarray(p + 8, p + 8 + len));
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = W * 3;
  const row = new Uint8Array(stride), prior = new Uint8Array(stride);
  let lit = 0;
  for (let y = 0, at = 0; y < H; y++) {
    const filter = raw[at++]; // PNG per-scanline predictor: 0 none, 1 sub, 2 up, 3 average, 4 paeth
    for (let i = 0; i < stride; i++) {
      const a = i >= 3 ? row[i - 3] : 0, b = prior[i], c = i >= 3 ? prior[i - 3] : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      else if (filter === 2) predictor = b;
      else if (filter === 3) predictor = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[i] = (raw[at + i] + predictor) & 255;
    }
    at += stride;
    for (let i = 0; i < stride; i += 3) if (0.2126 * row[i] + 0.7152 * row[i + 1] + 0.0722 * row[i + 2] >= 160) lit++;
    prior.set(row);
  }
  return lit;
}

const chrome = findChrome();
const wsl = chrome.endsWith(".exe");
const fileUrl = (p: string) => pathToFileURL(wsl ? "/" + chromePath(p, chrome).replaceAll("\\", "/") : p).href;

let failed = 0;
for (const [stem, card] of Object.entries(CARDS)) {
  const png = card.png;
  const html = resolve(ROOT, "scripts/og", `${stem}.html`);
  const out = resolve(ROOT, "static/assets/img", png);
  let temp: string | undefined;
  try {
    temp = mkdtempSync(join(dirname(out), ".og-render-"));
    const fresh = join(temp, png);
    const run = Bun.spawnSync([
      chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
      "--allow-file-access-from-files", // the templates load the self-hosted fonts over file://
      "--force-device-scale-factor=1", `--window-size=${W},${H}`, "--virtual-time-budget=3000",
      `--screenshot=${chromePath(fresh, chrome)}`, "--dump-dom", fileUrl(html),
    ], { stdout: "pipe", stderr: "ignore" });

    if (run.exitCode !== 0) throw new Error(`Chrome exited ${run.exitCode}`);
    const bytes = await Bun.file(fresh).bytes();
    // PNG IHDR: width at byte 16, height at byte 20 (big-endian)
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const size = bytes.length > 24 ? [view.getUint32(16), view.getUint32(20)] : [0, 0];
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((byte, i) => bytes[i] === byte) || size[0] !== W || size[1] !== H) {
      throw new Error(`invalid PNG or dimensions: ${size[0]}×${size[1]}`);
    }
    // The DOM comes back from the run that produced this PNG, so the counters describe this very frame.
    const tag = run.stdout.toString().match(/<html\b[^>]*>/)?.[0] ?? "";
    const mark = (name: string) => tag.match(new RegExp(`data-og-${name}="([^"]*)"`))?.[1] ?? "";
    if (mark("card") !== stem) throw new Error(`rendered page is not the ${stem} template (data-og-card="${mark("card")}")`);
    const [visible, text] = [Number(mark("visible")), Number(mark("text"))];
    if (!(visible >= card.visible) || !(text >= card.text)) {
      throw new Error(`too little painted: ${visible} visible elements (want ${card.visible}), ${text} chars of text (want ${card.text})`);
    }
    for (const kind of ["images", "fonts"]) {
      const [loaded, wanted] = mark(kind).split("/").map(Number);
      if (!(wanted > 0) || loaded !== wanted) throw new Error(`${loaded}/${wanted} ${kind} loaded`);
    }
    const lit = litPixels(bytes, view);
    if (lit < card.ink[0] || lit > card.ink[1]) {
      throw new Error(`raster ink out of band: ${lit} lit pixels (want ${card.ink[0]}–${card.ink[1]})`);
    }
    renameSync(fresh, out);
    console.log(`OK   ${png}: ${size[0]}×${size[1]}, ${bytes.length} bytes, ${lit} lit px (chrome exit ${run.exitCode})`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${png}: ${error instanceof Error ? error.message : error}`);
  } finally {
    if (temp) rmSync(temp, { recursive: true, force: true });
  }
}
process.exit(failed ? 1 : 0);
