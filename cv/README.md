# CV Sources

Single source of truth for all career-claim content on this site (`index.html`, repo `README.md`).
Files at this level are **current**; `archive/` holds superseded versions kept as the audit trail.

## Current

| File | What it is |
|---|---|
| [`resume-v8.1.txt`](resume-v8.1.txt) | Resume v8.1 — latest resume text. Source of the PDF below; regenerate the PDF after any edit. |
| [`resume-v8.1.pdf`](resume-v8.1.pdf) | Resume v8.1 PDF (1 page, typeset) — the distributable. Generated via [`build-pdf.py`](build-pdf.py); extracted text verified identical to the .txt. |
| [`build-pdf.py`](build-pdf.py) | PDF generator: parses the resume .txt, typesets it (Arial, A4, 1 page), prints via Chrome headless, then verifies the PDF text is character-identical to the .txt. Run: `uv run --with pypdf python3 cv/build-pdf.py cv/resume-vX.Y.txt` |
| [`linkedin-profile-v3.txt`](linkedin-profile-v3.txt) | LinkedIn profile v3 — copy-paste-ready draft (headline, about, experience, top skills + new: projects, featured, full skills list, open-to-work setting). **Status: DRAFT, not yet published to LinkedIn (as of 2026-07-06)** — see the status line inside the file. |

## Archive

| File | What it is |
|---|---|
| `archive/resume-v8.0.txt` / `.pdf` | Resume v8.0 — superseded by v8.1 (adds JUnit 5/Mockito, Danamon team scope, Freelance concurrency note + restored bullets, RAG stack + repo link, Git/Maven). The v8.0 PDF was a monospace text render — superseded by the typeset pipeline. |
| `archive/resume-v7.1.pdf` / `.txt` | Resume v7.1 — superseded. **Stale — do not distribute.** |
| `archive/linkedin-profile-v2.txt` | LinkedIn v2 draft — superseded by v3 before ever being published. |
| `archive/linkedin-profile-v1.pdf` / `.txt` | LinkedIn profile export (3 pages) — what was live before v3. Note: renders "F&amp;B" instead of "F&B" — a LinkedIn export bug, not a content error. |

## Version lineage

```
resume:   v7.1 ──► v8.0 ──► v8.1 (txt + pdf, current)
linkedin: v1 export ──► v2 draft (never published) ──► v3 draft (current)
```

## Rules

- **Update the site only from current files.** Archive files are provenance, not sources.
- `.txt` files paired with a PDF are verbatim-wording transcripts of that PDF
  (layout may be reformatted for readability — `build-pdf.py` enforces this check).
- v8.x and v2/v3 passed a claim-by-claim anti-fabrication audit against the archive sources:
  every metric stands alone exactly as sourced — never merge separate metrics into one
  composite claim, and never use a stronger verb than the source. New facts enter only with
  explicit user confirmation or a verifiable public source (e.g. the
  [llama-docs-auditor](https://github.com/fadhlillah2/llama-docs-auditor) repo for the RAG stack).
- **The current resume must always have a matching current PDF** (`resume-vX.Y.pdf`).
  A version without its PDF is not released; regenerate the PDF (via `build-pdf.py`)
  whenever the .txt changes.
- Version scheme per artifact: resume = `vX.Y`, LinkedIn profile = `vN`. Bump on any content change.
- New version → add it here, move the superseded files to `archive/`, update this README.
