# Release — game-impact

Dibuat oleh: sdlc-deploy release, args root=Bio (root repo), change=docs/sdlc/game-impact, base=c713fc5, slot model pelaksana caller glm-5.3[1m], tanggal-jam 2026-09-24T09:15:45+07:00, dilepas oleh: Fadhlillah, skrip: sdlc-deploy.js sha256 18b18e99

## PR

Judul (61 karakter): `Add Gridlock WebGL2 traffic simulation card above Breakout 3D`

Body (tanpa trailer, tanpa penanda "Generated with"):

```
Asal: docs/sdlc/game-impact/intent.md

## Apa dan mengapa

Permintaan pemilik (verbatim intent.md): "tambahkan game baru lagi diatas Breakout 3D — a
hand-written WebGL2 brick breaker. dan game yang jauh lebih bagus dan bermakna diatas nya
riset dulu daftar game yg memberikan impact besar nya itu". Riset daftar game berdampak
besar diserahkan lebih dulu dan direview user (docs/sdlc/game-impact/riset-game-impact.md,
shortlist #1); arah dikunci keputusan penerimaan intent: simulasi deterministik + agen AI
hand-written, tetap WebGL2 tanpa engine, nol runtime dependency. Hasilnya: game ketiga
"Gridlock" — simulasi aliran/lalu lintas deterministik (peta grid prosedural ber-seed,
pathfinding A* + steering fixed-point, fixed timestep, replay input + deteksi desync via
hash state) di repo GitHub terpisah `gridlock-webgl` (pola dua pendahulu), plus kartu
portfolio di situs Bio disisipkan tepat di atas kartu Breakout 3D (blok ke-5 dari 7, tetap
di bawah empat kartu flagship FOX/Fineksi/RAG/Rate Limiter).

## Acceptance criteria spec.md + bukti

| # | Kriteria (ringkas) | Bukti | Status |
|---|---|---|---|
| 1 | Repo game publik `fadhlillah2/gridlock-webgl` + demo live HTTP 200 + frame pertama | Repo lokal selesai (HEAD `f2e60ce`, `git status` clean) tapi TANPA remote; `curl -sI` kedua URL → 404 (diperiksa ulang 2026-09-24 pra-rilis ini) | MENUNGGU GATE MANUSIA #1 (push + Pages) — wajib sebelum merge (lihat "Pra-merge wajib") |
| 2 | `package.json` tanpa dependencies; nol request pihak ketiga saat load | grep `'"dependencies"'` di package.json repo game = 0 (diperiksa run rilis); scan URL pihak ketiga dijaga `test/unit.markup.test.mjs` (hijau per test.md) | Hijau (lokal) |
| 3 | Unit test determinisme: seed-ganda identik, anti-hash-konstan, replay, desync terdeteksi | `npm test` 32/32 hijau, `test/unit.sim.test.mjs` (a)–(d) (per test.md) | Hijau (lokal) |
| 4 | Hash checkpoint Node === browser headless pada seed sama | `npm run smoke`: hash browser === node (`75d6a000`) (per test.md) | Hijau (lokal) |
| 5 | Fixed timestep + fixed-point di jalur state; tanpa `Math.random`/`Date.now`/`performance.now` | Test (f) source-scan + grep manual kosong atas 8 modul inti (per test.md) | Hijau (lokal) |
| 6 | Agen AI hand-written: minimal dua dari {flow-field, A*, steering}, tanpa library AI | A* (`src/path.js`) + steering (`src/steer.js`); `unit.path`/`unit.steer` hijau (per test.md) | Hijau (lokal) |
| 7 | Peta prosedural: seed sama → peta sama; generate runtime | `unit.map`: hash peta identik per seed (per test.md) | Hijau (lokal) |
| 8 | Interaksi live: tutup/buka jalan + laju spawn terlihat ≤ ~10 dtk | Probe V3 Playwright browser nyata: klik → `closed` 0→1 dlm 1 dtk, `avgTripTicks` 250→302 (~7 dtk), buka → pulih, slider spawn mengubah metrik (per test.md) | Hijau (probe manual) |
| 9 | CI repo game hijau (unit DOM-free + smoke headless) | `.github/workflows/ci.yml` repo game (`npm test` + `node tools/smoke.mjs`, commit `f2e60ce`); run pertama baru ada setelah push | MENUNGGU GATE MANUSIA #1 |
| 10 | Kartu Bio tepat sebelum kartu Breakout 3D, pola kartu lengkap + screenshot 1200x675 live build | Assertion `scripts/app-smoke.ts` (posisi = indeks Breakout − 1, dua CTA, img 1200x675) hijau di `validate`/`validate:ci`; probe posisi [FOX, Fineksi, RAG, Rate Limiter, Gridlock, Breakout 3D, Tower Stack]; aset `static/assets/img/gridlock.png` (32734 bytes, byte-identical dengan capture repo game) | Hijau (per test.md + diff) |
| 11 | Anti-fabrikasi: semua klaim kartu tergrounding repo game/demo | Checklist grounding B1 + grep jangkar: `DesyncError` = 4, `findRoute` = 1, dependencies = 0 (per test.md) | Hijau (per test.md) |
| 12 | Judul kartu bukan "Fineksi…"; kedua gerbang chat hijau | grep judul Fineksi = 1 (pass review); `chat-proxy-selftest` "all checks passed" + `chat-worker-build --check` "worker content: in sync…" exit 0 (per test.md) | Hijau (lokal) |
| 13 | `bun run validate` + `validate:ci` hijau lokal; `validate:ci` hijau di CI push `master` | Lokal exit 0 (58 app checks) per test.md; bagian CI = step "Validate" `deploy.yml` hanya pada push `master` | Lokal hijau; CI MENUNGGU post-merge |
| 14 | Tak tersentuh: kartu Breakout/Tower Stack, cv/, footer, scripts/og/, memory/, .claude/, kedua repo game sibling | `git diff c713fc5..HEAD --stat` = hanya 8 berkas (5 artefak docs/sdlc + app-smoke.ts + Portfolio.svelte + gridlock.png; diperiksa run rilis); audit tak-tersentuh + status kedua repo sibling clean (per test.md) | Hijau |
| 15 | Gerbang worker dua tahap: (a) validate:ci lokal pra-merge; (b) workflow "Deploy chat worker" hijau post-merge | (a) hijau per test.md (`check:regressions` memuat kedua gerbang chat); (b) terpicu otomatis karena Portfolio.svelte di `paths:` `deploy-worker.yml` | (a) Hijau; (b) MENUNGGU post-merge |

Catatan bukti: baris bersumber "per test.md"/"pass review" = rekaman stage test/review
(data, tidak dijalankan ulang di run rilis ini); "diperiksa run rilis" = diverifikasi
ulang langsung saat release.md ditulis.

### Pra-merge wajib (penegak temuan major #1 review — urutan gate manusia plan Risiko 11)

1. Gate manusia #1: user membuat repo publik `fadhlillah2/gridlock-webgl`, push `main`,
   aktifkan Pages (source = branch `main` path `/`).
2. Lead menjalankan: `curl -fsSI https://fadhlillah2.github.io/gridlock-webgl/` → `HTTP/2 200`
   dan `curl -fsSI https://github.com/fadhlillah2/gridlock-webgl` → `200`.
   PR Bio TIDAK dibuka/di-merge sebelum keduanya 200 (tanpa ini, kartu live memuat dua
   link 404 — tidak ada gerbang otomatis yang menangkapnya).
