#!/usr/bin/env python3
"""Typeset a cv PDF from the canonical .txt — wording is preserved verbatim.

Usage:  uv run --with pypdf python3 cv/build-pdf.py cv/resume-vX.Y.txt [max_pages]
        (or plain python3 with pypdf installed)
Output: sibling .pdf (A4) via Chrome headless print-to-pdf (native Linux/macOS
        Chrome, or Windows Chrome under WSL), then verifies the PDF's extracted
        wording is identical to the .txt (whitespace/bullet markers aside) and
        fits max_pages (default 1; a 2-page resume needs 2).
Multi-page resumes keep each company or project group together.
"""
import html
import re
import shutil
import subprocess
import sys
from pathlib import Path

WSL_CHROME = "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe"


def find_chrome() -> str:
    for c in ("google-chrome", "google-chrome-stable", "chromium", "chromium-browser"):
        if (p := shutil.which(c)):
            return p
    if Path(WSL_CHROME).exists():
        return WSL_CHROME
    sys.exit("FAIL no Chrome found (native google-chrome/chromium or WSL Windows Chrome)")

# Base look, used as-is by the consulting one-pagers; RESUME_CSS overrides the header columns.
CSS = """
@page { size: A4; margin: 7.5mm 12mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 8.8pt; line-height: 1.17; color: #1a1a1a; }
a { color: inherit; text-decoration: none; }
h1 { font-size: 19pt; letter-spacing: 0; text-align: center; }
.hl { text-align: center; font-weight: bold; font-size: 9.4pt; margin-top: 1mm; text-wrap: balance; }
.ct { text-align: center; font-size: 8.6pt; color: #444; }
h2 { font-size: 9.8pt; letter-spacing: 1.2px; border-bottom: 1px solid #999;
     padding-bottom: 0.5mm; margin: 2mm 0 0.9mm; break-after: avoid; }
/* job headers render as one linear line "COMPANY · LOCATION" / "Title · Date" —
   no space-between gap, so column-aware PDF/ATS extractors keep the date with its
   own employer instead of detaching the right column (canon() ignores the middot) */
.crow, .trow { break-after: avoid; }
.crow { margin-top: 1.2mm; }
.crow .c { font-weight: bold; }
.crow .loc, .trow .d { color: #444; font-size: 8.6pt; }
.crow .loc::before, .trow .d::before { content: "·"; margin: 0 0.45em; color: #999; }
.trow .t { font-style: italic; }
.b { padding-left: 4mm; text-indent: -2.6mm; }
.b .m { color: #666; }
.sk { padding-left: 22mm; text-indent: -22mm; }
.sk b { font-weight: bold; }
.alias { margin-top: 1mm; font-size: 7.4pt; color: #777; }
"""

# The consulting one-pagers carry ~40 lines of short content that, at the resume's
# dense 8.8pt/1.17, leaves the lower half of the A4 blank. These overrides scale the
# type/spacing up so the page fills gracefully while staying exactly 1 page. Tuned
# empirically against last-text y-position (see README lineage note for v1.2;
# leading/section gaps re-tuned for the ~6 extra outcome-led lines of v1.4).
CONSULTING_CSS = """
@page { margin: 12mm 14mm; }
body.consulting { font-size: 10.5pt; line-height: 1.33; }
body.consulting h1 { font-size: 24pt; }
body.consulting .hl { font-size: 12pt; margin-top: 2.5mm; }
body.consulting .ct { font-size: 10pt; line-height: 1.5; }
body.consulting h2 { font-size: 12.5pt; letter-spacing: 1.2px; margin: 3.4mm 0 1.6mm; padding-bottom: 1mm; }
body.consulting .b { padding-left: 6mm; text-indent: -3.6mm; margin-top: 1mm; }
body.consulting .sk { padding-left: 30mm; text-indent: -30mm; margin-top: 1mm; }
body.consulting p.body { margin-top: 1.2mm; }
/* Keep proof URLs unbroken: at 10.5pt a link like .../rate-limiter-project-go would wrap at a
   hyphen, and poppler/ATS plain-text extraction then de-hyphenates it into a dead 404 URL. */
body.consulting a { white-space: nowrap; }
"""


