# CV Sources

Single source of truth chain (per 2026-07-06): **live LinkedIn profile** is the SoT for career
claims → captured verbatim in a `linkedin-profile-vN` snapshot (currently `v4`; kept **outside this
repo** since 2026-07-10 — see "Removed from the tree" below) → **resume mirrors it in full**
(user decision 2026-07-06: "mirror penuh" — the resume contains all LinkedIn content and nothing
that is not on LinkedIn). Files at this level are **current**; `archive/` is the audit trail.

> **Open (tracked here and nowhere else):** the FOX Asset role and the rewritten
> expert-advisor-mt-5 project block are not on LinkedIn yet. Until they are pasted, the resume runs
> ahead of the SoT instead of mirroring it. Clear this note once the profile is updated.

## Layout & naming

```
cv/
├── README.md                               ← this file: which file to use + full version history
├── build-pdf.ts                            ← Bun .txt → .pdf generator and verifier
├── build-pdf.py                            ← independent Python reference oracle
├── resume-vX.Y.txt / .pdf                  ← official full CV — LinkedIn mirror, 2 pages
├── resume-onepager-vX.Y.txt / .pdf         ← recruiter/ATS edition, 1 page
├── consulting-onepager-en-vX.Y.txt / .pdf  ← business-buyer one-pager, English
├── consulting-onepager-id-vX.Y.txt / .pdf  ← business-buyer one-pager, Bahasa Indonesia
├── drafts/                                 ← LinkedIn paste-ready drafts (gitignored, local-only)
└── archive/                                ← 2 superseded versions per artifact — never distribute
```