3. Pasca-merge: pastikan run "Deploy chat worker" hijau (kriteria 15b) dan CI repo game
   hijau pada push pertama (kriteria 9).

## Commit (c713fc5..HEAD, branch game-impact)

    7e23310 Record the re-review after the app-smoke hardening
    66fc6fb Record the review response and commit the SDLC artifact policy change
    65c4066 Guard the Gridlock card assertions against title/card index drift
    a7e3045 Record the green test-stage report for the game-impact SDLC chain
    8789864 Re-accept the plan after the sanctioned red-proof write-backs
    7af34ea Add the Gridlock portfolio card with screenshot asset
    70be068 Assert the Gridlock portfolio card in app-smoke
    9e4b4d6 Record the G6 index.html deviation in the game-impact plan
    be69a00 Record the G6 red-commit hash in the game-impact plan
    b62568b Record the G5 red-commit hash in the game-impact plan
    200cfd2 Record the G4 red-commit hash in the game-impact plan
    467a2fc Record the G3 red-commit hash in the game-impact plan
    b0daaa3 Record the G2 red-commit hash in the game-impact plan
    e320a19 Record the G1 red-commit hash in the game-impact plan
    fa7b385 Record the accepted plan for the game-impact SDLC chain
    5ac6f2a Record the accepted spec for the game-impact SDLC chain
    7e43380 Record the accepted intent for the game-impact SDLC chain

