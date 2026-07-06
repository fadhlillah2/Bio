# CV Sources

Single source of truth chain (per 2026-07-06): **live LinkedIn profile** is the top-level SoT for
career claims → captured verbatim in `linkedin-profile-v4.txt` → resume/site derive from it (plus
user-confirmed facts and public-repo-verifiable facts not yet on LinkedIn).
Files at this level are **current**; `archive/` holds superseded versions kept as the audit trail.

## Current

| File | What it is |
|---|---|
| [`linkedin-profile-v4.txt`](linkedin-profile-v4.txt) | **LIVE snapshot** of linkedin.com/in/fadhlillah2 (scraped via MCP, 2026-07-06) — the SoT transcript. Header lists the v3→live delta (audited improvements not yet applied on LinkedIn). |
| [`resume-v8.2.txt`](resume-v8.2.txt) | Resume v8.2 — synced to the live profile (6+ yrs; Go; 50k+ emails/SMS metric; rate-limiter Go project; Llama Hackathon credential + per-issuer certs; LMNAS-28). Source of the PDF below. |
| [`resume-v8.2.pdf`](resume-v8.2.pdf) | Resume v8.2 PDF (1 page, typeset) — the distributable. Generated via [`build-pdf.py`](build-pdf.py); extracted text verified identical to the .txt. |
| [`build-pdf.py`](build-pdf.py) | PDF generator: parses the resume .txt, typesets it (Arial, A4, 1 page), prints via Chrome headless, then verifies the PDF text is character-identical to the .txt. Run: `uv run --with pypdf python3 cv/build-pdf.py cv/resume-vX.Y.txt` |

## Archive

| File | What it is |
|---|---|
| `archive/resume-v8.1.txt` / `.pdf` | Resume v8.1 — first typeset release; superseded by v8.2 (LinkedIn-live sync). |
| `archive/resume-v8.0.txt` / `.pdf` | Resume v8.0 — superseded; PDF was a monospace text render. |
| `archive/resume-v7.1.pdf` / `.txt` | Resume v7.1 — superseded. **Stale — do not distribute.** |
| `archive/linkedin-profile-v3.txt` | LinkedIn v3 draft — never published; its improvements are listed as the delta in v4's header. |
| `archive/linkedin-profile-v2.txt` | LinkedIn v2 draft — never published. |
| `archive/linkedin-profile-v1.pdf` / `.txt` | LinkedIn profile export (3 pages), pre-2026-07-06 live state. "F&amp;B" is a LinkedIn export bug. |

## Version lineage

```
resume:   v7.1 ──► v8.0 ──► v8.1 ──► v8.2 (txt + pdf, current)
linkedin: v1 export ──► v2 draft ──► v3 draft (never published) ──► v4 LIVE snapshot (current SoT)
```

## Rules

- **Live LinkedIn wins on conflicts.** When the live profile and local files disagree on a fact
  (e.g. "6 yrs" vs "6+ yrs"), re-snapshot LinkedIn into a new `linkedin-profile-vN.txt` and sync
  resume/site to it. The resume stays a *curated subset* — omitting a LinkedIn fact is fine,
  contradicting one is not.
- **Update the site only from current files.** Archive files are provenance, not sources.
- `.txt` files paired with a PDF are verbatim-wording transcripts of that PDF
  (layout may be reformatted for readability — `build-pdf.py` enforces this check).
- Anti-fabrication: every metric stands alone exactly as sourced — never merge separate metrics
  into one composite claim, never use a stronger verb than the source. New facts enter only from
  the live LinkedIn profile, explicit user confirmation, or a verifiable public source (e.g. the
  [llama-docs-auditor](https://github.com/fadhlillah2/llama-docs-auditor) repo for the RAG stack).
- **The current resume must always have a matching current PDF** (`resume-vX.Y.pdf`).
  Regenerate the PDF (via `build-pdf.py`) whenever the .txt changes.
- Version scheme per artifact: resume = `vX.Y`, LinkedIn profile = `vN`. Bump on any content change.
- New version → add it here, move the superseded files to `archive/`, update this README.
