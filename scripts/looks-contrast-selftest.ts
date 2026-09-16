// Run: bun scripts/looks-contrast-selftest.ts
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = mkdtempSync(join(tmpdir(), "bio-contrast-"));
try {
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "static/assets/css"), { recursive: true });
  const checker = join(root, "scripts/looks-contrast.ts");
  await Bun.write(checker, Bun.file(new URL("./looks-contrast.ts", import.meta.url)));
  const css = await Bun.file(new URL("../static/assets/css/style.css", import.meta.url)).text();
  for (const [label, from, to, expected] of [
    ["1:1 exception regression", "--ink-3: #161d29;", "--ink-3: #788394;", 1],
    ["small exception regression", "--ink-3: #161d29;", "--ink-3: #161d2a;", 1],
    ["ordinary pair regression", "--head: #eef2f8;", "--head: #070a10;", 1],
    ["accepted baseline", "", "", 0],
  ] as const) {
    assert.ok(css.includes(from), `fixture token missing: ${from}`);
    await Bun.write(join(root, "static/assets/css/style.css"), css.replace(from, to));
    const result = Bun.spawnSync([process.execPath, checker]);
    assert.equal(result.exitCode, expected, `${label}:\n${result.stdout}\n${result.stderr}`);
    if (from.startsWith("--ink-3")) assert.match(result.stdout.toString(), /FAIL\s+night\s+muted\/ink-3/);
    if (from.startsWith("--head")) assert.match(result.stdout.toString(), /FAIL\s+night\s+head\/ink-0/);
    if (expected === 0) assert.doesNotMatch(result.stdout.toString(), /all three looks clear 4\.5:1/);
    console.log(`OK   ${label}`);
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
