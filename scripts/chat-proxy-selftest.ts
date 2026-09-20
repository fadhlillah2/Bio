// Run: bun scripts/chat-proxy-selftest.ts — guard the chat proxy's fail-closed boundary.
//
// The widget is only safe because visitor text reaches an opencode agent with every tool disabled.
// opencode does not enforce that for us: when `--agent` cannot be resolved it warns on stderr and
// answers from the default `build` agent (bash, edit, write) with exit 0. These checks pin the
// detection of that fallback and the agent definition it depends on.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { AGENT, agentFile, collect, currentResume, fellBackToDefaultAgent, parseRun } from "./chat-proxy.ts";

const ROOT = resolve(import.meta.dir, "..");

// The exact bytes opencode 1.18.31 writes to stderr, ANSI colouring included.
const REAL_WARNING = '[93m[1m! [0m agent "bio-guide" not found. Falling back to default agent\n';
assert(fellBackToDefaultAgent(REAL_WARNING), "must detect opencode's real fallback warning");
assert(fellBackToDefaultAgent('agent bio-guide not found. falling back to default agent'), "must detect the unquoted, lower-cased form");
assert(fellBackToDefaultAgent('Falling back to default agent'), "must detect the fallback sentence on its own");

// False positives would break every answer, so ordinary stderr must stay clear.
assert(!fellBackToDefaultAgent(""), "empty stderr is not a fallback");
assert(!fellBackToDefaultAgent("warning: slow response from provider\n"), "unrelated warnings are not a fallback");
assert(!fellBackToDefaultAgent(`using agent ${AGENT}\n`), "a normal agent mention is not a fallback");

// The definition the proxy refuses to start without, and the tool lockdown that makes it safe.
const definition = readFileSync(agentFile(ROOT), "utf8");
for (const tool of ["bash", "edit", "write", "read", "webfetch", "task", "skill"]) {
  assert(new RegExp(`^\\s+${tool}:\\s*false\\s*$`, "m").test(definition), `${AGENT} must disable ${tool}`);
}

// Grounding follows whatever resume version is current; two versions is a contract violation.
assert(/^resume-v\d+\.\d+\.txt$/.test(currentResume(ROOT).split("/").pop()!), "resolves the current resume");
const temp = mkdtempSync(join(tmpdir(), "bio-chat-proxy-"));
try {
  const cv = join(temp, "cv");
  mkdirSync(cv);
  writeFileSync(join(cv, "resume-v9.0.txt"), "");
  writeFileSync(join(cv, "resume-v9.1.txt"), "");
  assert.throws(() => currentResume(temp), /found 2/, "two current resumes must be refused, not silently picked");
} finally {
  rmSync(temp, { recursive: true, force: true });
}

// A run must always settle: the proxy answers one question at a time, so a run that never returns
// would leave every later visitor on 429 until the server is restarted by hand.
const stubborn = Bun.spawn(["bash", "-c", 'trap "" TERM; sleep 8'], { stdout: "pipe", stderr: "pipe", stdin: "ignore" });
const started = Date.now();
const reaped = await collect(stubborn as never, 300, 300);
const elapsed = Date.now() - started;
assert(elapsed < 2000, `a child ignoring SIGTERM must still be reaped, took ${elapsed}ms`);
assert(reaped.code !== 0, `a killed run must not report success (code ${reaped.code})`);

const unkillable = {
  stdout: new ReadableStream(),
  stderr: new ReadableStream(),
  exited: new Promise<number>(() => {}),
  kill() {}
};
// Raced against a watchdog on purpose: without the guard this call hangs forever, and a check
// that hangs stalls CI instead of failing it.
const outcome = await Promise.race([
  collect(unkillable as never, 100, 100).then(
    () => "resolved",
    (e: Error) => (/abandoning the run/.test(e.message) ? "abandoned" : `rejected: ${e.message}`)
  ),
  // 3s against an abandon at 1.2s: a loaded machine must not report a false "hung"
  new Promise((resolve) => setTimeout(() => resolve("hung"), 3000))
]);
assert.equal(outcome, "abandoned", "a run surviving SIGKILL must be abandoned, never awaited forever");

// A run that was signalled mid-answer must be refused, not trimmed into a plausible half-sentence.
const TEXT = JSON.stringify({ type: "text", part: { type: "text", text: "Half an ans" } });
const DONE = JSON.stringify({ type: "step_finish", part: { type: "step-finish", cost: 0.00012 } });
assert.deepEqual(parseRun(`${TEXT}\n${DONE}\n`, "", 0), { reply: "Half an ans", cost: 0.00012 }, "a clean run parses text and cost");
assert.throws(() => parseRun(`${TEXT}\n`, "", 137), /partial answer discarded/, "a SIGKILLed run must not be served as an answer");
assert.throws(() => parseRun(`${TEXT}\n`, "provider exploded\n", 1), /provider exploded/, "a failed run must surface stderr, since the 502 body points the operator at this terminal");
assert.throws(() => parseRun(`${TEXT}\n`, "", 143), /partial answer discarded/, "a SIGTERMed run must not be served as an answer");
assert.throws(() => parseRun("", "boom\n", 0), /boom/, "an empty answer surfaces stderr");
assert.deepEqual(parseRun(`not json\n${TEXT}\n`, "", 0).reply, "Half an ans", "non-JSON chatter is ignored");

console.log("chat proxy selftest: all checks passed");
