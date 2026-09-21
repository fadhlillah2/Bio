// Run: bun scripts/og-render-selftest.ts — real Chrome, temporary screenshots only.
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { findChrome } from "../cv/build-pdf.ts";

assert(!findChrome().endsWith(".exe"), "This file:// render check requires native Chrome");
const repo = resolve(import.meta.dir, "..");
const CARDS = ["cover", "writeup-hybrid-retrieval", "writeup-fox-asset-project-management"];
const template = (name: string) => readFileSync(join(repo, `scripts/og/${name}.html`), "utf8");

// --- Repo-side checks: everything below this block renders copies, so these read the real shipped files.
const pngSize = (b: Buffer): [number, number] =>
  b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? [b.readUInt32BE(16), b.readUInt32BE(20)] : [0, 0];
const jpegSize = (b: Buffer): [number, number] => {
  if (b[0] !== 0xff || b[1] !== 0xd8) return [0, 0];
  for (let i = 2; i + 9 < b.length && b[i] === 0xff; i += 2 + b.readUInt16BE(i + 2)) {
    // SOF0..SOF15 carry the frame size; DHT/JPG/DAC sit in the same marker range and do not
    if (b[i + 1] >= 0xc0 && b[i + 1] <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(b[i + 1])) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
  }
  return [0, 0];
};
const unusable = (file: string): string => {
  let bytes: Buffer;
  try { bytes = readFileSync(join(repo, file)); } catch { return "missing"; }
  if (file.endsWith(".woff2")) return bytes.subarray(0, 4).toString("latin1") === "wOF2" ? "" : "not a woff2";
  const [width, height] = file.endsWith(".png") ? pngSize(bytes) : jpegSize(bytes);
  return width > 1 && height > 1 ? "" : `not a usable image (${width}×${height})`;
};

const templateAssets = new Set<string>();
for (const name of CARDS) {
  for (const match of template(name).matchAll(/(?:src=|url\()"([^"]+)"/g)) {
    templateAssets.add(relative(repo, resolve(repo, "scripts/og", match[1])));
  }
}
assert(templateAssets.size >= 3, "templates must reference the portrait and the self-hosted fonts");
const shipped = new Set(templateAssets);
for await (const path of new Bun.Glob("src/**/*.svelte").scan({ cwd: repo })) {
  for (const match of readFileSync(join(repo, path), "utf8").matchAll(/(?:og:image|twitter:image)" content="([^"]+)"/g)) {
    shipped.add(join("static", new URL(match[1]).pathname.replace(/^\/Bio\//, "")));
  }
}
assert(shipped.size > templateAssets.size, "src/ must declare og:image/twitter:image cards");
for (const file of [...shipped].sort()) assert.equal(unusable(file), "", `referenced asset ${file}: ${unusable(file)}`);
console.log(`OK   ${shipped.size} referenced card assets exist on disk with a valid signature and size`);

// Copy the templates must mirror in the components they advertise; the hybrid deck is a deliberate condensation.
const MIRROR: [string, string, RegExp][] = [
  ["cover", "src/lib/components/Hero.svelte", /<h1[^>]*>([\s\S]*?)<\/h1>/],
  ["writeup-hybrid-retrieval", "src/routes/writeups/hybrid-retrieval/+page.svelte", /<h1[^>]*>([\s\S]*?)<\/h1>/],
  ["writeup-fox-asset-project-management", "src/routes/writeups/fox-asset-project-management/+page.svelte", /<h1[^>]*>([\s\S]*?)<\/h1>/],
  ["writeup-fox-asset-project-management", "src/routes/writeups/fox-asset-project-management/+page.svelte", /<p class="deck">([\s\S]*?)<\/p>/],
];
const plain = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
for (const [name, source, pattern] of MIRROR) {
  const copy = plain(template(name).match(pattern)![1]);
  assert(plain(readFileSync(join(repo, source), "utf8")).includes(copy), `${name}: "${copy}" is not in ${source} verbatim`);
  console.log(`OK   ${name} mirrors ${source}: "${copy.slice(0, 60)}${copy.length > 60 ? "…" : ""}"`);
}

const temp = mkdtempSync(join(tmpdir(), "bio-og-check-"));
try {
  mkdirSync(join(temp, "scripts"));
  mkdirSync(join(temp, "cv"));
  await Bun.write(join(temp, "cv/build-pdf.ts"), Bun.file(new URL("../cv/build-pdf.ts", import.meta.url)));
  const renderer = await Bun.file(new URL("./og-render.ts", import.meta.url)).text();
  for (const directory of ["normal", "space #question?percent%25"]) {
    const root = join(temp, directory);
    for (const folder of ["scripts/og", "static/assets/img"]) mkdirSync(join(root, folder), { recursive: true });
    for (const asset of templateAssets) {
      mkdirSync(join(root, dirname(asset)), { recursive: true });
      await Bun.write(join(root, asset), Bun.file(join(repo, asset)));
    }
    // Bun's module loader treats '?' in entry paths specially; vary only the renderer's asset root.
    const rootLine = 'const ROOT = resolve(import.meta.dir, "..");';
    assert(renderer.includes(rootLine));
    await Bun.write(join(temp, "scripts/og-render.ts"), renderer.replace(rootLine, `const ROOT = ${JSON.stringify(root)};`));
    for (const name of CARDS) await Bun.write(join(root, `scripts/og/${name}.html`), template(name));
    const result = Bun.spawnSync([process.execPath, join(temp, "scripts/og-render.ts")], { timeout: 40_000 });
    assert.equal(result.exitCode, 0, `${directory}:\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout.toString(), /OK\s+og-cover\.png: 1200×630/);
    assert.match(result.stdout.toString(), /OK\s+og-writeup-retrieval\.png: 1200×630/);
    assert.match(result.stdout.toString(), /OK\s+og-writeup-fox-asset-project-management\.png: 1200×630/);
    console.log(`OK   OG templates load from ${directory}`);

    const outputs = ["og-cover.png", "og-writeup-retrieval.png", "og-writeup-fox-asset-project-management.png"].map(name => join(root, "static/assets/img", name));
    const original = await Promise.all(outputs.map(path => Bun.file(path).bytes()));
    for (const path of outputs) chmodSync(path, 0o444);
    for (const name of CARDS) {
      await Bun.write(join(root, `scripts/og/${name}.html`), template(name).replace("</style>", "body { background: red; }\n</style>"));
    }
    const fresh = Bun.spawnSync([process.execPath, join(temp, "scripts/og-render.ts")], { timeout: 40_000 });
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
      assert.deepEqual(readdirSync(join(root, "static/assets/img")).sort(), ["og-cover.png", "og-writeup-fox-asset-project-management.png", "og-writeup-retrieval.png", "portrait.jpg"], "temporary outputs cleaned");
      console.log(`OK   ${fault}: failure preserves final PNGs and cleans temporary files`);
    }
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
