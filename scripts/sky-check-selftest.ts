// Run: bun scripts/sky-check-selftest.ts — exercise cleanup when Chrome cannot start.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const temp = mkdtempSync(join(tmpdir(), "bio-sky-check-"));
try {
  const stopped = join(temp, "server-stopped");
  const preload = join(temp, "spawn-failure.ts");
  await Bun.write(preload, `
    import { writeFileSync } from 'node:fs';
    const serve = Bun.serve;
    Bun.serve = options => {
      const server = serve(options), stop = server.stop.bind(server);
      server.stop = (...args) => { stop(...args); writeFileSync(${JSON.stringify(stopped)}, 'stopped'); };
      return server;
    };
    Bun.which = () => process.execPath;
    Bun.spawn = () => { throw new Error('simulated Chrome spawn failure'); };
  `);
  const result = Bun.spawnSync([process.execPath, "--preload", preload,
    fileURLToPath(new URL("./sky-check.ts", import.meta.url))], { timeout: 5000 });
  assert.notEqual(result.exitCode, 0, "spawn failure must fail the check");
  assert.match(result.stderr.toString(), /simulated Chrome spawn failure/);
  assert(await Bun.file(stopped).exists(), "Chrome spawn failure must stop the HTTP server");
  console.log("OK   sky server stops when Chrome cannot start");
} finally {
  rmSync(temp, { recursive: true, force: true });
}