Diff: 8 berkas, +679 baris (5 artefak docs/sdlc, `scripts/app-smoke.ts` +18,
`src/lib/components/Portfolio.svelte` +20, `static/assets/img/gridlock.png` baru 32734
bytes). Di luar tree Bio, repo game `gridlock-webgl` (sibling) memuat 13 commit sendiri
(HEAD `f2e60ce`, clean, tanpa remote — belum di-push).

## Bukti merah (plan.md) + ringkasan test.md

Bukti merah per tugas (baris "Bukti merah:" plan.md; hash G1–G6 adalah commit di REPO GAME
`gridlock-webgl`, bukan Bio — per test.md temuan #2; pasangan hijau diverifikasi di
`git log` repo game saat run rilis):

- G1 `9a2cf70` test/unit.rng.test.mjs (hijau: `4075d78`)
- G2 `49dd000` test/unit.map.test.mjs (hijau: `b8c6798`)
- G3 `5fe5c8b` test/unit.path.test.mjs + test/unit.steer.test.mjs (hijau: `4c479f0`)
- G4 `7b07c6a` test/unit.sim.test.mjs (hijau: `090dd84`)
- G5 `a9bfdc5` test/unit.markup.test.mjs (hijau: `396c0cc`)
- G6 `7c561d8` tools/smoke.mjs (hijau: `f2bec09`)
- B1 (Bio) `70be068` scripts/app-smoke.ts (hijau: `7af34ea` — assertion merah dulu, kartu
  menyusul)

Ringkasan test.md (green_confirmed = true, semua exit 0): Bio — `bun install`,
`bun run validate`, `bun run validate:ci` (58 app checks OK), `chat-proxy-selftest`
("all checks passed"), `chat-worker-build --check` ("worker content: in sync with cv/ and
the agent definition"), `bun run check` (0 error, 3 warning pre-existing di
ChatBot.svelte). Game — `npm test` 32/32, `npm run smoke` (hash browser === node
`75d6a000`, 299 agen aktif, throughput 452/min), `npm run screenshot` (dua capture
byte-identical, PNG 1200x675 32734 bytes). Temuan verifikator: 2 minor (kriteria
pasca-gate-manusia belum terverifikasi; hash merah G1–G6 bukan commit Bio — integritas
setara dijalankan di repo game dan bersih) + "tidak ada temuan material".

## Ringkasan review.md

Versi terakhir (commit `7e23310`, re-review atas `c713fc5..66fc6fb`): 0 blocker /
1 major / 5 minor terkonfirmasi, 0 terbantah, blocker/major belum dibantah = 0.

- **#1 major (link kartu 404 + tanpa gerbang deterministik)** — kedua href Gridlock 404
  selama repo game belum di-push; app-smoke memblokir semua request non-origin sehingga
  validate hijau apa pun status URL. Disposisi: DITINDAK LEAD — langkah `curl -fsSI`
  kedua URL → 200 dijadikan WAJIB di release checklist + body PR ini (Respons lead
  review.md: "BERGUNA, ditindak"); perbaikan akar = gate manusia #1 (user push repo game
  + Pages) SEBELUM merge. Status saat run rilis: MASIH TERBUKA — repo tanpa remote, curl
  404/404 (diperiksa ulang). Tanpa commit perbaikan (link hidup bukan perubahan kode Bio).
