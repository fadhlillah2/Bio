"""Run with python3 -B scripts/cv-cleanup-check.py; no Chrome or pypdf needed."""
import os
from pathlib import Path
import runpy
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory
from types import ModuleType

ROOT = Path(__file__).resolve().parents[1]


def check():
    failures = []
    with TemporaryDirectory(prefix="bio-cv-cleanup-") as directory:
        scratch = Path(directory)
        src = scratch / "resume-test.txt"
        src.write_text("NAME\nContact\n\nSUMMARY\nBody\n")
        pdf = src.with_suffix(".pdf")
        temporary = [src.with_suffix(".print.html"), src.with_suffix(".tmp.pdf")]

        def verify(label):
            leftovers = [p.name for p in temporary if p.exists()]
            if leftovers or pdf.read_bytes() != b"original PDF":
                failures.append(f"{label}: leftovers={leftovers}, original PDF preserved={pdf.read_bytes() == b'original PDF'}")
            for path in temporary:
                path.unlink(missing_ok=True)

        # Exercise the real Bun CLI; Chrome alone is replaced with a bounded executable.
        chrome = scratch / "google-chrome"
        env = dict(os.environ, PATH=str(scratch) + os.pathsep + os.environ["PATH"])
        marker = scratch / "chrome-called"
        env["CV_CHROME_MARKER"] = str(marker)
        chrome.write_text('#!/bin/sh\nprintf called > "$CV_CHROME_MARKER"\nexit 1\n')
        chrome.chmod(0o700)
        for value in ("0", "00"):
            for command in ([shutil.which("bun"), str(ROOT / "cv/build-pdf.ts")],
                            [sys.executable, "-B", str(ROOT / "cv/build-pdf.py")]):
                pdf.write_bytes(b"original PDF")
                result = subprocess.run(command + [str(src), value], env=env,
                                        capture_output=True, text=True, timeout=15)
                if result.returncode == 0 or "max_pages must be a positive integer" not in result.stderr or marker.exists():
                    failures.append(f"{Path(command[-1]).name} max_pages={value}: not rejected before Chrome/dependencies")
                verify(f"max_pages={value}")
                marker.unlink(missing_ok=True)
        result = subprocess.run([shutil.which("bun"), str(ROOT / "cv/build-pdf.ts"), str(src), "9" * 400],
                                env=env, capture_output=True, text=True, timeout=15)
        if "max_pages must be a positive integer" not in result.stderr or marker.exists():
            failures.append("Bun overflowing max_pages: not rejected before Chrome")
        verify("Bun overflowing max_pages")
        marker.unlink(missing_ok=True)
        for code in (1, 0):
            chrome.write_text('#!/bin/sh\nfor arg in "$@"; do\n'
                              'case "$arg" in --print-to-pdf=*) printf partial > "${arg#--print-to-pdf=}";; esac\n'
                              f'done\nexit {code}\n')
            chrome.chmod(0o700)
            pdf.write_bytes(b"original PDF")
            result = subprocess.run([shutil.which("bun"), str(ROOT / "cv/build-pdf.ts"), str(src)],
                                    env=env, capture_output=True, text=True, timeout=15)
            assert result.returncode != 0, "invalid render must fail"
            if code:
                assert "FAIL Chrome exited 1" in result.stderr, result.stderr
            else:
                assert "Invalid PDF" in result.stderr, result.stderr
            verify("Bun render failure" if code else "Bun invalid PDF")

        # Replay an existing PDF through the real verifier/stamp without rendering current CVs.
        current = next((ROOT / "cv").glob("resume-onepager-v*.txt"))
        src.write_bytes(current.read_bytes())
        env["CV_CLEANUP_PDF"] = str(current.with_suffix(".pdf"))
        chrome.write_text('#!/bin/sh\nfor arg in "$@"; do\n'
                          'case "$arg" in --print-to-pdf=*) cp "$CV_CLEANUP_PDF" "${arg#--print-to-pdf=}";; esac\n'
                          'done\n')
        result = subprocess.run([shutil.which("bun"), str(ROOT / "cv/build-pdf.ts"), str(src), "01"],
                                env=env, capture_output=True, text=True, timeout=15)
        assert result.returncode == 0 and "wording verified identical" in result.stdout, result.stderr
        assert pdf.read_bytes().startswith(b"%PDF-")
        assert not any(path.exists() for path in temporary), "successful run left temporary files"

        # Python's failure branches run before PDF parsing; stub only the unavailable imports.
        module = runpy.run_path(str(ROOT / "cv/build-pdf.py"), run_name="cleanup_check")
        main = module["main"]
        pypdf, generic = ModuleType("pypdf"), ModuleType("pypdf.generic")
        pypdf.PdfReader = pypdf.PdfWriter = object
        generic.NameObject = generic.TextStringObject = str
        sys.modules.update({"pypdf": pypdf, "pypdf.generic": generic})
        main.__globals__["find_chrome"] = lambda: str(chrome)
        original_run = subprocess.run
        sys.argv = ["build-pdf.py", str(src), "01"]
        try:
            for error in (subprocess.CalledProcessError(1, [], stderr=b"crash"),
                          subprocess.TimeoutExpired([], 120)):
                def fail_render(*args, **kwargs):
                    temporary[1].write_bytes(b"partial")
                    raise error
                subprocess.run = fail_render
                pdf.write_bytes(b"original PDF")
                try:
                    main()
                    raise AssertionError("render failure must propagate")
                except SystemExit as exc:
                    expected = "FAIL Chrome timed out after 120s" if isinstance(error, subprocess.TimeoutExpired) else "FAIL Chrome exited 1: crash"
                    assert str(exc) == expected, exc
                verify(f"Python {type(error).__name__}")
        finally:
            subprocess.run = original_run
    assert not failures, "\n".join(failures)
    print("CV checks OK: positive max_pages; Bun render/verification failure and success; Python render failure/timeout; original PDFs preserved on failure")


if __name__ == "__main__":
    check()
