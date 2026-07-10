# CV Sources

Single source of truth chain (per 2026-07-06): **live LinkedIn profile** is the SoT for career
claims → captured verbatim in `linkedin-profile-v4.txt` → **resume mirrors it in full**
(user decision 2026-07-06: "mirror penuh" — the resume contains all LinkedIn content and nothing
that is not on LinkedIn). Files at this level are **current**; `archive/` is the audit trail.

## Current

| File | What it is |
|---|---|
| [`linkedin-profile-v4.txt`](linkedin-profile-v4.txt) | **LIVE snapshot** of linkedin.com/in/fadhlillah2 (scraped via MCP, 2026-07-06; re-verified same day — no drift). The SoT transcript. Header lists the v3→live delta (audited improvements never applied on LinkedIn). |
| [`resume-v8.3.txt`](resume-v8.3.txt) | Resume v8.3 — **full mirror** of the live profile (2 pages): LinkedIn headline, About verbatim, all bullets per role incl. the reminder-service / ai-chatbot-mern media blocks, all 8 certifications with credential IDs, all 6 projects, top-visible skills, both recommendations. User-confirmed facts absent from LinkedIn (JUnit 5/Mockito, 5-person team scope, "alongside Assist.id") were **removed** per the mirror decision. |
| [`resume-v8.3.pdf`](resume-v8.3.pdf) | Resume v8.3 PDF (2 pages, typeset) — the distributable. Generated via `build-pdf.py cv/resume-v8.3.txt 2`; extracted text verified identical to the .txt. |
| [`build-pdf.py`](build-pdf.py) | PDF generator: parses the resume .txt, typesets it (Arial, A4), prints via Chrome headless, verifies the PDF text is character-identical to the .txt and fits `max_pages` (2nd CLI arg, default 1). Run: `uv run --with pypdf python3 cv/build-pdf.py cv/resume-vX.Y.txt [max_pages]` |
| [`resume-1pager-v1.0.txt`](resume-1pager-v1.0.txt) / `.pdf` | **Recruiter/ATS edition** — curated 1-page resume (v8.2 lineage refreshed), NOT the LinkedIn mirror. Full keyword SKILLS block, user-confirmed facts (JUnit 5/Mockito, 5-person team scope, "alongside Assist.id"), open-to line, searchable-as aliases. |
| [`consulting-onepager-v1.0.txt`](consulting-onepager-v1.0.txt) / `.pdf` | **Consulting one-pager (EN)** for CEOs/CTOs/business owners buying software development — outcomes in business language, services, verifiable proof links, engagement process. Linked from the site's Services section. |
| [`consulting-onepager-id-v1.0.txt`](consulting-onepager-id-v1.0.txt) / `.pdf` | **Consulting one-pager (Bahasa Indonesia)** — faithful translation of the EN one-pager (same claims; numbers/URLs/nouns verbatim). |

Known scrape limit: LinkedIn only exposes the top ~10 Skills entries to the scraper (each role
shows "+N skills" tags that cannot be expanded) — the resume SKILLS section mirrors what is
verifiably visible.

## Archive

| File | What it is |
|---|---|
| `archive/resume-v8.2.txt` / `.pdf` | v8.2 — curated 1-pager synced from live LinkedIn + user-confirmed facts. Superseded by the full-mirror decision. **Best curated version to date** — revive if the user wants a 1-page curated resume again. |
| `archive/resume-v8.1.txt` / `.pdf` | v8.1 — first typeset release (pre-LinkedIn-sync). |
| `archive/resume-v8.0.txt` / `.pdf` | v8.0 — monospace-render era. |
| `archive/resume-v7.1.pdf` / `.txt` | v7.1 — **stale, do not distribute**. |

Removed from the tree 2026-07-10 (still in Git history if ever needed):
`linkedin-profile-v1.pdf/.txt` (raw export — contained the mobile number),
`linkedin-profile-v2.txt` and `v3.txt` (private editing drafts with strategy
notes — must never be publicly served). The repo is public and GitHub Pages
served everything, so `_config.yml` now excludes `cv/archive/`, this README,
and `build-pdf.py` from the published site.

## Version lineage

```
resume:      v7.1 ──► v8.0 ──► v8.1 ──► v8.2 (curated 1-page) ──► v8.3 (full LinkedIn mirror, 2 pages)
1pager:      resume-1pager v1.0 (recruiter/ATS edition, v8.2 lineage — parallel artifact, not a mirror)
consulting:  consulting-onepager v1.0 (EN) ⇄ v1.0 (ID)
linkedin:    v1 export ──► v2 draft ──► v3 draft (never published) ──► v4 LIVE snapshot (current SoT)
```

## Rules

- **Resume = full mirror of live LinkedIn** (user decision 2026-07-06). On any LinkedIn change:
  re-scrape → new `linkedin-profile-vN.txt` snapshot → regenerate the mirror resume from it.
  No content may appear in the resume that is not on the live profile (or its captured snapshot).
- **Live LinkedIn wins on conflicts**, always.
- `.txt` files paired with a PDF are verbatim-wording transcripts of that PDF
  (layout may be reformatted for readability — `build-pdf.py` enforces this check).
- Anti-fabrication: every metric stands alone exactly as sourced; never merge separate metrics
  into one composite claim, never use a stronger verb than the source.
- **The current resume must always have a matching current PDF.** Regenerate via `build-pdf.py`
  whenever the .txt changes.
- On version bump, also update the direct-PDF links outside this repo: the **Resume badge in the
  GitHub profile README** (repo `fadhlillah2/fadhlillah2`) points to
  `https://fadhlillah2.github.io/Bio/cv/resume-vX.Y.pdf` and will 404 if left stale.
- Version scheme: resume = `vX.Y`, LinkedIn profile = `vN`, 1-pagers = `v1.0`-style per artifact.
  Bump on any content change.
- **Artifact roles:** `resume-v8.3` = official CV (LinkedIn mirror, locked to live profile);
  `resume-1pager` = recruiter/ATS edition (curated; may use user-confirmed + archive-audited facts;
  must never *contradict* LinkedIn); `consulting-onepager` (EN+ID) = business-buyer artifact
  (site-Services wording + resume-sourced metrics only; keep EN/ID in lock-step — same claims,
  translated wording only). Regenerate each PDF via `build-pdf.py` on any change.
- New version → add it here, move the superseded files to `archive/`, update this README.
- The site (`index.html`): career-claim content (hero/meta headline, About, Resume section) is
  synced verbatim to the mirror resume (done 2026-07-06). Site-only sections (Facts, Services,
  Portfolio, Skills grid) may add repo-verifiable detail (e.g. the RAG stack) but must never
  *contradict* the live profile.
