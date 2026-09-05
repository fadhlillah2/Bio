/**
 * Renders the Open Graph cards in scripts/og/*.html to static/assets/img/og-*.png
 * (1200×630) with Chrome headless — the same Chrome lookup cv/build-pdf.ts uses.
 * Run after the copy in a template changes: bun run og
 */
import { resolve } from "node:path";
import { findChrome, chromePath } from "../cv/build-pdf.ts";

const ROOT = resolve(import.meta.dir, "..");
const CARDS: Record<string, string> = {
  cover: "og-cover.png",
  "writeup-hybrid-retrieval": "og-writeup-retrieval.png",
};
const W = 1200, H = 630;

const chrome = findChrome();
const wsl = chrome.endsWith(".exe");
const fileUrl = (p: string) => (wsl ? "file:///" + chromePath(p, chrome).replaceAll("\\", "/") : "file://" + p);

let failed = 0;
for (const [stem, png] of Object.entries(CARDS)) {
  const html = resolve(ROOT, "scripts/og", `${stem}.html`);
  const out = resolve(ROOT, "static/assets/img", png);
  const run = Bun.spawnSync([
    chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--allow-file-access-from-files", // the templates load the self-hosted fonts over file://
    "--force-device-scale-factor=1", `--window-size=${W},${H}`, "--virtual-time-budget=3000",
    `--screenshot=${chromePath(out, chrome)}`, fileUrl(html),
  ], { stdout: "ignore", stderr: "ignore" });

  const bytes = run.exitCode === 0 ? await Bun.file(out).bytes() : new Uint8Array();
  // PNG IHDR: width at byte 16, height at byte 20 (big-endian)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const size = bytes.length > 24 ? [view.getUint32(16), view.getUint32(20)] : [0, 0];
  const ok = size[0] === W && size[1] === H;
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"} ${png}: ${size[0]}×${size[1]}, ${bytes.length} bytes (chrome exit ${run.exitCode})`);
}
process.exit(failed ? 1 : 0);
