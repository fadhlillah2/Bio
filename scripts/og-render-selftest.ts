// Run: bun scripts/og-render-selftest.ts — real Chrome, temporary screenshots only.
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from "node:fs";
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
    for (const name of ["cover", "writeup-hybrid-retrieval", "writeup-fox-asset-project-management"]) {
      await Bun.write(join(root, `scripts/og/${name}.html`), "<!doctype html><p>OG_SENTINEL_LOADED</p>");
    }
    const result = Bun.spawnSync([process.execPath, "--preload", preload, join(temp, "scripts/og-render.ts")], { timeout: 40_000 });
    assert.equal(result.exitCode, 0, `${directory}:\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout.toString(), /OK\s+og-cover\.png: 1200×630/);
    assert.match(result.stdout.toString(), /OK\s+og-writeup-retrieval\.png: 1200×630/);
    assert.match(result.stdout.toString(), /OK\s+og-writeup-fox-asset-project-management\.png: 1200×630/);
    console.log(`OK   OG templates load from ${directory}`);

    const outputs = ["og-cover.png", "og-writeup-retrieval.png", "og-writeup-fox-asset-project-management.png"].map(name => join(root, "static/assets/img", name));
    const original = await Promise.all(outputs.map(path => Bun.file(path).bytes()));
    for (const path of outputs) chmodSync(path, 0o444);
    for (const name of ["cover", "writeup-hybrid-retrieval", "writeup-fox-asset-project-management"]) {
      await Bun.write(join(root, `scripts/og/${name}.html`), '<!doctype html><body style="background:red">OG_SENTINEL_LOADED NEW CONTENT</body>');
    }
    const fresh = Bun.spawnSync([process.execPath, "--preload", preload, join(temp, "scripts/og-render.ts")], { timeout: 40_000 });
    for (let i = 0; i < outputs.length; i++) {
      const unchanged = Buffer.from(await Bun.file(outputs[i]).bytes()).equals(original[i]);
      assert(fresh.exitCode !== 0 || !unchanged, "successful regeneration must not reuse a readonly stale PNG");
      chmodSync(outputs[i], 0o644);
    }
    console.log(`OK   readonly output cannot produce stale success (${directory})`);

    for (const fault of ["no-output", "invalid", "rename"]) {
      const before = await Promise.all(outputs.map(path => Bun.file(path).bytes()));
      const inject = join(temp, "fault.ts");
      await Bun.write(inject, `
        import * as fs from 'node:fs';
        import { mock } from 'bun:test';
        if (${JSON.stringify(fault)} === 'rename') {
          mock.module('node:fs', () => ({...fs, renameSync: () => { throw new Error('injected rename failure'); }}));
        } else {
          Bun.spawnSync = args => {
            if (${JSON.stringify(fault)} === 'invalid') fs.writeFileSync(args.find(a=>a.startsWith('--screenshot=')).slice(13), 'invalid PNG');
            return {exitCode: 0};
          };
        }
      `);
      const failed = Bun.spawnSync([process.execPath, "--preload", inject, join(temp, "scripts/og-render.ts")], { timeout: 40_000 });
      assert.notEqual(failed.exitCode, 0, `${fault} must fail`);
      if (fault === "rename") assert.match(failed.stderr.toString(), /injected rename failure/);
      for (let i = 0; i < outputs.length; i++) assert(Buffer.from(await Bun.file(outputs[i]).bytes()).equals(before[i]), `${fault} preserves final PNG`);
      assert.deepEqual(readdirSync(join(root, "static/assets/img")).sort(), ["og-cover.png", "og-writeup-fox-asset-project-management.png", "og-writeup-retrieval.png"], "temporary outputs cleaned");
      console.log(`OK   ${fault}: failure preserves final PNGs and cleans temporary files`);
    }
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
