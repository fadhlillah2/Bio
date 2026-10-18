# Run through frontend-regression.ts; the deadline belongs to Chrome, not diagnostic setup.
import ctypes
import datetime
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import time


class Terminated(BaseException):
    pass


def timestamp():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def read(path):
    try:
        return Path(path).read_text().strip()
    except OSError as error:
        return f"unavailable: {error.strerror}"


def descendants(pid):
    found = {pid}
    pending = [pid]
    while pending:
        current = pending.pop()
        for task in Path(f"/proc/{current}/task").glob("*"):
            children = read(task / "children")
            for child in children.split():
                if child.isdecimal() and int(child) not in found:
                    found.add(int(child))
                    pending.append(int(child))
    return found


def snapshot():
    processes = []
    uptime = read("/proc/uptime")
    for pid in sorted(descendants(os.getpid())):
        stat = read(f"/proc/{pid}/stat")
        try:
            fields = stat[stat.rindex(")") + 2:].split()
            elapsed = float(uptime.split()[0]) - int(fields[19]) / os.sysconf("SC_CLK_TCK")
            cpu = (int(fields[11]) + int(fields[12])) / os.sysconf("SC_CLK_TCK")
            processes.append({
                "pid": pid, "ppid": int(fields[1]), "state": fields[0],
                "elapsed_s": round(elapsed, 3), "cpu_s": cpu,
                "cpu_percent_lifetime": round(100 * cpu / max(elapsed, .001), 2),
                "rss_kib": int(fields[21]) * os.sysconf("SC_PAGE_SIZE") // 1024,
                "wchan": read(f"/proc/{pid}/wchan"),
            })
        except (ValueError, IndexError):
            processes.append({"pid": pid, "status": "unavailable: process exited"})
    cpu = read("/proc/stat")
    vm = read("/proc/vmstat")
    return {
        "timestamp": timestamp(), "processes": processes,
        "cpu": cpu.splitlines()[0] if cpu.startswith("cpu ") else cpu,
        "load": read("/proc/loadavg"), "memory": read("/proc/meminfo"),
        "vm": "\n".join(line for line in vm.splitlines()
                        if line.startswith(("oom_kill ", "pgmajfault ", "pswpin ", "pswpout ", "allocstall", "unavailable:"))),
        "pressure": {kind: read(f"/proc/pressure/{kind}") for kind in ("cpu", "memory", "io")},
        "cgroup": {name: read(f"/sys/fs/cgroup/{name}")
                   for name in ("memory.events", "memory.current", "memory.max", "memory.pressure")},
    }


