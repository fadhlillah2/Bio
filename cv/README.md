# CV Sources

Single source of truth chain (per 2026-07-06): **live LinkedIn profile** is the SoT for career
claims → captured verbatim in a `linkedin-profile-vN` snapshot (kept **outside this repo** since
2026-07-10 — see "Removed from the tree" below) → **resume mirrors it in full**
(user decision 2026-07-06: "mirror penuh" — the resume contains all LinkedIn content and nothing
that is not on LinkedIn). Files at this level are **current**; `archive/` is the audit trail.

## TL;DR — which file do I use?

| Need | Send this |
|---|---|
| Official full CV (LinkedIn mirror, 2 pages) | [`resume-v8.7.pdf`](resume-v8.7.pdf) |
| Job application / recruiter (1 page, ATS-keyworded) | [`resume-1pager-v1.8.pdf`](resume-1pager-v1.8.pdf) |
| Business buyer / consulting lead (EN) | [`consulting-onepager-v1.4.pdf`](consulting-onepager-v1.4.pdf) |
| Business buyer / consulting lead (Bahasa Indonesia) | [`consulting-onepager-id-v1.4.pdf`](consulting-onepager-id-v1.4.pdf) |

Each `.pdf` is generated from its same-named `.txt` (the `.txt` is the editable source of truth
for that artifact); `build-pdf.py` is the generator; `archive/` holds superseded versions —
never distribute from there.

## Current

