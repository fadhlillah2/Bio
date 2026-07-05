# CV Sources

Single source of truth for all career-claim content on this site (`index.html`, repo `README.md`).
Files at this level are **current**; `archive/` holds superseded versions kept as the audit trail.

## Current

| File | What it is |
|---|---|
| [`resume-v8.0.txt`](resume-v8.0.txt) | Resume v8.0 — latest resume text. Source of the PDF below; regenerate the PDF after any edit. |
| [`resume-v8.0.pdf`](resume-v8.0.pdf) | Resume v8.0 PDF (1 page) — the distributable. Generated from the .txt via Chrome headless `--print-to-pdf`; extracted text verified identical to the .txt. |
| [`linkedin-profile-v2.txt`](linkedin-profile-v2.txt) | LinkedIn profile v2 — copy-paste-ready draft (headline, top skills, about, experience). **Status: DRAFT, not yet published to LinkedIn (as of 2026-07-05)** — see the status line inside the file. |

## Archive

| File | What it is |
|---|---|
| `archive/resume-v7.1.pdf` | Resume v7.1 — superseded PDF. **Stale — do not distribute**; use `../resume-v8.0.pdf`. |
| `archive/resume-v7.1.txt` | Verbatim transcript of `resume-v7.1.pdf`. |
| `archive/linkedin-profile-v1.pdf` | LinkedIn profile export (3 pages). Note: renders "F&amp;B" instead of "F&B" — a LinkedIn export bug, not a content error. |
| `archive/linkedin-profile-v1.txt` | Verbatim transcript of `linkedin-profile-v1.pdf`. |

## Version lineage

```
resume:   v7.1 (pdf + txt) ──► v8.0 (txt + pdf, current)
linkedin: v1 export (pdf + txt) ──► v2 draft (txt, current)
```

## Rules

- **Update the site only from current files.** Archive files are provenance, not sources.
- `.txt` files paired with a PDF are verbatim-wording transcripts of that PDF
  (layout may be reformatted for readability — see each file's header note).
- v8.0 and v2 passed a claim-by-claim anti-fabrication audit against the archive sources:
  every metric stands alone exactly as sourced — never merge separate metrics into one
  composite claim, and never use a stronger verb than the source.
- **The current resume must always have a matching current PDF** (`resume-vX.Y.pdf`).
  A version without its PDF is not released; regenerate the PDF whenever the .txt changes.
- Version scheme per artifact: resume = `vX.Y`, LinkedIn profile = `vN`. Bump on any content change.
- New version → add it here, move the superseded files to `archive/`, update this README.
