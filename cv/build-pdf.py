#!/usr/bin/env python3
"""Typeset resume PDF from the canonical .txt — wording is preserved verbatim.

Usage:  uv run --with pypdf python3 cv/build-pdf.py cv/resume-vX.Y.txt [max_pages]
Output: cv/resume-vX.Y.pdf (A4) via Windows Chrome headless print-to-pdf,
        then verifies the PDF's extracted text is character-identical to the .txt
        (whitespace/bullet markers aside) and fits max_pages (default 1).
"""
import html
import re
import subprocess
import sys
from pathlib import Path

CHROME = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"

CSS = """
@page { size: A4; margin: 7.5mm 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 8.8pt; line-height: 1.17; color: #1a1a1a; }
a { color: inherit; text-decoration: none; }
h1 { font-size: 19pt; letter-spacing: 3px; text-align: center; }
.hl { text-align: center; font-weight: bold; font-size: 9.4pt; margin-top: 1mm; }
.ct { text-align: center; font-size: 8.6pt; color: #444; }
h2 { font-size: 9.8pt; letter-spacing: 1.2px; border-bottom: 1px solid #999;
     padding-bottom: 0.5mm; margin: 2mm 0 0.9mm; break-after: avoid; }
.crow, .trow { display: flex; justify-content: space-between; break-after: avoid; }
.crow { margin-top: 1.2mm; }
.crow .c { font-weight: bold; }
.crow .loc, .trow .d { color: #444; font-size: 8.6pt; }
.trow .t { font-style: italic; }
.b { padding-left: 4mm; text-indent: -2.6mm; }
.b .m { color: #666; }
.sk { padding-left: 22mm; text-indent: -22mm; }
.sk b { font-weight: bold; }
p.body { text-align: justify; }
"""


def linkify(escaped: str) -> str:
    return re.sub(
        r"((?:github\.com|linkedin\.com|leetcode\.com|wa\.me|fadhlillah2\.github\.io)/[\w./-]+|[\w.]+@gmail\.com)",
        lambda m: '<a href="{}{}">{}</a>'.format(
            "mailto:" if "@" in m.group(1) else "https://", m.group(1), m.group(1)
        ),
        escaped,
    )


def two_col(line: str):
    parts = re.split(r"\s{2,}", line.strip())
    return parts if len(parts) == 2 else None


def to_html(txt: str) -> str:
    lines = txt.splitlines()
    head, i = [], 0
    while len(head) < 4:  # name, headline, contact x2
        if lines[i].strip():
            head.append(lines[i].strip())
        i += 1
    e = lambda s: linkify(html.escape(s))
    out = [f"<h1>{e(head[0])}</h1>", f'<p class="hl">{e(head[1])}</p>',
           f'<p class="ct">{e(head[2])}</p>', f'<p class="ct">{e(head[3])}</p>']
    section, unit = None, None  # unit: pending (kind, text) being accumulated

    def flush():
        nonlocal unit
        if not unit:
            return
        kind, text = unit
        t = e(text)
        if kind == "b":
            out.append(f'<div class="b"><span class="m">&bull;</span> {t}</div>')
        elif kind == "sk":
            label, _, rest = text.partition(" : ")
            out.append(f'<div class="sk"><b>{e(label)}</b> : {e(rest)}</div>')
        else:
            out.append(f'<p class="body">{t}</p>')
        unit = None

    for line in lines[i:]:
        if not line.strip():
            flush()
            continue
        if re.fullmatch(r"[A-Z][A-Z &/]*", line) and "  " not in line:
            flush()
            section = line
            out.append(f"<h2>{e(line)}</h2>")
        elif re.match(r"^\S.{0,12}? : ", line):  # skills row "Label : values"
            flush()
            unit = ("sk", re.sub(r"^(\S[^:]*?)\s+: ", r"\1 : ", line.strip()))
        elif line.startswith("- "):
            flush()
            unit = ("b", line[2:].strip())
        elif line.startswith(" ") and unit:  # wrapped continuation
            unit = (unit[0], unit[1] + " " + line.strip())
        elif (cols := two_col(line)) and section not in ("SUMMARY",):
            flush()
            cls = ("crow", "c", "loc") if cols[0].isupper() else ("trow", "t", "d")
            out.append(f'<div class="{cls[0]}"><span class="{cls[1]}">{e(cols[0])}</span>'
                       f'<span class="{cls[2]}">{e(cols[1])}</span></div>')
        elif section == "SUMMARY" and unit:  # summary wraps without indent
            unit = (unit[0], unit[1] + " " + line.strip())
        else:
            flush()
            unit = ("p", line.strip())
    flush()
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>" \
           + "".join(out) + "</body></html>"


def canon(s: str) -> str:
    s = re.sub(r"(?m)^\s*- ", " ", s)        # txt bullet markers
    s = s.replace("•", " ")             # rendered bullet glyphs
    return re.sub(r"\s+", "", s)             # wording only: drop all whitespace


def wsl_to_win(p: Path) -> str:
    m = re.match(r"^/mnt/([a-z])/(.*)$", str(p.resolve()))
    return f"{m.group(1).upper()}:\\{m.group(2).replace('/', chr(92))}"


def main():
    txt_path = Path(sys.argv[1])
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    txt = txt_path.read_text(encoding="utf-8")
    html_path = txt_path.with_suffix(".print.html")
    pdf_path = txt_path.with_suffix(".pdf")
    html_path.write_text(to_html(txt), encoding="utf-8")
    try:
        subprocess.run(
            [CHROME, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
             f"--print-to-pdf={wsl_to_win(pdf_path)}", wsl_to_win(html_path)],
            check=True, capture_output=True, timeout=120)
    finally:
        html_path.unlink(missing_ok=True)

    from pypdf import PdfReader
    reader = PdfReader(str(pdf_path))
    pages = len(reader.pages)
    pdf_text = "".join(p.extract_text() or "" for p in reader.pages)
    a, b = canon(txt), canon(pdf_text)
    if a != b:
        k = next((j for j, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
        sys.exit(f"FAIL wording mismatch at char {k}: txt=...{a[k:k+60]!r} pdf=...{b[k:k+60]!r}")
    if pages > max_pages:
        sys.exit(f"FAIL {pages} pages (must be <= {max_pages})")
    print(f"OK {pdf_path.name}: {pages} page(s), text verified identical to {txt_path.name}")


if __name__ == "__main__":
    main()