# Resume + recruiter one-pager: the Google Docs reference look (see README "Layout refresh").
# Everything but the page box is sized in em, so a profile can rescale the whole page by
# setting one body font-size. Measurements mirror img/Resume-Fadhlillah-7.1 (6).pdf at 11pt.
RESUME_CSS = """
@page { margin: 36pt 43pt; }
body { font-family: "Times New Roman", "Liberation Serif", Times, serif;
       font-size: 11pt; line-height: 1.35; color: #000; }
h1 { font-size: 1.4545em; text-align: center; line-height: 1.1; }
.hl { text-align: center; font-size: 1em; font-weight: normal; margin-top: 0; text-wrap: initial; }
.ct { text-align: center; font-size: 1em; color: #000; line-height: 1.35; }
.ct a { color: #1155cc; text-decoration: underline; }
h2 { font-size: 1.0909em; letter-spacing: 0; border-bottom: 1px solid #000;
     padding-bottom: 0; margin: 0.55em 0 0.333em; }
/* Location/date sit flush right on the header's own row, in DOM order on a shared baseline.
   Poppler -raw/-layout keep each pair on one line; its default mode gives the right-hand column
   a line of its own, still in reading order (COMPANY -> LOCATION). See README "Job headers". */
.crow, .trow { display: flex; justify-content: space-between; align-items: baseline; gap: 1em;
               line-height: 1.15; }
.crow { margin-top: 0; }
.trow { margin: 0; }
.crow .loc::before, .trow .d::before { content: none; }
.crow .loc { font-size: 0.909em; font-weight: bold; color: #666666; white-space: nowrap; }
.trow .t { font-weight: bold; font-style: normal; }
.trow .d { font-size: 1em; font-weight: bold; color: #000; white-space: nowrap; }
.edu .t, .deg { font-weight: bold; font-style: italic; }  /* degree line, with or without a date column */
.b { padding-left: 3.273em; text-indent: -1.636em; break-inside: avoid; }
.b .m { font-family: Arial, "Liberation Sans", Helvetica, sans-serif; color: #000;
        display: inline-block; width: calc(1.636em - 0.25em); text-indent: 0; }
.sk { padding-left: 7.3em; text-indent: -7.3em; line-height: 1.15; }
.sk b { display: inline-block; width: 6.545em; text-indent: 0; }
.alias { font-size: 0.8em; color: #555; }
p.body { text-align: justify; orphans: 2; widows: 2; }
a, .nowrap { white-space: nowrap; }
"""

# Long experience entries may break between project groups, with each bullet run kept together.
# Body size is the one knob that rescales a profile; 8.5pt is the largest that still fits 2 pages.
FULL_RESUME_CSS = """
body { font-size: 8.5pt; }
.job { break-inside: avoid; }
.job:has(> p.body) { break-inside: auto; }
.job > .b:has(+ .b) { break-after: avoid; }
.job > p.body { margin-top: 0.7mm; break-after: avoid; }
"""

# The recruiter one-pager keeps the reference's 11pt: its content is cut to fit one page, never its type.
ONEPAGER_CSS = """
body.onepager a { white-space: nowrap; }
"""


def linkify(escaped: str) -> str:
    return re.sub(  # URL must not end in '.' so trailing sentence punctuation stays outside the link
        r"((?:github\.com|linkedin\.com|leetcode\.com|replit\.com|wa\.me|fadhlillah2\.github\.io)/[\w./@-]*[\w/@-]|[\w.]+@gmail\.com)",
        lambda m: '<a href="{}{}">{}</a>'.format(
            # email is the only match without '/' — profile paths like replit.com/@X contain '@' too
            "mailto:" if "/" not in m.group(1) else "https://", m.group(1), m.group(1)
        ),
        escaped,
    )