| File | What it is |
|---|---|
| [`resume-v8.7.txt`](resume-v8.7.txt) / [`.pdf`](resume-v8.7.pdf) | Resume v8.7 — **full mirror** lineage (2 pages). v8.7 (2026-07-18, user correction): FOX role employment type **Contract → Freelance** (user: the FOX engagement is freelance work) — one-word role-header fix; PDF rebuilt & 2-page-verified; `linkedin-fox-role-v1.txt` (paste-ready working draft — kept **untracked/outside the repo** like the LinkedIn snapshots, now gitignored together with `linkedin-ea-project-v1.txt`) updated in lock-step. v8.6 (2026-07-18, archived, user-requested): expert-advisor-mt-5 project block rewritten from the live repo state — 6 MQL5 EAs with circuit breakers + crash-safe persisted state (was "fleet of 5"), the preregistered 24/7 live A/B experiment (n=190; spread-timed arm entered $0.063/trade cheaper, 95% CI excluding 0), headless Linux VPS (Wine/MT5, systemd) with cron + Telegram monitoring, and 300+ backtested gold variants over 10 years of Dukascopy data with 0 passing preregistered promotion gates (honest null, no profit claim — demo account stated). Every number sourced from the private repo's workspace/CLAUDE.md + docs/analysis via a 4-agent fact harvest, 2026-07-18; block kept to the same rendered-line footprint as v8.4's so the 2-page limit holds. **LinkedIn paste pending** — update the Freelance-role project description to match. v8.5 (2026-07-18, archived, user-requested): adds the **FOX ASSET — INFINITY WAVE SDN BHD** contract entry (Backend Software Engineer, Dec 2025 – Present, Malaysia/remote) as the first EXPERIENCE entry — 7 bullets covering the Safety Hub (Permit-to-Work/HIRARC + safety induction: 23 models, 50+ REST endpoints, ~21,000 LOC Python, multi-tier approval + signatures, Celery/wkhtmltopdf + WeasyPrint/Pillow PDF pipelines), the solely-built Project Management module (21 endpoints, 10 models, S-Curve analytics, field-level RBAC, 196 unit tests + 105 for Safety Hub), the 2-week AWS/DevOps security engagement (leaked-credential purge, gitleaks CI, migration-drift gate, staging env + GitHub Actions→ECR pipeline), and docs (1,260-line bilingual API reference, 38+23-request Postman collections, 987-line runbooks). Every metric was code/git-verified in the FOX repo by a 6-agent audit (2026-07-18) — planned-only items (AWS SSM/KMS/OIDC/rotation) and teammates' work (toolbox, inventory FE, tenant customizations) deliberately excluded. **LinkedIn paste pending** — add the FOX role on LinkedIn to restore full-mirror status. |
| [`build-pdf.py`](build-pdf.py) | PDF generator: parses the .txt, typesets it (Arial/Liberation Sans, A4), prints via Chrome headless (native Linux/macOS Chrome or WSL Windows Chrome, auto-detected), stamps Title/Author/lang metadata, verifies the PDF wording is identical to the .txt (whitespace-insensitive) and fits `max_pages` (2nd CLI arg, default 1; resume-v8.7 needs `2`). Job headers render as one linear `COMPANY · LOCATION` / `Title · Date` line (ATS-friendly; the `·` separator is CSS-generated and ignored by the wording check). Consulting one-pagers (detected by filename) get a larger page-fill CSS profile so their shorter content fills the A4; the recruiter 1-pager gets a slight densify profile so the v1.4 keyword-expanded SKILLS stay on one page. Needs `pypdf`. Run: `python3 cv/build-pdf.py cv/resume-vX.Y.txt [max_pages]` |
| [`resume-1pager-v1.8.txt`](resume-1pager-v1.8.txt) / [`.pdf`](resume-1pager-v1.8.pdf) | **Recruiter/ATS edition** — curated 1-page resume (v8.2 lineage), NOT the LinkedIn mirror. v1.8 (2026-07-19, from the v8.7/v1.7 double-check audit): "23 Django REST Framework models" → "23 Django data models" (models are Django ORM, not DRF — the DRF keyword stays in SKILLS Backend); FOX employer header aligned to the full resume's em-dash form (`FOX ASSET — INFINITY WAVE SDN BHD`); 1-pager links gain the same `white-space: nowrap` URL guard as consulting. v1.7 (2026-07-18, archived, user correction): FOX role type Contract → **Freelance** (lock-step with resume-v8.7); PDF rebuilt & 1-page-verified. v1.6 (2026-07-18, archived): adds an expert-advisor-mt-5 PROJECTS line (6 MQL5 trading robots, 24/7 Linux VPS, preregistered live A/B experiment) + `MQL5` in SKILLS Languages; to hold 1 page, dropped the "Coordinator of LMNAS-28 UGM" activity line (retained in the full-mirror resume). v1.5 (2026-07-18, archived): adds a compact **FOX Asset (Infinity Wave Sdn Bhd)** contract entry (3 bullets: Safety Hub metrics + PDF pipelines; Project Management module + test counts; AWS/CI-CD security engagement) as the first EXPERIENCE entry; SKILLS gains Django REST Framework, Celery, GitHub Actions, AWS ECR, gitleaks. To hold 1 page: dropped the standalone FREELANCE section (the Kafka 50k+/day metric moved into Assist.id as an explicitly freelance-labelled bullet; OpenAI/MongoDB/Express.js/Node.js keywords remain in SKILLS — the literal "MERN" token and React were dropped [claim corrected 2026-07-19; the original note over-stated retention]), dropped the Danamon OAuth/AES bullet (keywords remain in SKILLS Security) and the Digital Talent Scholarship cert line. v1.4 (2026-07-18, archived, from the cv/ audit): factual ATS keyword expansion — "RAG (Retrieval-Augmented Generation)", "ChromaDB (vector database)", embeddings, "LLM (Large Language Model)", "MongoDB (NoSQL)", Distributed Systems, High Availability, "Unit testing" — plus Danamon location → "JAKARTA, ID" (SoT precision), contact "South Jakarta, Indonesia" (was "ID" — Idaho ambiguity), and the "Also searchable as" line now renders as a small de-emphasized footer. v1.3 (2026-07-12, archived): availability line → "Open to full-time, remote (international) & consulting roles" (aligns with the site's canonical availability; dropped the location from the open-to line — it duplicated the contact line). v1.2 (2026-07-11, archived): open-to line "Central Jakarta, WIB" → "Central Jakarta, WIB · UTC+7"; ATS-hardened template (linear headers, name extracts as the single token `FADHLILLAH`). v1.1 (2026-07-10, archived): "mentor 5 engineers" → "mentor peers", locations to SoT precision, Meta Llama casing, Hugging Face spelling. |
| [`consulting-onepager-v1.4.txt`](consulting-onepager-v1.4.txt) / `.pdf` | **Consulting one-pager (EN)** for CEOs/CTOs/business owners buying software development — outcomes in business language, services, verifiable proof links, engagement process. Linked from the site's Services section. v1.4 (2026-07-18, from the cv/ audit): service lines rewritten outcome-led (mirrors the site's Services cards), intro gains the 10-days-vs-17-day-plan differentiator, "dinner rush" → "peak restaurant load", headline leads with Remote (international), contact "South Jakarta, Indonesia". v1.3 (2026-07-12, archived): availability → "Open to full-time, remote (international), and consulting engagements" (aligns with site). v1.2 (2026-07-11, archived): headline "(WIB · UTC+7)" + page-fill layout (~90% of the A4). v1.1 (2026-07-10, archived): "7x" → sourced "700%", project name unified to High-Precision Contract-Advisor RAG, Llama casing, grammar fix. |
| [`consulting-onepager-id-v1.4.txt`](consulting-onepager-id-v1.4.txt) / `.pdf` | **Consulting one-pager (Bahasa Indonesia)** — faithful translation of the EN one-pager (same claims; numbers/URLs/nouns verbatim). v1.4 (2026-07-18, lock-step with EN): outcome-led services, the 10-vs-17-day differentiator, "jam sibuk makan malam" → "beban puncak restoran", "South Jakarta, Indonesia". v1.3 (2026-07-12, archived): availability → "Terbuka untuk peran full-time, remote (internasional), dan konsultasi." v1.2 (2026-07-11, archived): "(WIB · UTC+7)" + page-fill layout. v1.1 (2026-07-10, archived): lock-step with EN + "konsultasi" consistency. |