- **#2 minor (riset-game-impact.md memuat path mesin ber-username; hanya aturan tertulis,
  tanpa gerbang)** — DIBIARKAN TERBUKA (derau/ditunda): berkas tetap untracked (di luar
  enumerasi artefak kebijakan), paparan hanya terjadi bila kelak di-force-add; usulan
  penegak deterministik (`git ls-files`) belum ada commit-nya.
- **#3 minor (kriteria 1 / 9-live / 13-CI / 15b menunggu gate manusia)** — BY DESIGN
  ( Respons lead: "BY DESIGN"); dibawa di blok "Pra-merge wajib" body PR ini.
- **#4 minor (celah acuan visual - game)** — DERAU tercatat (lead): gap dideklarasikan
  plan ("Celah bernama: acuan visual"); bukti visual = probe V3 sekali jalan.
- **#5 minor (celah acuan visual - kartu Bio)** — DERAU tercatat (lead): bukti =
  assertion struktural app-smoke + probe tiga look sekali jalan.
- **#6 minor (kebijakan "seluruh artefak rantai ter-commit" tanpa penegak deterministik;
  riset-game-impact.md untracked)** — DIBIARKAN TERBUKA: kebijakan user 2026-09-24 kini
  tercatat di CLAUDE.md (diperiksa run rilis; CLAUDE.md sendiri lokal/untracked di repo
  publik) namun `.gitignore` masih meng-ignore seluruh `docs/sdlc` sehingga artefak yang
  terlupa di-commit tak terlihat di git status; usulan penegak belum ada commit-nya.

Versi ter-commit sebelumnya (`66fc6fb`; 3 major/4 minor/1 nit) — majors lama yang tidak
muncul lagi di versi terakhir:

- **major #2 (intent/spec ter-commit vs kebijakan 2026-09-22) + major #3 (test.md
  ter-commit di luar daftar diff plan) + minor #4 (CLAUDE.md basi)** — SELESAI lewat
  keputusan user 2026-09-24 (eskalasi lead → user): "seluruh artefak rantai SDLC ikut
  ter-commit", CLAUDE.md lokal diperbarui (kebijakan 2026-09-24 menggantikan 2026-09-22);
  dicatat di "Respons lead" review.md@66fc6fb. Tidak ada commit di antara kedua versi
  review.md yang menyentuh berkas temuan (commit `7e23310` hanya menyentuh review.md) —
  penyelesainya keputusan manusia, bukan perubahan berkas; residunya di-framing ulang
  menjadi minor #6 versi terakhir.
- **major #1 versi lama = major #1 versi terakhir** (link 404) — masih terbuka, lihat atas.
- **nit #8 (coupling indeks app-smoke)** — DIPERBAIKI lead, commit `65c4066`
  (assertion `titles.length === cards.length`; build + check:app hijau sesudahnya);
  tidak muncul lagi di review ulang.