PROSE = ("SUMMARY", "OBJECTIVE")  # prose sections wrap without indent


def two_col(line: str):
    parts = re.split(r"\s{2,}", line.strip())
    return parts if len(parts) == 2 else None


LINK_LABEL = re.compile(r"(\S+)\s*<([^<>]+)>")  # header link syntax "label <target>"


def link_href(target: str) -> str:
    # email is the only target without '/' — profile paths like replit.com/@X contain '@' too
    return f"https://{target}" if "/" in target else f"mailto:{target}"


def header_lines(txt: str):
    """Name line plus every following non-blank line, i.e. everything above the first blank line."""
    lines = txt.splitlines()
    i = 0
    while i < len(lines) and not lines[i].strip():
        i += 1
    head = []
    while i < len(lines) and lines[i].strip():
        head.append(lines[i].strip())
        i += 1
    if len(head) < 2:
        sys.exit("FAIL header incomplete: need a name line plus at least one header line")
    return head


def header_targets(txt: str):
    """(label, href) for every "label <target>" in the header block."""
    return [(m.group(1), link_href(m.group(2))) for line in header_lines(txt) for m in LINK_LABEL.finditer(line)]


def header_html(s: str, e) -> str:
    """Header lines only: "label <target>" renders as a link whose visible text is only the label."""
    out, last = "", 0
    for m in LINK_LABEL.finditer(s):
        out += e(s[last:m.start()]) + f'<a href="{html.escape(link_href(m.group(2)))}">{html.escape(m.group(1))}</a>'
        last = m.end()
    return out + e(s[last:])


def doc_title(stem: str, name: str) -> str:
    # "resume-vX.Y" -> "Fadhlillah — Resume vX.Y" (viewer-facing PDF title)
    words = [{"id": "ID", "en": "EN", "onepager": "One-Pager"}.get(w, w if re.fullmatch(r"v[\d.]+", w) else w.capitalize())
             for w in stem.split("-")]
    return f"{name.title()} — {' '.join(words)}"


