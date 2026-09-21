# CV Sources

Single source of truth chain (per 2026-07-06): **live LinkedIn profile** is the SoT for career
claims → captured verbatim in a `linkedin-profile-vN` snapshot (currently `v6`; kept **outside this
repo** since 2026-07-10 — see "Removed from the tree" below) → **resume mirrors it in full**
(user decision 2026-07-06: "mirror penuh" — the resume contains all LinkedIn content and nothing
that is not on LinkedIn). Files at this level are **current**; `archive/` is the audit trail.

> **Open (known SoT/publication gaps — reviewed 2026-09-20):**
> (1) the FOX Asset role and the rewritten expert-advisor-mt-5 project block are not on LinkedIn
> yet, so `resume-v8.10` runs ahead of the SoT; (2) the **Fineksi** role is user-confirmed and shown
> on the site (Experience card, About "Current", JSON-LD `worksFor`) but is not on LinkedIn or in
> any `cv/` artifact yet; (3) the site's FOX bullets (rewritten 2026-09-19 at the user's request,
> commit `fbcc741`) are a repo-grounded variant that drops the resume metrics — the resume remains
> the canonical full text. Clear each item as its source is updated.

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
| [`resume-v8.10.pdf`](resume-v8.10.pdf)                               | Official full CV — LinkedIn **full mirror**, 2 pages                                                              |
| [`resume-onepager-v1.13.pdf`](resume-onepager-v1.13.pdf)             | Job application / recruiter — **ATS edition**, 1 page, curated (v8.2 lineage), NOT the mirror                     |
| [`consulting-onepager-en-v1.9.pdf`](consulting-onepager-en-v1.9.pdf) | Business buyer / consulting lead (EN) — outcomes, services, proof links, process; linked from the site's Services |
| [`consulting-onepager-id-v1.9.pdf`](consulting-onepager-id-v1.9.pdf) | Business buyer / consulting lead (Bahasa Indonesia) — faithful translation of EN, same claims verbatim            |

Each `.pdf` is generated from its same-named `.txt` (the `.txt` is the editable source of truth
for that artifact); `build-pdf.ts` is the current generator and `build-pdf.py` is its reference
oracle. `archive/` holds superseded versions — never distribute from there.

Known scrape limit: LinkedIn only exposes the top ~10 Skills entries to the scraper (each role
shows "+N skills" tags that cannot be expanded) — the resume SKILLS section mirrors what is
verifiably visible.

## Generator — [`build-pdf.ts`](build-pdf.ts)

Parses the .txt, typesets it (Times New Roman / Liberation Serif, A4), prints via Chrome headless
(native Linux/macOS Chrome or WSL Windows Chrome, auto-detected), stamps Title/Author/lang metadata,
verifies the PDF wording is identical to the .txt (whitespace-insensitive) and fits `max_pages`
(2nd CLI arg, default 1; only the full mirror resume needs `2`).

Header block: the first non-blank line is the name, and every line up to the first blank line
belongs to the header — a line carrying a link is the centred contact line, a line without one is
the headline. Inside a header line, `label <target>` renders as a link whose visible text is only
the label (`email <me@gmail.com>` → a `mailto:` link reading "email"); the target is an email
address or a domain path (`github.com/…`, `linkedin.com/in/…`, `wa.me/…`,
`fadhlillah2.github.io/…`). The wording check ignores ` <target>`, and both generators also verify
that every target came out of Chrome as a clickable URI annotation with exactly that href, that
its label is visible in the PDF text, and that no link wrapped across a line (one annotation per
link — a wrapped URL gets one per fragment, and the whitespace-insensitive wording check cannot
see the break that plain-text extraction turns into a dead 404). `bun run check:cv` re-verifies
the committed PDFs the same way and additionally rasterises each one with `pdftoppm`
(poppler-utils; installed by the deploy workflow) to gate ink coverage and the name's glyph size,
which white type or Chrome's shrink-to-fit would otherwise pass silently.