Known scrape limit: LinkedIn only exposes the top ~10 Skills entries to the scraper (each role
shows "+N skills" tags that cannot be expanded) — the resume SKILLS section mirrors what is
verifiably visible.

## Archive

| File | What it is |
|---|---|
| `archive/resume-v8.6.txt` / `.pdf` | v8.6 — expert-advisor-mt-5 block rewritten from live repo state. Superseded by v8.7 (FOX role type Contract → Freelance). |
| `archive/resume-1pager-v1.7.txt` / `.pdf` | 1pager v1.7 — FOX role type Contract → Freelance. Superseded by v1.8 (Django data-models mislabel fix, em-dash header, URL nowrap guard). |
| `archive/resume-1pager-v1.6.txt` / `.pdf` | 1pager v1.6 — + expert-advisor-mt-5 PROJECTS line + MQL5 skill. Superseded by v1.7 (FOX role type Contract → Freelance). |
| `archive/resume-v8.5.txt` / `.pdf` | v8.5 — adds the FOX Asset — Infinity Wave entry (as "Contract"; corrected to Freelance in v8.7). Superseded by v8.6 (expert-advisor-mt-5 block rewritten from the live repo). |
| `archive/resume-1pager-v1.5.txt` / `.pdf` | 1pager v1.5 — adds the FOX Asset contract entry; Freelance section folded into Assist.id. Superseded by v1.6 (+ expert-advisor-mt-5 PROJECTS line + MQL5 skill; LMNAS activity line dropped). |
| `archive/resume-v8.4.txt` / `.pdf` | v8.4 — full LinkedIn mirror (2 pages; adds expert-advisor-mt-5, confirmed on LinkedIn 2026-07-12; in-place contact tweaks 2026-07-12/18). Superseded by v8.5 (adds the FOX Asset — Infinity Wave contract entry). |
| `archive/resume-1pager-v1.4.txt` / `.pdf` | 1pager v1.4 — ATS keyword expansion + location precision + alias footer. Superseded by v1.5 (adds the FOX Asset contract entry; trims Freelance section to hold 1 page). |
| `archive/resume-1pager-v1.3.txt` / `.pdf` | 1pager v1.3 — superseded by v1.4 (ATS keyword expansion, Danamon "JAKARTA", "Indonesia" contact, alias footer). |
| `archive/consulting-onepager-v1.3.txt` / `.pdf` | consulting EN v1.3 — superseded by v1.4 (outcome-led services, 10-vs-17-day differentiator, peak restaurant load). |
| `archive/consulting-onepager-id-v1.3.txt` / `.pdf` | consulting ID v1.3 — superseded by v1.4 (lock-step with EN). |
| `archive/resume-v8.3.txt` / `.pdf` | v8.3 — first full-mirror release (2 pages, ATS-hardened template). Superseded by v8.4 (adds the expert-advisor-mt-5 project block). |
| `archive/resume-1pager-v1.2.txt` / `.pdf` | 1pager v1.2 — superseded by v1.3 (availability → "full-time, remote (international) & consulting"). |
| `archive/consulting-onepager-v1.2.txt` / `.pdf` | consulting EN v1.2 — superseded by v1.3 (availability → "full-time, remote (international), and consulting engagements"). |
| `archive/consulting-onepager-id-v1.2.txt` / `.pdf` | consulting ID v1.2 — superseded by v1.3 (lock-step: availability → internasional). |
| `archive/resume-v8.2.txt` / `.pdf` | v8.2 — curated 1-pager synced from live LinkedIn + user-confirmed facts. Superseded by the full-mirror decision. **Best curated version to date** — revive if the user wants a 1-page curated resume again. |
| `archive/resume-v8.1.txt` / `.pdf` | v8.1 — first typeset release (pre-LinkedIn-sync). |
| `archive/resume-v8.0.txt` / `.pdf` | v8.0 — monospace-render era. |
| `archive/resume-v7.1.pdf` / `.txt` | v7.1 — **stale, do not distribute**. |
| `archive/resume-1pager-v1.1.txt` / `.pdf` | 1pager v1.1 — superseded by v1.2 (WIB · UTC+7; ATS-hardened header/name rendering). |
| `archive/resume-1pager-v1.0.txt` / `.pdf` | 1pager v1.0 — superseded by v1.1 (mentor-5 wording, locations, casing). |
| `archive/consulting-onepager-v1.1.txt` / `.pdf` | consulting EN v1.1 — superseded by v1.2 (WIB · UTC+7; page-fill layout). |
| `archive/consulting-onepager-v1.0.txt` / `.pdf` | consulting EN v1.0 — superseded by v1.1 (7x → 700%, project name). |
| `archive/consulting-onepager-id-v1.1.txt` / `.pdf` | consulting ID v1.1 — superseded by v1.2 (lock-step with EN: WIB · UTC+7; page-fill layout). |
| `archive/consulting-onepager-id-v1.0.txt` / `.pdf` | consulting ID v1.0 — superseded by v1.1 (lock-step with EN). |

