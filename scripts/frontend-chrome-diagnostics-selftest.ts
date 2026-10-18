// Run: bun scripts/frontend-chrome-diagnostics-selftest.ts — controlled subprocesses, not the CI incident.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const temp = mkdtempSync(join(tmpdir(), "bio-chrome-selftest-"));
const helper = join(import.meta.dir, "frontend-chrome-diagnostics.py");
try {
  const fixture = join(temp, "fixture.py");
  await Bun.write(fixture, `
import os, signal, sys, time
child = os.fork()
if child == 0:
    os.setsid()
    os.close(1)
    os.close(2)
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    time.sleep(60)
    os._exit(0)
os.write(1, f"pids {os.getpid()} {child}\\n".encode() + b"stdout\\x00\\xff\\n")
os.write(2, b"stderr\\x00\\xfe\\n")
if sys.argv[1] == "timeout":
    signal.signal(signal.SIGTERM, signal.SIG_IGN)
    time.sleep(60)
time.sleep(.15)
sys.exit(7 if sys.argv[1] == "failure" else 0)
`);
  const run = (mode: string, output: string, timeout = 5000) => Bun.spawnSync([
    "python3", "-I", "-B", helper, String(timeout), output,
    "python3", "-I", fixture, mode
  ], { stdin: "ignore", stdout: "pipe", stderr: "pipe", timeout: 10_000 });
  const cleaned = (stdout: Buffer) => {
    const pids = /pids (\d+) (\d+)/.exec(stdout.toString());
    assert(pids, "fixture must report its parent and detached descendant");
    for (const pid of pids.slice(1)) assert(!existsSync(`/proc/${pid}`), `PID ${pid} must be killed and reaped`);
  };
  for (const [mode, expected] of [["success", 0], ["failure", 7], ["timeout", 124]] as const) {
    const output = join(temp, mode);
    const result = run(mode, output, mode === "timeout" ? 2200 : 5000);
    assert.equal(result.exitCode, expected, result.stderr.toString());
    cleaned(result.stdout);
    const directories = readdirSync(output).filter(name => name.startsWith("chrome-") && name !== "chrome-version.json");
    assert.equal(directories.length, 1);
    const directory = join(output, directories[0]);
    const command = await Bun.file(join(directory, "command.json")).json();
    const summary = await Bun.file(join(directory, "result.json")).json();
    const samples = (await Bun.file(join(directory, "samples.jsonl")).text()).trim().split("\n").map(line => JSON.parse(line));
    assert.equal(command.timeout_ms, mode === "timeout" ? 2200 : 5000);
    assert.equal(command.subreaper, true, "Linux supervisor must adopt orphaned fixture children");
    assert(command.version.stdout.includes("Python"));
    assert.equal(summary.timed_out, mode === "timeout");
    assert.equal(summary.exit, mode === "timeout" ? null : expected);
    assert(summary.duration_ms > 0 && Date.parse(summary.finished) >= Date.parse(summary.started));
    assert.equal(summary.cleanup, "children killed and reaped");
    assert.deepEqual(summary.diagnostic_errors, []);
    assert.equal(samples[0].phase, "initial");
    assert.equal(samples.at(-1).phase, "final");
    assert(samples[0].processes.some((p: { pid: number }) => p.pid === command.browser_pid));
    assert(samples[0].cpu.startsWith("cpu "));
    assert(samples[0].memory.includes("MemTotal:"));
    assert("memory.events" in samples[0].cgroup);
    assert.deepEqual(Buffer.from(await Bun.file(join(directory, "stdout.bin")).bytes()), result.stdout);
    assert.deepEqual(Buffer.from(await Bun.file(join(directory, "stderr.bin")).bytes()), Buffer.from([115,116,100,101,114,114,0,254,10]));
    if (mode === "timeout") {
      assert(samples.some(sample => sample.phase === "periodic"), "sample while the fixture is alive");
      assert(samples.some(sample => sample.phase === "timeout"));
      assert(samples.some(sample => sample.processes.length >= 3), "tree must include the detached descendant");
      assert.match(result.stderr.toString(), /Chrome ETIMEDOUT after 2200 ms/);
      assert(summary.duration_ms >= 2200 && summary.duration_ms < 5000);
    }
    console.log(`OK   Chrome diagnostics ${mode}: exit ${result.exitCode}, raw output, snapshots, descendants reaped`);
  }
  const blocked = join(temp, "not-a-directory");
  await Bun.write(blocked, "blocked");
  const failed = run("failure", blocked);
  assert.equal(failed.exitCode, 7, "diagnostic write failure must preserve the process failure");
  assert.match(failed.stderr.toString(), /Chrome diagnostics unavailable/);
  cleaned(failed.stdout);
  console.log("OK   diagnostic write failure preserves exit 7 and cleanup");
  const local = run("success", "");
  assert.equal(local.exitCode, 0, local.stderr.toString());
  cleaned(local.stdout);
  console.log("OK   local mode needs no diagnostic output directory and cleans descendants");
  const regressions = join(temp, "lifecycle-regressions.py");
  await Bun.write(regressions, String.raw`
import ctypes, json, os, pathlib, runpy, shutil, signal, subprocess, sys, time
root = pathlib.Path(sys.argv[1])
helper = sys.argv[2]
ctypes.CDLL(None).prctl(36, 1, 0, 0, 0)
fixture = root / "lifecycle-fixture"
fixture.write_text("""#!/usr/bin/env python3
import os, pathlib, signal, sys, time
marker = pathlib.Path(sys.argv[-1])
child = os.fork()
if child == 0:
    os.setsid()
    os.close(1)
    os.close(2)
    time.sleep(30)
    os._exit(0)
marker.write_text(f"{os.getpid()} {child}")
if "--version" in sys.argv or sys.argv[1] == "probe":
    time.sleep(30)
elif sys.argv[1] == "flood":
    os.write(1, b"x" * (2 * 1024 * 1024))
    time.sleep(30)
elif sys.argv[1] == "exit":
    sys.exit(0)
else:
    time.sleep(30)
""")
fixture.chmod(0o700)

def wait_for(predicate, seconds=3):
    end = time.monotonic() + seconds
    while time.monotonic() < end:
        if predicate():
            return True
        time.sleep(.005)
    return False

def pids(marker):
    return [int(p) for p in marker.read_text().split()] if marker.exists() else []

def gone(marker):
    return bool(pids(marker)) and all(not pathlib.Path(f"/proc/{p}").exists() for p in pids(marker))

failures = []
for case in ("version_signal", "sample_signal", "cleanup_signal", "backpressure", "path_command"):
    folder = root / case
    folder.mkdir()
    output = folder / "diagnostics"
    output.mkdir()
    marker = folder / "pids"
    proc = None
    try:
        if case != "version_signal":
            (output / "chrome-version.json").write_text('{"stdout":"fixture version","exit":0}')
        deadline = "200" if case == "backpressure" else "1800"
        command = ["python3", "-I", "-B", helper, deadline, str(output)]
        if case == "version_signal":
            # The executable uses its own fixed marker when the supervisor passes --version.
            probe = folder / "probe"
            probe.write_text("#!/bin/sh\nexec " + str(fixture) + " probe " + str(marker) + "\n")
            probe.chmod(0o700)
            command += [str(probe)]
        elif case == "path_command":
            command += ["python3", "-I", "-c", "print('path command')"]
        else:
            command += [str(fixture), "flood" if case == "backpressure" else "exit" if case == "cleanup_signal" else "idle", str(marker)]
        if case in ("sample_signal", "cleanup_signal"):
            barrier = folder / "sampling"
            tracer = folder / "trace.py"
            tracer.write_text("""import pathlib, runpy, signal, sys
helper, barrier, case, *args = sys.argv[1:]
def trace(frame, event, arg):
    sampling = case == "sample_signal" and event == "return" and frame.f_code.co_name == "snapshot"
    cleaning = case == "cleanup_signal" and event == "line" and frame.f_code.co_name == "cleanup" and frame.f_locals.get("cleaning")
    if frame.f_code.co_filename == helper and (sampling or cleaning):
        sys.settrace(None)
        pathlib.Path(barrier).write_text(case)
        signal.pause()
    return trace
sys.argv = [helper, *args]
sys.settrace(trace)
runpy.run_path(helper, run_name="__main__")
""")
            command = ["python3", "-I", "-B", str(tracer), helper, str(barrier), case, *command[4:]]
        with (folder / "stderr").open("wb") as stderr:
            proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=stderr)
            if case in ("version_signal", "sample_signal", "cleanup_signal"):
                barrier = marker if case == "version_signal" else folder / "sampling"
                assert wait_for(barrier.exists), "fixture phase barrier missing"
                assert wait_for(marker.exists), "fixture PIDs missing"
                proc.send_signal(signal.SIGTERM)
                assert wait_for(lambda: proc.poll() is not None, 2.5), "termination did not stop supervisor"
                assert proc.returncode not in (0, 124), "termination must remain a signal failure, not timeout"
                assert gone(marker), "termination left browser/probe descendants alive or zombies"
                summaries = list(output.glob("chrome-*/result.json"))
                assert summaries, "termination result missing"
                summary = json.loads(summaries[0].read_text())
                assert not summary["timed_out"], summary
                assert not any("signal" in e or "Interrupted" in e for e in summary["diagnostic_errors"]), summary
                assert "signal 15" in summary["error"], summary
                print("OK   " + case + ": signal preserved; all fixture PIDs reaped", flush=True)
            elif case == "backpressure":
                assert wait_for(marker.exists), "fixture PIDs missing"
                # Keep stdout unread until cleanup is proven, even if the supervisor is forwarding.
                assert wait_for(lambda: gone(marker), 1.2), "browser survived its 200ms deadline while parent pipe was unread"
                stdout, _ = proc.communicate(timeout=3)
                assert proc.returncode == 124, proc.returncode
                assert len(stdout) == 2 * 1024 * 1024, len(stdout)
                directory = next(output.glob("chrome-*/result.json")).parent
                assert (directory / "stdout.bin").read_bytes() == stdout
                summary = json.loads((directory / "result.json").read_text())
                assert summary["timed_out"] and summary["duration_ms"] < 1200, summary
                print("OK   backpressure: 2MiB captured; browser reaped before parent reads", flush=True)
            else:
                stdout, _ = proc.communicate(timeout=3)
                assert proc.returncode == 0
                command_data = json.loads(next(output.glob("chrome-*/command.json")).read_text())
                assert command_data["resolved_executable"] == os.path.realpath(shutil.which("python3")), command_data
                print("OK   path_command: PATH executable resolved correctly", flush=True)
    except Exception as error:
        failures.append(case + ": " + str(error))
        print("FAIL " + failures[-1], flush=True)
    finally:
        if proc and proc.poll() is None:
            proc.kill()
        for pid in pids(marker):
            try:
                os.kill(pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
        if proc:
            proc.communicate(timeout=4)
        while True:
            try:
                os.waitpid(-1, 0)
            except ChildProcessError:
                break
assert not failures, "\n".join(failures)
`);
  const lifecycle = Bun.spawnSync(["python3", "-I", "-B", regressions, temp, helper], {
    stdin: "ignore", stdout: "pipe", stderr: "pipe", timeout: 25_000
  });
  process.stdout.write(lifecycle.stdout);
  assert.equal(lifecycle.exitCode, 0, lifecycle.stderr.toString());
} finally {
  rmSync(temp, { recursive: true, force: true });
}