Job headers put the location/date column flush right on the header row's own baseline, in DOM order,
so plain-text extraction still reads `COMPANY` → `LOCATION` → `Title` → `Dates` in that order in
Poppler's `-raw` and `-layout` modes, which keep each pair on one line. Its default mode is
column-aware and is the cost of this look: it emits the right-hand column as its own block, so in
EDUCATION `YOGYAKARTA, ID` lands after the degree line, and the fixed-width skills label column
pulls `Also listed` one row early — two word pairs out of order in the whole document. The reference
export fares worse in that same mode: it hoists `LOCATION` above every `COMPANY` and splits each
skills label from its values. No text is lost and `-raw`/`-layout`/`unpdf` are all exact, so the
wording check runs on `unpdf`; the old inline `COMPANY · LOCATION` was clean in all four modes and
was traded away for the reference's flush-right column. Resume PDFs use a centred name and contact
line, underlined section rules, hanging `●` bullets, a fixed-width skills label column, and unbroken
URLs and hyphenated terms to preserve extraction order and spelling. The full resume keeps each
company or project group together, allowing long experience entries to break between project groups.
Consulting one-pagers (detected by filename) keep their own Arial page-fill profile, untouched by
the resume look. The Bun implementation uses `unpdf` for text extraction and `pdf-lib` for metadata;
install root dependencies first with `bun install`. The Python implementation remains available as
an independent parity oracle and needs `pypdf` for full PDF generation.

```bash
bun run cv:selftest
bun cv/build-pdf.ts cv/resume-vX.Y.txt [max_pages]
python3 cv/build-pdf.py --selftest  # independent parser oracle; no pypdf needed
```

Layout refresh (2026-09-14): both resume artifacts follow the user's own Google Docs resume export
(`img/Resume-Fadhlillah-7.1 (6).pdf`, local-only) — A4 with 36 pt top/bottom and 43 pt side margins,
Times New Roman (Liberation Serif locally) on a 1.35 line, a centred name at 1.45 em over a centred
contact line whose link labels are #1155cc and underlined, 1.09 em underlined section headings,
0.91 em bold grey locations flush right, bold-italic degree lines in EDUCATION, `●` bullets hanging
at 1.6/3.3 em, and a skills label column 6.5 em wide so every colon lines up. The reference sets
body text at 11 pt. The recruiter one-pager keeps that size and is cut to fit instead (one line per
bullet — see the latest one-pager entry in the Changelog); the full mirror cannot be cut, so its profile scales the same
look to 8.5 pt, the largest size that still fits 2 pages (9.5 → 8.6 pt all spill onto a third page;
~78 pt spare on page 2). Consulting one-pagers are untouched — both generators still emit
byte-identical HTML for them. The earlier refresh (2026-09-05) had put both resumes on 9/8.9 pt Arial.

## Changelog