The version numbers in play right now are listed once, under [Current](#current--which-file-do-i-send)
— nowhere else in this file outside the Changelog.

Naming convention: `<artifact>[-<lang>]-v<major.minor>.<ext>` — artifact ∈ {`resume`,
`resume-onepager`, `consulting-onepager`}; `-en`/`-id` appears only where an artifact ships
in two languages; every `.pdf` sits next to the same-named `.txt` it is generated from.

> Naming normalized 2026-07-19 (`resume-1pager-*` → `resume-onepager-*`, EN consulting gained its
> `-en` suffix; content unchanged, no bump). Current PDFs carry Titles matching the new naming;
> `archive/` files were renamed but keep their as-shipped embedded PDF titles.

## Current — which file do I send?

| File                                                                 | Use it for                                                                                                        |
|----------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|
| [`resume-v8.7.pdf`](resume-v8.7.pdf)                                 | Official full CV — LinkedIn **full mirror**, 2 pages                                                              |
| [`resume-onepager-v1.8.pdf`](resume-onepager-v1.8.pdf)               | Job application / recruiter — **ATS edition**, 1 page, curated (v8.2 lineage), NOT the mirror                     |
| [`consulting-onepager-en-v1.4.pdf`](consulting-onepager-en-v1.4.pdf) | Business buyer / consulting lead (EN) — outcomes, services, proof links, process; linked from the site's Services |
| [`consulting-onepager-id-v1.4.pdf`](consulting-onepager-id-v1.4.pdf) | Business buyer / consulting lead (Bahasa Indonesia) — faithful translation of EN, same claims verbatim            |

Each `.pdf` is generated from its same-named `.txt` (the `.txt` is the editable source of truth
for that artifact); `build-pdf.ts` is the current generator and `build-pdf.py` is its reference
oracle. `archive/` holds superseded versions — never distribute from there.

Known scrape limit: LinkedIn only exposes the top ~10 Skills entries to the scraper (each role
shows "+N skills" tags that cannot be expanded) — the resume SKILLS section mirrors what is
verifiably visible.

## Generator — [`build-pdf.ts`](build-pdf.ts)

Parses the .txt, typesets it (Arial/Liberation Sans, A4), prints via Chrome headless (native
Linux/macOS Chrome or WSL Windows Chrome, auto-detected), stamps Title/Author/lang metadata,
verifies the PDF wording is identical to the .txt (whitespace-insensitive) and fits `max_pages`
(2nd CLI arg, default 1; only the full mirror resume needs `2`). Job headers render as one linear
`COMPANY · LOCATION` / `Title · Date` line (ATS-friendly; the `·` separator is CSS-generated and
ignored by the wording check). Consulting one-pagers (detected by filename) get a larger page-fill
CSS profile so their shorter content fills the A4; the recruiter 1-pager gets a slight densify
profile so the v1.4 keyword-expanded SKILLS stay on one page. The Bun implementation uses `unpdf`
for text extraction and `pdf-lib` for metadata; install root dependencies first with `bun install`.
The Python implementation remains available as an independent parity oracle and needs `pypdf` for
full PDF generation.

```bash
bun run cv:selftest
bun cv/build-pdf.ts cv/resume-vX.Y.txt [max_pages]
python3 cv/build-pdf.py --selftest  # independent parser oracle; no pypdf needed
```

## Changelog

Newest first, and complete — this list is the full history even where the files themselves are no
longer in the tree (see [Archive](#archive)).

### resume — full LinkedIn mirror

- **v8.7** (2026-07-18, user correction) — FOX role employment type **Contract → Freelance**
  (user: the FOX engagement is freelance work) — one-word role-header fix; PDF rebuilt &
  2-page-verified; `linkedin-fox-role-v1.txt` (paste-ready working draft — kept **untracked** in
  `drafts/` (gitignored) like the LinkedIn snapshots, together with `linkedin-ea-project-v1.txt`)
  updated in lock-step.
- **v8.6** (2026-07-18, user-requested) — expert-advisor-mt-5 project block rewritten from the
  live repo state — 6 MQL5 EAs with circuit breakers + crash-safe persisted state (was "fleet of
  5"), the preregistered 24/7 live A/B experiment (n=190; spread-timed arm entered $0.063/trade
  cheaper, 95% CI excluding 0), headless Linux VPS (Wine/MT5, systemd) with cron + Telegram
  monitoring, and 300+ backtested gold variants over 10 years of Dukascopy data with 0 passing
  preregistered promotion gates (honest null, no profit claim — demo account stated). Every number
  sourced from the private repo's workspace/CLAUDE.md + docs/analysis via a 4-agent fact harvest,
  2026-07-18; block kept to the same rendered-line footprint as v8.4's so the 2-page limit holds.
- **v8.5** (2026-07-18, user-requested) — adds the **FOX ASSET — INFINITY WAVE SDN BHD** contract
  entry (Backend Software Engineer, Dec 2025 – Present, Malaysia/remote) as the first EXPERIENCE
  entry — 7 bullets covering the Safety Hub (Permit-to-Work/HIRARC + safety induction: 23 models,
  50+ REST endpoints, ~21,000 LOC Python, multi-tier approval + signatures, Celery/wkhtmltopdf +
  WeasyPrint/Pillow PDF pipelines), the solely-built Project Management module (21 endpoints, 10
  models, S-Curve analytics, field-level RBAC, 196 unit tests + 105 for Safety Hub), the 2-week
  AWS/DevOps security engagement (leaked-credential purge, gitleaks CI, migration-drift gate,
  staging env + GitHub Actions→ECR pipeline), and docs (1,260-line bilingual API reference,
  38+23-request Postman collections, 987-line runbooks). Every metric was code/git-verified in the
  FOX repo by a 6-agent audit (2026-07-18) — planned-only items (AWS SSM/KMS/OIDC/rotation) and
  teammates' work (toolbox, inventory FE, tenant customizations) deliberately excluded.
- **v8.4** — full LinkedIn mirror (2 pages; adds expert-advisor-mt-5, confirmed on LinkedIn
  2026-07-12; in-place contact tweaks 2026-07-12/18).
- **v8.3** — first full-mirror release (2 pages, ATS-hardened template).
- **v8.2** — curated 1-pager synced from live LinkedIn + user-confirmed facts. Superseded by the
  full-mirror decision. **Best curated version to date** — revive if the user wants a 1-page
  curated resume again.
- **v8.1** — first typeset release (pre-LinkedIn-sync).
- **v8.0** — monospace-render era.
- **v7.1** — **stale, do not distribute**.

### resume-onepager — recruiter/ATS edition

- **v1.8** (2026-07-19, from the v8.7/v1.7 double-check audit) — "23 Django REST Framework models"
  → "23 Django data models" (models are Django ORM, not DRF — the DRF keyword stays in SKILLS
  Backend); FOX employer header aligned to the full resume's em-dash form
  (`FOX ASSET — INFINITY WAVE SDN BHD`); 1-pager links gain the same `white-space: nowrap` URL
  guard as consulting.
- **v1.7** (2026-07-18, user correction) — FOX role type Contract → **Freelance** (lock-step with
  resume-v8.7); PDF rebuilt & 1-page-verified.
- **v1.6** (2026-07-18) — adds an expert-advisor-mt-5 PROJECTS line (6 MQL5 trading robots, 24/7
  Linux VPS, preregistered live A/B experiment) + `MQL5` in SKILLS Languages; to hold 1 page,
  dropped the "Coordinator of LMNAS-28 UGM" activity line (retained in the full-mirror resume).
- **v1.5** (2026-07-18) — adds a compact **FOX Asset (Infinity Wave Sdn Bhd)** contract entry
  (3 bullets: Safety Hub metrics + PDF pipelines; Project Management module + test counts; AWS/CI-CD
  security engagement) as the first EXPERIENCE entry; SKILLS gains Django REST Framework, Celery,
  GitHub Actions, AWS ECR, gitleaks. To hold 1 page: dropped the standalone FREELANCE section (the
  Kafka 50k+/day metric moved into Assist.id as an explicitly freelance-labelled bullet;
  OpenAI/MongoDB/Express.js/Node.js keywords remain in SKILLS — the literal "MERN" token and React
  were dropped [claim corrected 2026-07-19; the original note over-stated retention]), dropped the
  Danamon OAuth/AES bullet (keywords remain in SKILLS Security) and the Digital Talent Scholarship
  cert line.
- **v1.4** (2026-07-18, from the cv/ audit) — factual ATS keyword expansion — "RAG
  (Retrieval-Augmented Generation)", "ChromaDB (vector database)", embeddings, "LLM (Large Language
  Model)", "MongoDB (NoSQL)", Distributed Systems, High Availability, "Unit testing" — plus Danamon
  location → "JAKARTA, ID" (SoT precision), contact "South Jakarta, Indonesia" (was "ID" — Idaho
  ambiguity), and the "Also searchable as" line now renders as a small de-emphasized footer.
- **v1.3** (2026-07-12) — availability line → "Open to full-time, remote (international) &
  consulting roles" (aligns with the site's canonical availability; dropped the location from the
  open-to line — it duplicated the contact line).
- **v1.2** (2026-07-11) — open-to line "Central Jakarta, WIB" → "Central Jakarta, WIB · UTC+7";
  ATS-hardened template (linear headers, name extracts as the single token `FADHLILLAH`).
- **v1.1** (2026-07-10) — "mentor 5 engineers" → "mentor peers", locations to SoT precision, Meta
  Llama casing, Hugging Face spelling.
- **v1.0** — initial version.

### consulting-onepager — EN ⇄ ID in lock-step

- **v1.4** (2026-07-18, from the cv/ audit) — EN: service lines rewritten outcome-led (mirrors the
  site's Services cards), intro gains the 10-days-vs-17-day-plan differentiator, "dinner rush" →
  "peak restaurant load", headline leads with Remote (international), contact "South Jakarta,
  Indonesia". ID: same, with "jam sibuk makan malam" → "beban puncak restoran".
- **v1.3** (2026-07-12) — availability → "Open to full-time, remote (international), and consulting
  engagements" (aligns with site). ID: "Terbuka untuk peran full-time, remote (internasional), dan
  konsultasi."
- **v1.2** (2026-07-11) — headline "(WIB · UTC+7)" + page-fill layout (~90% of the A4); ID in
  lock-step.
- **v1.1** (2026-07-10) — "7x" → sourced "700%", project name unified to High-Precision
  Contract-Advisor RAG, Llama casing, grammar fix; ID in lock-step + "konsultasi" consistency.
- **v1.0** — initial version.

## Archive

Never distribute from here. `archive/` keeps the **two most recent superseded versions of each
artifact**, plus **`resume-v8.2`** — the best curated 1-page edition, kept on purpose in case a
curated resume is ever wanted again (it was superseded by the full-mirror decision, not by `v8.3`
being a newer edition of the same thing).

Everything older was pruned from the tree 2026-08-17 (24 versions → 9; still in Git history if ever
needed). The [Changelog](#changelog) above remains the complete record.

Removed from the tracked/public tree 2026-07-10 (still in Git history if ever needed):
`linkedin-profile-v1.pdf/.txt` (raw export — contained the mobile number),
`linkedin-profile-v2.txt` and `v3.txt` (private editing drafts with strategy
notes — must never be publicly served), `linkedin-profile-v4.txt` (the SoT
snapshot itself — carries internal delta/strategy notes, so it now lives
outside the repo) and `img/img.png` (stray personal screenshot). The repo is
public; the SvelteKit build publishes only files staged under `static/`, so `cv/archive/`, this
README, both generators, drafts, and the ignored local `img/` workspace never enter the deployed
artifact.

## Rules

- **Resume = full mirror of live LinkedIn** (user decision 2026-07-06). On any LinkedIn change:
  re-scrape → new `linkedin-profile-vN` snapshot kept **outside this repo** (snapshots carry
  internal delta notes and must never be committed) → regenerate the mirror resume from it.
  No content may appear in the resume that is not on the live profile (or its captured snapshot).
- **Live LinkedIn wins on conflicts**, always.
- Each PDF is generated FROM its canonical `.txt` (the .txt is the source);
  `build-pdf.ts` verifies the PDF wording is identical (whitespace-insensitive), and
  `build-pdf.py` remains the independent reference oracle.
- Anti-fabrication: every metric stands alone exactly as sourced; never merge separate metrics
  into one composite claim, never use a stronger verb than the source.
- **The current resume must always have a matching current PDF.** Regenerate via `build-pdf.ts`
  whenever the .txt changes.
- On version bump, also update ALL version-pinned links:
  (a) in-repo — 14 references in total across the home components and writeup route:
  `rg -o 'cv/(resume|consulting)[^"} ]+' src/lib/components src/routes | wc -l`.
  Each artifact is linked in more than one spot; update every one or the live site 404s:
  - `cv/resume-vX.Y.pdf` ×3 (hero **secondary** "Full CV" + both Experience-section CTA rows) and
    `cv/resume-vX.Y.txt` ×2 ("Plain-text version" in both CTA rows);
  - `cv/resume-onepager-vX.Y.pdf` ×5 (**top-bar** "Download CV" + hero **primary** "Download CV"
    + both Experience-section CTA rows + the **writeup top bar**) — bumps on its OWN `v1.x`
    scheme, not with the resume's `v8.x`;
  - `cv/consulting-onepager-en-vX.Y.pdf` ×2 (hero buyer line + Services) and
    `cv/consulting-onepager-id-vX.Y.pdf` ×2 (Services button + the Bahasa Indonesia line);
  (b) outside this repo — the **Resume badge in the GitHub profile README**
  (repo `fadhlillah2/fadhlillah2`) points to
  `https://fadhlillah2.github.io/Bio/cv/resume-vX.Y.pdf` and will 404 if left stale.
- Version scheme: resume = `vX.Y`, LinkedIn profile = `vN`, 1-pagers = `v1.0`-style per artifact.
  Bump on any content change.
- **Artifact roles:** `resume-vX.Y` = official CV (LinkedIn mirror);
  `resume-onepager` = recruiter/ATS edition (curated; may use user-confirmed + archive-audited facts;
  must never *contradict* LinkedIn); `consulting-onepager-{en,id}` = business-buyer artifact
  (site-Services wording + resume-sourced metrics only; keep EN/ID in lock-step — same claims,
  translated wording only). Regenerate each PDF via `build-pdf.ts` on any change.
- New version → add a **Changelog** entry, swap the file in **Current**, and move the superseded
  files to `archive/`, then prune `archive/` back to the two newest per artifact (`resume-v8.2`
  stays regardless). **Current** and the **Changelog** are the only two places a version number
  appears in this README — keep it that way.
- The site (`src/lib/components/About.svelte` and `Resume.svelte`): About and the Experience
  section (`#resume`) stay synced verbatim to the mirror resume.
  The hero/meta headline was re-led for the recruiter scan (2026-07-11: "Backend Software Engineer
  · 6+ yrs · AI Native Engineer") — a re-emphasis of the same facts, not a contradiction of the
  LinkedIn headline. Site-only sections (Facts, Services, Portfolio, Skills grid) may add
  repo-verifiable detail (e.g. the RAG stack) but must never *contradict* the live profile.
