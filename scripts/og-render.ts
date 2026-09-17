/**
 * Renders the Open Graph cards in scripts/og/*.html to static/assets/img/og-*.png
 * (1200×630) with Chrome headless — the same Chrome lookup cv/build-pdf.ts uses.
 * Run after the copy in a template changes: bun run og
 */
import { mkdtempSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { findChrome, chromePath } from "../cv/build-pdf.ts";

const ROOT = resolve(import.meta.dir, "..");
const CARDS: Record<string, string> = {
  cover: "og-cover.png",
  "writeup-hybrid-retrieval": "og-writeup-retrieval.png",
};
const W = 1200, H = 630;

const chrome = findChrome();
const wsl = chrome.endsWith(".exe");
const fileUrl = (p: string) => pathToFileURL(wsl ? "/" + chromePath(p, chrome).replaceAll("\\", "/") : p).href;

let failed = 0;
for (const [stem, png] of Object.entries(CARDS)) {
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
      `--screenshot=${chromePath(fresh, chrome)}`, fileUrl(html),
    ], { stdout: "ignore", stderr: "ignore" });

    if (run.exitCode !== 0) throw new Error(`Chrome exited ${run.exitCode}`);
    const bytes = await Bun.file(fresh).bytes();
    // PNG IHDR: width at byte 16, height at byte 20 (big-endian)
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const size = bytes.length > 24 ? [view.getUint32(16), view.getUint32(20)] : [0, 0];
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!signature.every((byte, i) => bytes[i] === byte) || size[0] !== W || size[1] !== H) {
      throw new Error(`invalid PNG or dimensions: ${size[0]}×${size[1]}`);
    }
    renameSync(fresh, out);
    console.log(`OK   ${png}: ${size[0]}×${size[1]}, ${bytes.length} bytes (chrome exit ${run.exitCode})`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${png}: ${error instanceof Error ? error.message : error}`);
  } finally {
    if (temp) rmSync(temp, { recursive: true, force: true });
  }
}
process.exit(failed ? 1 : 0);