Newest first, and complete — this list is the full history even where the files themselves are no
longer in the tree (see [Archive](#archive)).

### resume — full LinkedIn mirror

- **v8.10** (2026-09-20, FOX metrics refresh after the FOX/Fineksi claims audit) — the FOX block's
  dated 2026-07-18 numbers were recounted against FOX `development-server-5.0` @ `6709928a9`
  (2026-09-18) with `git blame` scoped to the user's authors, teammates excluded: data models
  **23 → 24** (17 safety_form + 7 safety_induction), email notification flows **12 → 17**
  (14 + 3, all user-authored), Safety Hub unit tests **105 → 313** (279 + 34, user-authored).
  The staging clause no longer implies a running box — "built the staging environment definition
  and GitHub Actions CI/CD pipeline to AWS ECR" (the redundant "database" in "migration-drift
  gate" was dropped to keep the same rendered line count). Nothing else changed; 2 pages verified
  by both generators. v8.9 archived, v8.7 pruned.
- **v8.9** (2026-09-05, LinkedIn sync — snapshot v6) — one word: the Danamon microservices bullet now
  reads "Built and operat**ed** 12 Spring Boot microservices…" after the user corrected the tense on
  the live profile (the role ended Aug 2026). Nothing else changed; 2 pages verified by both generators.
- **v8.8** (2026-09-05, LinkedIn sync — snapshot v5) — the Bank Danamon entry mirrors the rewritten
  live profile: dates **Aug 2023 – Aug 2026** (was Present) and the 8 new bullets (iRecon Java/GWT
  reconciliation platform, batch reporting with SWIFT MT940/942/950 over Email/SFTP/MFT with PGP/AES,
  FSC modules with maker-checker/LDAP/audit trail, query + caching tuning for 48-hour SLAs, the
  10-day SFTP platform, LLM-assisted docs 40 h → 4 and 95 % coverage, 12 Spring Boot microservices
  at 2M+ req/day / sub-200ms / 500k+ daily transactions, OAuth 2.0/JWT/AES-256). Dropped with the
  profile: "$10M+ daily volume", "65 % prep time", "urgent 48h deadline" bullets. Everything else
  verbatim from v8.7; 2 pages verified by both generators.
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

- **v1.13** (2026-09-20, FOX metrics refresh, lock-step with `resume-v8.10`) — "23 Django models" →
  "24 Django models" (same author-scoped recount). No other claim changed; 1 page verified by both
  generators. v1.12 archived, v1.10 pruned.
- **v1.12** (2026-09-14, layout switch to the user's Google Docs resume format — user decision) — the
  recruiter edition now has the layout of the resume the user was sending out: Times 11 pt on A4, five
  sections (OBJECTIVE / EXPERIENCE / SKILLS / EDUCATION / PROJECTS & CERTIFICATIONS), one centred
  contact line whose values live only in the hyperlinks (`email • phone • LinkedIn • GitHub`), no
  headline line, no site URL, no "Target roles" footer. To hold one page at the reference's type size
  every bullet was cut to a single line; the Danamon LLM bullet became two (docs 40 h → 4; core-module
  test coverage (JUnit 5, Mockito) to 95 %). Dropped — facts: the "5-person team / mentored peers"
  line, the IDstar OWASP/Azure/SonarLint bullet, "Permit-to-Work/HIRARC forms + safety induction",
  "Kanban/timeline", "S-Curve analytics, field-level RBAC", the Celery/wkhtmltopdf/WeasyPrint +
  QR-verified-certificates clause, the ECR staging clause, "session tracking", "LDAP-based access", the
  Email/SFTP/MFT (PGP/AES) delivery clause, the 48-hour-SLA clause, "(payments, logistics, SMS)",
  "across POS and Kitchen Display systems", the 88 %+/PASAL clause, the rate-limiter algorithm names
  and the "preregistered live A/B experiment" phrase, both project URLs; dropped — metrics: "~21,000
  lines of Python", "plus 105 [unit tests] for the Safety Hub apps", "across 500k+ daily transactions",
  "10 [report] formats"; dropped — skills/keywords: "embeddings (Hugging Face)", "AI chatbots",
  Celery, Flyway, "High Availability", and the parenthetical ATS expansions; the `Integration` row is
  labelled `Messaging` (same items); the three freeCodeCamp certificate names are summarised as
  "(Python, JavaScript)". Regained from the live profile: "Digital Talent Scholarship, Progate" on the
  certification line. Every remaining number is verbatim from v1.11, no verb was strengthened, and no
  claim widened (the "core-module" qualifier on the 95 % coverage is kept). 1 page (~35 pt spare)
  verified by both generators.
- **v1.11** (2026-09-05, LinkedIn sync — snapshot v5, lock-step with resume-v8.8) — Bank Danamon
  dates **Aug 2023 – Aug 2026** (was Present) and the block rewritten from the new profile bullets:
  12 Spring Boot microservices (hexagonal) at 2M+ req/day / sub-200ms / 500k+ daily transactions;
  iRecon Java/GWT reconciliation platform (660+ classes) with batch reporting incl. SWIFT
  MT940/942/950 over Email/SFTP/MFT (PGP/AES); FSC modules over encrypted REST APIs with
  maker-checker, LDAP-based access and audit trail, query + caching tuning for 48-hour SLAs; the
  10-day SFTP platform and LLM-assisted docs 40 h → 4 with 95 % coverage (JUnit 5, Mockito); the
  user-confirmed 5-person-team/mentoring line stays. Dropped with the profile: "$10M+ daily
  volume" and "65 % test-prep time"; the OAuth/JWT/AES-256 clause lives on in SKILLS Security.
  SUMMARY now past tense for banking ("Built and operated") and drops its standalone SFTP 10-day
  sentence (the claim stays in the Danamon block). To hold 1 page: IDstar SSO bullet
  loses "enterprise" and "managed sessions with Redis" (Redis stays in SKILLS), Assist.id API bullet
  loses "Designed and", HackerRank joins the freeCodeCamp line, DevOps row drops "Maven, Git".
  1 page (≈20 pt slack) verified by both generators.
- **v1.10** (2026-09-05, ATS keyword recovery after the v1.9 review — C-009/C-011/C-084) —
  headline regains `Microservices` (`Java · Spring Boot · Microservices · 2M+ req/day`); the
  "Target roles" footer recovers the four synonyms the v1.4–v1.8 "Also searchable as" line carried
  (Backend Developer, Golang Engineer, GenAI Engineer, LLM Engineer) on top of v1.9's own two
  (Backend Software Engineer, Java/Spring Boot Engineer), kept on one line so the parser keeps the
  alias style; SKILLS AI/LLM writes `embeddings (Hugging Face)` (repo-verified project stack, the
  same fact the site's project card carries; v1.0–v1.8 had it in PROJECTS). The `Integration`
  label and `UNIVERSITAS GADJAH MADA (UGM)` stay: neither contradicts the mirror or the site —
  `Integration` is the ≤13-char parser-safe form of the site's *Messaging & Integration*, and
  `(UGM)` matches the site's education line. No metric changed; 1 page verified by both generators.
- **v1.9** (2026-09-05, recruiter-wording audit) — tightens the summary and availability wording;
  replaces the informal `@` headline notation and `CI-CD`; scopes the AWS security engagement more
  precisely; leads the RAG project with its repo-documented Indonesian-contract differentiator (88%+
  EasyOCR accuracy and PASAL/AYAT/BAB structure preservation) and de-hyphenates the name to
  "High-Precision Contract Advisor RAG" (matches the upstream README title); clarifies the
  Integration category and education line; "Also searchable as" keyword footer → "Target roles"
  (parser branch widened so it keeps the de-emphasized style). No metrics strengthened and no new
  unsourced claims added.
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

- **v1.9** (2026-09-17, OCR evidence clarification; EN/ID lock-step) — removes the compact
  OCR accuracy figure while retaining OCR processing of scanned Indonesian contracts. The site
  attributes the historical figure to the project README and explains its measurement limits.
  Other claims unchanged; 1 page each.
- **v1.8** (2026-09-17, proof wording correction; EN/ID lock-step) — replaces the
  PASAL/AYAT/BAB preservation claim with OCR processing of scanned Indonesian contracts,
  consistent with the public writeup's normalization limitation. Other claims unchanged; 1 page each.

- **v1.7** (2026-09-05, LinkedIn sync — snapshot v5; EN/ID lock-step) — the Bank Danamon role ended
  Aug 2026, so the first-person banking claims move to past tense ("built and operated", "the 12
  microservices I ran handled"), and the "$10M+ daily volume" reliability line — no longer on the
  profile — becomes "corporate reporting pipelines I tuned consistently met 48-hour reporting SLAs"
  (ID: "pipeline pelaporan korporat yang saya optimalkan"); SERVICES Microservices row reads "12
  services delivered in production banking" (ID row unchanged: Indonesian carries no tense marker); ID Scale bullet drops the
  word "sektor" for line budget. No other claim changed; 1 page each.
- **v1.6** (2026-09-05, review decisions C-024/C-136) — opener restores the sourced "6+ years";
  PROVEN OUTCOMES restores the resume's hedges in first person ("12 microservices I run",
  "financial systems I support"); SERVICES gains the "Cloud & CI/CD" line mirroring the site's
  Cloud & Delivery Engineering card (Azure/AWS, GitHub Actions CI/CD to Amazon ECR, secret
  scanning, migration-drift checks) and tightens the Backend/AI/Databases lines to one line each
  so the page budget holds; handover step reads "Complete handover on delivery". ID: same claims,
  plus "2M+"/"$10M+" localized to "2 juta+"/"$10 juta+" so "M" is not read as miliar ("500k+"/"50k+"
  unchanged).
- **v1.5** (2026-09-05, wording-and-evidence audit) — uses direct first-person positioning; scopes
  service claims to their supporting evidence; removes the IDstar-only `90+` quality score from the
  forward-looking delivery process; leads proof with the repo-documented Indonesian-contract RAG
  differentiator (88%+ EasyOCR accuracy, PASAL/AYAT/BAB structure) in place of the hackathon
  Credential ID; de-hyphenates the project name to "High-Precision Contract Advisor RAG"; and
  rewrites the Bahasa Indonesia edition in natural business language while keeping the EN claims
  and headings in lock-step.
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
- **FOX metrics carry the date of their recount.** `resume-v8.10` / `resume-onepager-v1.13`
  refreshed them on 2026-09-20 against FOX HEAD `6709928a9` (2026-09-18): data models 24, email
  notification flows 17, Safety Hub tests 313 — every count scoped to the user's authors via
  `git blame` (teammates' tests and flows excluded). Recheck on each bump and keep the recount
  author-scoped: raw totals (e.g. 368 Safety Hub tests) include teammates' work and would
  over-attribute.
- **The current resume must always have a matching current PDF.** Regenerate via `build-pdf.ts`
  whenever the .txt changes.
- **A generator change has the same status as a `.txt` change.** Any edit to `build-pdf.ts` /
  `build-pdf.py` that can alter the render (CSS, layout, stamping) regenerates all four current
  PDFs in the same commit: the gates prove wording, metadata, links, page count, ink and scale —
  not layout — so a PDF left over from an older generator passes `validate:ci` unnoticed.
- On version bump, also update ALL version-pinned links:
  (a) in-repo — 15 references in total across the home components and writeup routes:
  `rg -o 'cv/(resume|consulting)[^"} ]+' src/lib/components src/routes | wc -l`.
  Each artifact is linked in more than one spot; update every one or the live site 404s:
  - `cv/resume-vX.Y.pdf` ×4 (hero **secondary** "Full CV" + both Experience-section CTA rows
    + the **FOX delivery writeup**) and
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
  (site-Services wording; metrics must be resume-sourced or, for portfolio projects, verified
  against the project repo's README the same way the site's portfolio cards are; keep EN/ID in
  lock-step — same claims, translated wording only). Regenerate each PDF via `build-pdf.ts` on any change.
- New version → add a **Changelog** entry, swap the file in **Current**, and move the superseded
  files to `archive/`, then prune `archive/` back to the two newest per artifact (`resume-v8.2`
  stays regardless). **Current** and the **Changelog** are the only two places a version number
  appears in this README — keep it that way.
- The site (`src/lib/components/About.svelte` and `Resume.svelte`): About and the Experience
  section (`#resume`) follow the mirror resume — same facts, wording may be compressed. Known,
  deliberate exceptions (2026-09-20): the FOX block is a repo-grounded rewrite that drops the
  resume metrics (see the Open note), and the Fineksi entry is site-only until it lands on
  LinkedIn. Matched on facts, not verbatim strings.
  The hero/meta headline was re-led for the recruiter scan (2026-07-11: "Backend Software Engineer
  · 6+ yrs · AI Native Engineer") — a re-emphasis of the same facts, not a contradiction of the
  LinkedIn headline. Site-only sections (Facts, Services, Portfolio, Skills grid) may add
  repo-verifiable detail (e.g. the RAG stack) but must never *contradict* the live profile.