Removed from the tree 2026-07-10 (still in Git history if ever needed):
`linkedin-profile-v1.pdf/.txt` (raw export — contained the mobile number),
`linkedin-profile-v2.txt` and `v3.txt` (private editing drafts with strategy
notes — must never be publicly served), `linkedin-profile-v4.txt` (the SoT
snapshot itself — carries internal delta/strategy notes, so it now lives
outside the repo) and `img/img.png` (stray personal screenshot). The repo is
public and GitHub Pages served everything, so `_config.yml` now excludes
`cv/archive/`, this README, and `build-pdf.py` from the published site.

## Version lineage

```
resume:      v7.1 ──► v8.0 ──► v8.1 ──► v8.2 (curated 1-page) ──► v8.3 (full LinkedIn mirror, 2 pages) ──► v8.4 (+ expert-advisor-mt-5 block) ──► v8.5 (+ FOX Asset — Infinity Wave entry) ──► v8.6 (expert-advisor-mt-5 block rewritten from live repo state) ──► v8.7 (FOX role type Contract → Freelance; LinkedIn paste pending for both)
1pager:      resume-1pager v1.0 ──► v1.1 ──► v1.2 ──► v1.3 ──► v1.4 (ATS keyword expansion) ──► v1.5 (+ FOX Asset entry, Freelance section trimmed) ──► v1.6 (+ expert-advisor-mt-5 PROJECTS line + MQL5 skill) ──► v1.7 (FOX role type → Freelance) ──► v1.8 (recruiter/ATS edition, v8.2 lineage — parallel artifact, not a mirror; v1.8 = Django data-models fix + em-dash header + URL nowrap)
consulting:  consulting-onepager v1.0 ──► v1.1 ──► v1.2 ──► v1.3 ──► v1.4 (EN) ⇄ same chain (ID)   [v1.4 = outcome-led services + 10-vs-17-day differentiator]
linkedin:    v1 export ──► v2 draft ──► v3 draft (never published) ──► v4 LIVE snapshot (current SoT — kept outside the repo)
```