Di luar scope (disebut apa adanya, tanpa disposisi di rantai ini): pembaruan CLAUDE.md
untuk invarian footer "Updated" yang basi (plan open_questions #4), jalur evolusi fase 2
(replay UI pemain, flow-field, multiplayer lockstep), menaikkan screenshot gate ke CI repo
game (keputusan lead terpisah setelah terbukti stabil lintas mesin).
```

## Changelog

### Added

- Kartu portfolio "Gridlock — a hand-written WebGL2 traffic simulation" (game ketiga:
  simulasi lalu lintas deterministik WebGL2 — peta prosedural ber-seed, agen A* +
  steering fixed-point, replay + deteksi desync, nol runtime dependency — di repo terpisah
  `gridlock-webgl`) disisipkan tepat di atas kartu Breakout 3D, dengan screenshot live
  build 1200x675 dan assertion app-smoke baru yang menjaga posisi, link, dan aset kartu.

## Rollback

Jalur yang sudah ada di project: **revert PR ke `master`**. Mekanisme rilis project
memang push `master` → GitHub Actions → GitHub Pages (README bagian "Deployment";
`.github/workflows/deploy.yml`), sehingga membatalkan rilis = langkah yang sama dengan
rilis: `git revert <commit merge PR ini>` pada branch baru dari `master` → push branch →
buka PR revert → merge (gate manusia) → `deploy.yml`
otomatis membangun ulang dan Pages kembali ke kondisi pra-rilis.

Koreksi 2026-09-24 (kalibrasi): rumusan lama "sesi agent diblokir hook release-gate" pada
merge revert DIGUGURKAN dan ditarik. Skrip `.claude/hooks/release-gate.sh` memang ADA dan
dirancang memblokir push/PR/tag/deploy dari sesi agent (rute otorisasi
`SDLC_RELEASE_APPROVAL`), tetapi TIDAK aktif apa adanya: `.claude/settings.json` dan
`.claude/settings.local.json` tidak memuat kunci `hooks`, settings user hanya memuat
SessionStart hook tak terkait, satu-satunya wiring = template
`.claude/hooks/settings.snippet.json`, dan `.claude/sdlc-hook.log` hanya berisi satu baris
"x" tanpa jejak keputusan. Jadi gate manusia pada merge revert = prosedur (PR revert
di-open/merge oleh user), bukan penegak teknis; konsisten dengan "Celah bernama:
release-gate belum terpasang" di Checklist deploy di bawah. Revert menyentuh
`src/lib/components/Portfolio.svelte` sehingga workflow "Deploy chat worker" ikut terpicu
(redeploy worker dengan grounding pra-rilis — konsisten dengan situs yang di-rollback);
kill switch darurat worker bila diperlukan = kosongkan `PROD_ENDPOINT` di
`src/lib/chat.js` lalu rebuild (CLAUDE.md).

Cara menguji di "staging": project tidak punya tier staging — padanan terdekat yang ada =
verifikasi branch revert sebelum merge: `bun run validate` + `bun run validate:ci`
(assertion kartu Gridlock ikut ter-revert, kartu Breakout/Tower Stack tetap lolos) +
`bun run preview` untuk cek visual `#portfolio`.

Status latihan: **belum pernah diuji** — tidak ada runbook/drill rollback di repo (grep
"rollback|revert" atas README, .github/, scripts/ menemukan nol prosedur; tidak ada
catatan latihan rollback situs di sumber project yang dibuka). Celah bernama: rollback
belum pernah dilatih.

## Checklist deploy per tier

- [x] **development (agent boleh deploy)** — lokal: `bun run dev` / `bun run build` /
  `bun run validate` / `bun run validate:ci` dijalankan penuh rantai di branch kerja
  (test.md: semua exit 0). Tidak ada deploy eksternal di tier ini.
- [ ] **staging** — TIDAK ADA tier staging di project (hanya lokal + GitHub Pages
  produksi); gerbang pra-merge = `validate:ci` lokal di branch kerja (spec behavior 4/6;
  tidak ada workflow Bio dengan trigger `pull_request`). Celah bernama: tanpa staging.
- [x] **production (rilis disiapkan agent, otorisasi bernama release manager)** — PR
  disiapkan agent (body di atas); push/merge = gate manusia dengan urutan wajib repo game
  live dulu (plan open_questions #1–#2). Hook gate rilis: skrip
  `.claude/hooks/release-gate.sh` ADA (memblokir push/PR/tag/deploy dari sesi agent;
  rute otorisasi = release manager meng-export `SDLC_RELEASE_APPROVAL=<nama>` di sesi
  yang melahirkan hook), TETAPI belum ter-wire: `.claude/settings.json` dan
  `.claude/settings.local.json` tidak memuat kunci `hooks`, settings user hanya memuat
  SessionStart hook tak terkait — wiring hanya
  tersedia sebagai template `.claude/hooks/settings.snippet.json`; log
  `.claude/sdlc-hook.log` tidak memuat jejak keputusan. Catatan: `.claude/` local-only
  (gitignored), jadi hook ini bukan bagian artefak rilis repo. Celah bernama:
  release-gate belum terpasang.

## Triage CI

tidak ada log yang diberikan