def main():
    timeout_ms, output, executable, *args = sys.argv[1:]
    timeout_s = int(timeout_ms) / 1000
    signals = {signal.SIGTERM, signal.SIGINT, signal.SIGHUP}
    termination = None
    cleaning = False

    def interrupted(signum, frame):
        nonlocal termination
        termination = signum
        if not cleaning:
            raise Terminated()

    for signum in signals:
        signal.signal(signum, interrupted)
    # A subreaper can collect Chrome grandchildren even when the browser is killed at its deadline.
    subreaper = ctypes.CDLL(None, use_errno=True).prctl(36, 1, 0, 0, 0) == 0
    directory = None
    samples = None
    captures = {}
    processes = []
    diagnostic_errors = []
    started = timestamp()
    begin = time.monotonic()
    browser_begin = None
    browser_finished = None
    browser_duration_ms = None
    timed_out = False
    failure = None
    exit_code = 1

    def diagnostic(action):
        try:
            return action()
        except Exception as error:
            diagnostic_errors.append(f"{type(error).__name__}: {error}")
            return None

    def save(name, value):
        if directory:
            diagnostic(lambda: (directory / name).write_text(json.dumps(value, indent=2) + "\n"))

    def sample(phase):
        if samples:
            def write():
                samples.write(json.dumps({"phase": phase, **snapshot()}) + "\n")
                samples.flush()
            diagnostic(write)

    def spawn(command, **options):
        # Defer termination until the new child is registered for cleanup.
        previous = signal.pthread_sigmask(signal.SIG_BLOCK, signals)
        try:
            proc = subprocess.Popen(command, stdin=subprocess.DEVNULL, start_new_session=True, **options)
            processes.append(proc)
            return proc
        finally:
            signal.pthread_sigmask(signal.SIG_SETMASK, previous)

    def cleanup():
        # Repeated signals must not interrupt killing and reaping adopted descendants.
        nonlocal cleaning
        cleaning = True
        while True:
            for pid in descendants(os.getpid()) - {os.getpid()}:
                try:
                    os.kill(pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            for proc in processes:
                proc.wait()
            try:
                os.waitpid(-1, 0)
            except ChildProcessError:
                break

    try:
        if output:
            def prepare():
                Path(output).mkdir(parents=True, exist_ok=True)
                return Path(tempfile.mkdtemp(prefix="chrome-", dir=output))
            directory = diagnostic(prepare)
        resolved = shutil.which(executable)
        metadata = {"started": started, "executable": executable,
                    "resolved_executable": os.path.realpath(resolved) if resolved else "unavailable: executable not found",
                    "version": "unavailable: diagnostics disabled", "argv": args, "timeout_ms": int(timeout_ms),
                    "supervisor_pid": os.getpid(), "check_pid": os.getppid(), "subreaper": subreaper}
        save("command.json", metadata)
        if directory:
            samples = diagnostic(lambda: (directory / "samples.jsonl").open("a"))
            cache = Path(output) / "chrome-version.json"
            if cache.exists():
                metadata["version"] = diagnostic(lambda: json.loads(cache.read_text())) or "unavailable: invalid version cache"
            else:
                try:
                    probe = spawn([executable, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                    stdout, stderr = probe.communicate(timeout=3)
                    metadata["version"] = {"stdout": stdout.decode(errors="replace"),
                                           "stderr": stderr.decode(errors="replace"), "exit": probe.returncode}
                except Exception as error:
                    metadata["version"] = f"unavailable: {error}"
                finally:
                    cleanup()
                    cleaning = False
                if termination:
                    raise Terminated()
                diagnostic(lambda: cache.write_text(json.dumps(metadata["version"]) + "\n"))
        # Capture directly to files so parent pipe backpressure cannot extend Chrome's deadline.
        for name in ("stdout", "stderr"):
            captures[name] = tempfile.TemporaryFile()
        child = spawn([executable, *args], stdout=captures["stdout"], stderr=captures["stderr"])
        browser_begin = time.monotonic()
        metadata.update(browser_pid=child.pid, browser_started=timestamp())
        save("command.json", metadata)
        sample("initial")
        next_sample = browser_begin + 1
        while child.poll() is None:
            now = time.monotonic()
            if now >= browser_begin + timeout_s:
                timed_out = True
                sample("timeout")
                break
            if samples and now >= next_sample:
                sample("periodic")
                next_sample = time.monotonic() + 1
            remaining = browser_begin + timeout_s - time.monotonic()
            if samples:
                remaining = min(remaining, next_sample - time.monotonic())
            try:
                child.wait(timeout=max(0, remaining))
            except subprocess.TimeoutExpired:
                pass
        exit_code = child.poll()
    except Terminated:
        pass
    except Exception as error:
        failure = f"{type(error).__name__}: {error}"
    finally:
        cleaning = True
        try:
            sample("final")
        finally:
            cleanup()
        if browser_begin is not None:
            browser_finished = timestamp()
            browser_duration_ms = round((time.monotonic() - browser_begin) * 1000)
        for name, capture in captures.items():
            if directory:
                def copy(name=name, capture=capture):
                    capture.seek(0)
                    with (directory / f"{name}.bin").open("wb") as raw:
                        shutil.copyfileobj(capture, raw)
                diagnostic(copy)
        if samples:
            diagnostic(samples.close)
        if termination:
            failure = f"supervisor received signal {termination}"
            timed_out = False
        save("result.json", {"started": started, "finished": timestamp(),
                            "duration_ms": round((time.monotonic() - begin) * 1000),
                            "browser_finished": browser_finished,
                            "browser_duration_ms": browser_duration_ms,
                            "exit": exit_code, "timed_out": timed_out, "error": failure,
                            "cleanup": "children killed and reaped", "diagnostic_errors": diagnostic_errors})
        cleaning = False

    try:
        for name, capture in captures.items():
            capture.seek(0)
            stream = sys.stdout.buffer if name == "stdout" else sys.stderr.buffer
            shutil.copyfileobj(capture, stream)
            stream.flush()
        for error in diagnostic_errors:
            print(f"Chrome diagnostics unavailable: {error}", file=sys.stderr)
        if termination:
            print(failure, file=sys.stderr)
            return 128 + termination
        if timed_out:
            print(f"Chrome ETIMEDOUT after {timeout_ms} ms", file=sys.stderr)
            return 124
        if failure:
            print(failure, file=sys.stderr)
            return 1
        return exit_code if exit_code is not None and exit_code >= 0 else 1
    except Terminated:
        return 128 + termination
    finally:
        for capture in captures.values():
            capture.close()


if __name__ == "__main__":
    sys.exit(main())