## Rules

- **Resume = full mirror of live LinkedIn** (user decision 2026-07-06). On any LinkedIn change:
  re-scrape → new `linkedin-profile-vN` snapshot kept **outside this repo** (snapshots carry
  internal delta notes and must never be committed) → regenerate the mirror resume from it.
  No content may appear in the resume that is not on the live profile (or its captured snapshot).
- **Live LinkedIn wins on conflicts**, always.
- Each PDF is generated FROM its canonical `.txt` (the .txt is the source);
  `build-pdf.py` verifies the PDF wording is identical (whitespace-insensitive).
- Anti-fabrication: every metric stands alone exactly as sourced; never merge separate metrics
  into one composite claim, never use a stronger verb than the source.
- **The current resume must always have a matching current PDF.** Regenerate via `build-pdf.py`
  whenever the .txt changes.
- On version bump, also update ALL version-pinned links:
  (a) in-repo `index.html`. Each artifact is linked in more than one spot — update every one or
  the live site 404s:
  - `cv/resume-vX.Y.pdf`/`.txt` (full mirror) — hero **secondary** "Full CV" + Resume section;
  - `cv/resume-1pager-vX.Y.pdf` (recruiter/ATS 1-pager — bumps on its OWN `v1.x` scheme, not with
    resume-v8.4) — hero **primary** "Download CV" + two Resume-section CTA rows (top + bottom);
  - `cv/consulting-onepager[-id]-vX.Y.pdf` — hero buyer line + Services section;
  (b) outside this repo — the **Resume badge in the GitHub profile README**
  (repo `fadhlillah2/fadhlillah2`) points to
  `https://fadhlillah2.github.io/Bio/cv/resume-vX.Y.pdf` and will 404 if left stale.
- Version scheme: resume = `vX.Y`, LinkedIn profile = `vN`, 1-pagers = `v1.0`-style per artifact.
  Bump on any content change.
- **Artifact roles:** `resume-v8.7` = official CV (LinkedIn mirror; v8.7 = FOX Asset freelance entry + rewritten MT5 block, **LinkedIn paste pending**);
  `resume-1pager` = recruiter/ATS edition (curated; may use user-confirmed + archive-audited facts;
  must never *contradict* LinkedIn); `consulting-onepager` (EN+ID) = business-buyer artifact
  (site-Services wording + resume-sourced metrics only; keep EN/ID in lock-step — same claims,
  translated wording only). Regenerate each PDF via `build-pdf.py` on any change.
- New version → add it here, move the superseded files to `archive/`, update this README.
- The site (`index.html`): About and the Resume section stay synced verbatim to the mirror resume.
  The hero/meta headline was re-led for the recruiter scan (2026-07-11: "Backend Software Engineer
  · 6+ yrs · AI Native Engineer") — a re-emphasis of the same facts, not a contradiction of the
  LinkedIn headline. Site-only sections (Facts, Services, Portfolio, Skills grid) may add
  repo-verifiable detail (e.g. the RAG stack) but must never *contradict* the live profile.
