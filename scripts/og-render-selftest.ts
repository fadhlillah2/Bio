// Run: bun scripts/og-render-selftest.ts — real Chrome, temporary screenshots only.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findChrome } from "../cv/build-pdf.ts";

assert(!findChrome().endsWith(".exe"), "This file:// render check requires native Chrome");
const temp = mkdtempSync(join(tmpdir(), "bio-og-check-"));
try {
  mkdirSync(join(temp, "scripts"));
  mkdirSync(join(temp, "cv"));
  await Bun.write(join(temp, "cv/build-pdf.ts"), Bun.file(new URL("../cv/build-pdf.ts", import.meta.url)));
  const renderer = await Bun.file(new URL("./og-render.ts", import.meta.url)).text();
  const preload = join(temp, "check-dom.ts");
  await Bun.write(preload, `
    import assert from 'node:assert/strict';
    const spawn = Bun.spawnSync;
    Bun.spawnSync = (args, options) => {
      const result = spawn([...args, '--dump-dom'], {...options, stdout: 'pipe', timeout: 15_000});
      assert.equal(result.exitCode, 0, 'Chrome must finish');
      assert(result.stdout.toString().includes('OG_SENTINEL_LOADED'), 'Chrome must load the template, not an error page');
      return result;
    };
  `);
  for (const directory of ["normal", "space #question?percent%25"]) {
    const root = join(temp, directory);
    for (const folder of ["scripts/og", "static/assets/img"]) mkdirSync(join(root, folder), { recursive: true });
    // Bun's module loader treats '?' in entry paths specially; vary only the renderer's asset root.
    const rootLine = 'const ROOT = resolve(import.meta.dir, "..");';
    assert(renderer.includes(rootLine));
    await Bun.write(join(temp, "scripts/og-render.ts"), renderer.replace(rootLine, `const ROOT = ${JSON.stringify(root)};`));
    for (const name of ["cover", "writeup-hybrid-retrieval"]) {
      await Bun.write(join(root, `scripts/og/${name}.html`), "<!doctype html><p>OG_SENTINEL_LOADED</p>");
    }
    const result = Bun.spawnSync([process.execPath, "--preload", preload, join(temp, "scripts/og-render.ts")], { timeout: 40_000 });
    assert.equal(result.exitCode, 0, `${directory}:\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout.toString(), /OK\s+og-cover\.png: 1200×630/);
    assert.match(result.stdout.toString(), /OK\s+og-writeup-retrieval\.png: 1200×630/);
    console.log(`OK   OG templates load from ${directory}`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