def to_html(txt: str, stem: str) -> str:
    lines = txt.splitlines()
    head = header_lines(txt)
    i = 0
    while not lines[i].strip():
        i += 1
    i += len(head)
    def e(s):
        linked = linkify(html.escape(s))
        if "consulting" in stem:
            return linked
        # Keep compound words intact: PDF readers can remove a literal hyphen at a line break.
        return re.sub(r'<a\b[^>]*>.*?</a>|[A-Za-z0-9]+(?:-[A-Za-z0-9]+)+',
                      lambda m: m[0] if m[0].startswith('<a ') else f'<span class="nowrap">{m[0]}</span>', linked)

    out = [f"<h1>{header_html(head[0], e)}</h1>"]
    for line in head[1:]:  # a header line carrying any link is the contact line
        h = header_html(line, e)
        out.append(f'<p class="{"ct" if "<a " in h else "hl"}">{h}</p>')
    bullet = "&bull;" if "consulting" in stem else "&#9679;"  # reference uses U+25CF
    section, unit = None, None  # unit: pending (kind, text) being accumulated
    job_open = False  # a <div class="job"> wraps each company block so it won't split across pages
    edu_deg = False  # the line right after an EDUCATION company row is the degree line

    def flush():
        nonlocal unit, edu_deg
        if not unit:
            return  # an empty flush keeps the flag: the degree line has not been read yet
        deg, edu_deg = edu_deg, False
        kind, text = unit
        if kind == "b":
            out.append(f'<div class="b"><span class="m">{bullet}</span> {e(text)}</div>')
        elif kind == "sk":
            label, _, rest = text.partition(" : ")
            out.append(f'<div class="sk"><b>{e(label)}</b> : {e(rest)}</div>')
        else:
            out.append(f'<p class="body{" deg" if deg else ""}">{e(text)}</p>')
        unit = None

    def close_job():
        nonlocal job_open, edu_deg
        edu_deg = False
        if job_open:
            out.append('</div>')
            job_open = False

    for line in lines[i:]:
        if not line.strip():
            flush()
            continue
        if re.fullmatch(r"[A-Z][A-Z &/]*", line) and "  " not in line:
            flush()
            close_job()
            section = line
            out.append(f"<h2>{e(line)}</h2>")
        elif line.startswith("- "):  # before the skills regex: a bullet containing " : " is still a bullet
            flush()
            unit = ("b", line[2:].strip())
        elif re.match(r"^\S.{0,12}? : ", line):  # skills row "Label : values"
            flush()
            unit = ("sk", re.sub(r"^(\S[^:]*?)\s+: ", r"\1 : ", line.strip()))
        elif line.startswith(("Also searchable as", "Target roles")):  # de-emphasized keyword/role footer, not a cert line
            flush()
            out.append(f'<p class="alias">{e(line.strip())}</p>')
        elif line.startswith(" ") and unit:  # wrapped continuation
            unit = (unit[0], unit[1] + " " + line.strip())
        elif (cols := two_col(line)) and section not in PROSE:
            flush()
            cls = ("crow", "c", "loc") if cols[0].isupper() else ("trow", "t", "d")
            if cls[0] == "crow":  # a new company block starts — keep it on one page
                close_job()
                out.append('<div class="job">')
                job_open = True
                edu_deg = section == "EDUCATION"  # a degree line without a date column still renders italic
            edu = " edu" if cls[0] == "trow" and section == "EDUCATION" else ""  # degree line is italic
            if cls[0] == "trow":
                edu_deg = False  # a dated degree row is the degree line itself
            out.append(f'<div class="{cls[0]}{edu}"><span class="{cls[1]}">{e(cols[0])}</span>'
                       f'<span class="{cls[2]}">{e(cols[1])}</span></div>')
        elif section in PROSE and unit:  # summary/objective wraps without indent
            unit = (unit[0], unit[1] + " " + line.strip())
        elif unit and unit[0] == "p" and line[:1].islower() and unit[1][-1:].isalnum():
            # unindented mid-sentence wrap: joins only lowercase lines after a word break,
            # so a new lowercase-brand item (e.g. freeCodeCamp) after ")" stays its own paragraph
            unit = (unit[0], unit[1] + " " + line.strip())
        else:
            flush()
            unit = ("p", line.strip())
    flush()
    close_job()
    lang = "id" if "-id-" in stem else "en"
    title = html.escape(doc_title(stem, head[0]))
    consulting = "consulting" in stem  # fills the page (see CONSULTING_CSS)
    # Only the full resume groups experience across page boundaries.
    if consulting:
        body_attr, extra = ' class="consulting"', CONSULTING_CSS
    elif "onepager" in stem:
        body_attr, extra = ' class="onepager"', RESUME_CSS + ONEPAGER_CSS
    else:
        body_attr, extra = "", RESUME_CSS + FULL_RESUME_CSS
    return (f"<!doctype html><html lang='{lang}'><head><meta charset='utf-8'>"
            f"<title>{title}</title><style>{CSS}{extra}</style></head><body{body_attr}>"
            + "".join(out) + "</body></html>")


def visible_text(txt: str) -> str:
    """The .txt as the PDF text layer should read it: header "label <target>" targets are not rendered."""
    head = header_lines(txt)
    lines = txt.splitlines()
    i = 0
    while not lines[i].strip():
        i += 1
    return "\n".join(re.sub(r"\s*<[^<>]*>", "", l) if i <= k < i + len(head) else l for k, l in enumerate(lines))


def canon(s: str) -> str:
    s = re.sub(r"(?m)^\s*- ", " ", s)        # txt bullet markers
    s = s.replace("•", " ")             # rendered bullet glyphs
    s = s.replace("●", " ")
    s = s.replace("·", " ")             # job-header separator (CSS ::before, absent from the .txt)
    return re.sub(r"\s+", "", s)             # wording only: drop all whitespace


def chrome_path(p: Path, chrome: str) -> str:
    # Windows Chrome under WSL needs C:\-style paths; native Chrome takes posix
    if chrome == WSL_CHROME:
        m = re.match(r"^/mnt/([a-z])/(.*)$", str(p.resolve()))
        if not m:
            sys.exit(f"FAIL WSL Chrome needs the repo under /mnt/<drive>/, got {p.resolve()}")
        return f"{m.group(1).upper()}:\\{m.group(2).replace('/', chr(92))}"
    return str(p.resolve())


def selftest():
    # Chrome-less check of the parser branches — fails loudly if the logic breaks
    src = ("NAME\nHeadline here\nCity, ID | mail@gmail.com\nlinkedin.com/in/x | github.com/x\n\n"
           "SUMMARY\nProse line one\nwrapping without indent.\n\nEXPERIENCE\n"
           "COMPANY    CITY, ID\nRole Title    Jan 2020 – Now\n- bullet one\n  wrapped tail\n\n"
           "SKILLS\nAI/LLM       : RAG, agents\n")
    h = to_html(src, "resume-v9.9-test")
    assert "<title>Name — Resume v9.9 Test</title>" in h and "<html lang='en'>" in h
    assert '<div class="crow"><span class="c">COMPANY</span>' in h
    assert '<div class="trow"><span class="t">Role Title</span>' in h
    assert '<div class="b"><span class="m">&#9679;</span> bullet one wrapped tail</div>' in h
    assert '<span class="m">&bull;</span>' in to_html(src, "consulting-onepager-en-v9.9")  # consulting keeps its bullet glyph
    assert '<div class="sk"><b>AI/LLM</b> : RAG, agents</div>' in h
    assert '<p class="body">Prose line one wrapping without indent.</p>' in h
    assert "<html lang='id'>" in to_html(src, "consulting-onepager-id-v9.9")
    assert canon("- a  b\nc") == canon("• a b c") and canon("ab") != canon("ac")
    assert canon("- a  b\nc") == canon("● a b c")  # reference bullet glyph ignored in verify
    assert canon("Bank·Jakarta") == canon("Bank Jakarta")  # header separator middot ignored in verify
    assert canon(visible_text("NAME\nemail <a@b.com> • GitHub <github.com/x>\n\nSUMMARY\nP <kept>\n")) == \
        canon("NAME\nemail • GitHub\n\nSUMMARY\nP <kept>\n")  # link targets dropped in the header only
    assert canon("a <b>") != canon("a")  # body angle brackets still count as wording
    assert 'class="consulting"' in to_html(src, "consulting-onepager-en-v9.9") and \
        "body.consulting" in to_html(src, "consulting-onepager-en-v9.9")  # page-fill overrides applied
    assert 'class="consulting"' not in to_html(src, "resume-v9.9-test")  # only for consulting docs
    assert 'class="onepager"' in to_html(src, "resume-onepager-v9.9") and \
        "body.onepager" in to_html(src, "resume-onepager-v9.9")  # 1-pager densify applied
    assert "<title>Name — Resume One-Pager v9.9</title>" in to_html(src, "resume-onepager-v9.9")
    # header: name, then any number of lines up to the first blank; a line with a link is the contact line
    assert '<h1>NAME</h1><p class="hl">Headline here</p><p class="ct">' in h
    labelled = to_html("NAME\nCity • email <a@b.com> • GitHub <github.com/x>\n\nSUMMARY\nP\n", "resume-v9.9-test")
    assert ('<p class="ct">City • <a href="mailto:a@b.com">email</a> • '
            '<a href="https://github.com/x">GitHub</a></p>') in labelled  # link-label renders label only
    assert 'class="hl"' not in labelled  # a two-line header is name + contact, no headline
    assert header_targets("NAME\nemail <a@b.com> • WA <wa.me/1>\n\nX\n") == [
        ("email", "mailto:a@b.com"), ("WA", "https://wa.me/1")]  # header targets for the link check
    try:
        to_html("NAME\n\nSUMMARY\n", "resume-v9.9-test")
        raise AssertionError("a lone name line is not a header")
    except SystemExit:
        pass
    lk = linkify("see replit.com/@X and mail@gmail.com")
    assert lk.count("<a href=") == 2
    # scheme guard: a URL containing '@' must stay https, only bare emails get mailto
    assert 'href="https://replit.com/@X"' in lk and 'href="mailto:mail@gmail.com"' in lk
    assert '<p class="alias">Also searchable as: X, Y</p>' in to_html(
        src + "Also searchable as: X, Y\n", "resume-v9.9-test")  # keyword footer keeps its own style
    assert '<p class="alias">Target roles: X · Y</p>' in to_html(
        src + "Target roles: X · Y\n", "resume-v9.9-test")  # role footer keeps alias style
    assert 'href="https://github.com/x/y"' in linkify("github.com/x/y.")  # trailing '.' stays outside the link
    wrap = to_html(src.replace("- bullet one\n  wrapped tail",
                               "Label line:\nAn unindented paragraph that\nwraps mid-sentence here."), "resume-v9.9-test")
    assert '<p class="body">An unindented paragraph that wraps <span class="nowrap">mid-sentence</span> here.</p>' in wrap  # lowercase wrap joins
    assert '<p class="body">Label line:</p>' in wrap  # uppercase start stays its own paragraph
    certs = to_html(src.replace("- bullet one\n  wrapped tail",
                                "Cert one (Org)\nfreeCodeCamp — another item"), "resume-v9.9-test")
    assert '<p class="body">Cert one (Org)</p>' in certs  # lowercase-brand item after ')' is NOT merged
    assert '<p class="body">freeCodeCamp — another item</p>' in certs
    assert '<div class="b"><span class="m">&#9679;</span> a : b</div>' in to_html(
        src.replace("- bullet one", "- a : b\n- bullet one"), "resume-v9.9-test")  # bullet with ' : ' stays a bullet
    assert '<div class="trow edu">' in to_html(
        src.replace("EXPERIENCE", "EDUCATION"), "resume-v9.9-test")  # EDUCATION degree line is marked for italics
    no_date = to_html("NAME\nX <a@b.com>\n\nEDUCATION\nUNIV    CITY, ID\nBachelor of Things\nActivities: none\n",
                      "resume-v9.9-test")  # a dateless degree line is italic, the line after it is not
    assert '<p class="body deg">Bachelor of Things</p>' in no_date
    assert '<p class="body">Activities: none</p>' in no_date
    dated = to_html("NAME\nX <a@b.com>\n\nEDUCATION\nUNIV    CITY, ID\nBachelor of Things    Mar 2016 – May 2020\nActivities: none\n",
                    "resume-v9.9-test")  # a dated degree row does not italicize the line after it
    assert '<div class="trow edu">' in dated and '<p class="body">Activities: none</p>' in dated
    compounds = to_html(src.replace("- bullet one", "- field-level RBAC; github.com/x/rate-limiter"), "resume-v9.9-test")
    assert '<span class="nowrap">field-level</span>' in compounds
    assert '<a href="https://github.com/x/rate-limiter">github.com/x/rate-limiter</a>' in compounds
    # render-behaviour guards (can't run Chrome here, so lock the CSS the render depends on):
    assert "letter-spacing: 0" in CSS  # h1 name extracts as one token FADHLILLAH, not FA D H L...
    assert "white-space: nowrap" in CONSULTING_CSS  # proof URLs never wrap→de-hyphenate into 404s
    assert "white-space: nowrap" in ONEPAGER_CSS  # same URL guard for the recruiter 1-pager
    assert "align-items: baseline" in RESUME_CSS  # job header columns share one baseline → linear extraction
    # each resume profile owns one body size — the single knob that fits it to its page budget
    assert "font-size" in FULL_RESUME_CSS and "font-size" not in ONEPAGER_CSS  # one-pager stays at the reference 11pt
    print("selftest OK")


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__.strip())
    if sys.argv[1] == "--selftest":
        return selftest()
    txt_path = Path(sys.argv[1])
    if not txt_path.is_file():
        sys.exit(f"FAIL no such file: {txt_path}")
    if len(sys.argv) > 2 and (not sys.argv[2].isdigit() or int(sys.argv[2]) <= 0):
        sys.exit(f"FAIL max_pages must be a positive integer, got {sys.argv[2]!r}")
    max_pages = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    # fail fast: without pypdf we'd emit a PDF that is never verified nor metadata-stamped
    try:
        from pypdf import PdfReader, PdfWriter
        from pypdf.generic import NameObject, TextStringObject
    except ImportError:
        sys.exit("FAIL pypdf is required (wording verify + Title/Author stamp) — install it or add its wheel to PYTHONPATH")
    chrome = find_chrome()  # before any output is written, so a Chrome-less run leaves no orphan .print.html
    txt = txt_path.read_text(encoding="utf-8")
    html_path = txt_path.with_suffix(".print.html")
    pdf_path = txt_path.with_suffix(".pdf")
    tmp_path = txt_path.with_suffix(".tmp.pdf")  # verify BEFORE touching the real .pdf — a failed run must not leave a broken artifact
    try:
        html_path.write_text(to_html(txt, txt_path.stem), encoding="utf-8")
        try:
            subprocess.run(
                [chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                 f"--print-to-pdf={chrome_path(tmp_path, chrome)}", chrome_path(html_path, chrome)],
                check=True, capture_output=True, timeout=120)
        except subprocess.CalledProcessError as e:
            sys.exit(f"FAIL Chrome exited {e.returncode}: {e.stderr.decode(errors='replace')[-500:]}")
        except subprocess.TimeoutExpired:
            sys.exit("FAIL Chrome timed out after 120s")
        reader = PdfReader(str(tmp_path))
        pages = len(reader.pages)
        pdf_text = "".join(p.extract_text() or "" for p in reader.pages)

        # every "label <target>" in the header must survive as a clickable URI action
        if targets := header_targets(txt):
            annots = [a for page in reader.pages for a in (page["/Annots"] if "/Annots" in page else [])]
            uris = {str(act["/URI"]) for annot in annots
                    if (act := annot.get_object().get("/A")) and act.get("/URI")}
            if missing := [href for _, href in targets if href not in uris]:
                sys.exit(f"FAIL header link annotation missing: {', '.join(missing)} (found: {', '.join(uris) or 'none'})")
            if unlabelled := [label for label, _ in targets if label not in pdf_text]:
                sys.exit(f"FAIL header link label not visible in the PDF text: {', '.join(unlabelled)}")
        a, b = canon(visible_text(txt)), canon(pdf_text)
        if a != b:
            k = next((j for j, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
            sys.exit(f"FAIL wording mismatch at char {k}: txt=...{a[k:k+60]!r} pdf=...{b[k:k+60]!r}")
        if pages > max_pages:
            sys.exit(f"FAIL {pages} pages (must be <= {max_pages})")

        # stamp viewer-facing metadata (Chrome sets /Title from <title>; /Author and a
        # reliable document /Lang — id for the Indonesian one-pager — need a pass)
        head0 = next(l.strip() for l in txt.splitlines() if l.strip())
        writer = PdfWriter(clone_from=str(tmp_path))
        writer.add_metadata({"/Title": doc_title(txt_path.stem, head0), "/Author": head0.title()})
        writer._root_object[NameObject("/Lang")] = TextStringObject("id" if "-id-" in txt_path.stem else "en")
        with open(pdf_path, "wb") as f:
            writer.write(f)
    finally:
        html_path.unlink(missing_ok=True)
        tmp_path.unlink(missing_ok=True)
    print(f"OK {pdf_path.name}: {pages} page(s), wording verified identical to {txt_path.name}")


if __name__ == "__main__":
    main()
