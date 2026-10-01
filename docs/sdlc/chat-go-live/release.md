# Release — Chat "ask the CV" go-live

Dibuat oleh: sdlc-deploy release, args root/change/base = . / chat-go-live / master, slot model pelaksana caller glm-5.3[1m], 2026-09-23T00:36:46+07:00, dilepas oleh: Fadhlillah, skrip: sdlc-deploy.js sha256 fc86b244

## PR

### Judul (≤72 karakter)

```
Chat go-live: grounding situs, kuota per pemanggil, deploy worker CI
```

### Body

Asal: docs/sdlc/chat-go-live/intent.md

#### Apa dan mengapa

Widget chat "ask the CV" (`ChatBot.svelte`, `src/lib/chat.js`) dan backend worker-nya (`worker/chat.ts`, guard bersama `scripts/chat-core.ts`) sudah selesai dan dua kali diaudit, tapi belum pernah terbit: `PROD_ENDPOINT` kosong sehingga di luar localhost widget tidak dirender dan situs publik tidak punya chat sama sekali. Dua cacat yang ikut kalau diterbitkan apa adanya (intent.md "Masalah"): **R-01** — grounding bot hanya `cv/resume-v8.10.txt`, sehingga bot menyangkal fakta yang halaman tempat ia menempel sudah nyatakan (Fineksi di About/Hero/Resume/Portfolio/JSON-LD `worksFor`; "Freelance Availability: 40–60 hours/week" di Services; Kubernetes di Skills); dan **bundle worker meng-inline CV** — tiap bump CV meninggalkan worker terdeploy yang basi.

PR ini menyiapkan go-live tanpa langkah manual: grounding diperluas ke fakta situs yang **di-generate dari komponen Svelte sumber** (satu ekstraktor `siteFacts()` untuk proxy dev dan worker, dijaga gerbang `chat:worker:build --check` yang sudah ada di `check:regressions`); provider produksi = GLM `glm-5.3-flash` lewat gateway **OpenCode Go** `https://opencode.ai/zen/go/v1` (amandemen user 2026-09-23, plan.md D10; `thinking: {type:"disabled"}` tetap bigmodel-only); **kuota harian per pemanggil** 20/hari di depan kuota global 200/hari (temuan KV-03); **disclosure AI + pemrosesan pihak ketiga** di panel (R8, dikonfirmasi user 2026-09-21); workflow **`.github/workflows/deploy-worker.yml`** yang men-deploy worker hanya setelah dua gerbang hijau dan kini dipin ke commit SHA (D11, keputusan user 2026-09-23 atas temuan review keamanan); dokumen hidup (README Deployment, CLAUDE.md, cv/README.md Rules) mengikuti kode. `PROD_ENDPOINT` sengaja masih `''` (T9 menunggu worker live; fail-safe R10) dan push/merge/deploy tetap gate manusia (R15).

#### Acceptance criteria spec.md + bukti

| AC | Bukti |
|---|---|
| AC-01 [L] prerender tanpa markup chat | `grep -c chat-fab build/index.html` = 0 pada artefak `build/` di tree (build lama; `PROD_ENDPOINT` masih `''` di `src/lib/chat.js:13`); `bun run build` penuh ada di `validate:ci` — lognya tidak disertakan run ini |
| AC-02 [L] fail-safe endpoint mati | plan.md §6 "Bukti lapis-2 tercatat (lead, 2026-09-22/23)": dev `?chat=<endpoint mati>` ⇒ 0 elemen `.chat-fab`/`.chat-panel`, section lain utuh, console bersih (entri `net::ERR_*` dari probe dikecualikan); kontrol anti-lolos-palsu stub hidup `:4321` ⇒ fab render |
| AC-03 [L] happy path + tiga pertanyaan R-01 | plan.md §6: worker lokal `/health` 200 `{"ok":true,"model":"glm-5.3-flash"}`; Fineksi / availability / Kubernetes dijawab 200 non-kosong dan diatribusikan ke **situs** (bigmodel 2,2–3,0 dtk; gateway OpenCode Go 5,0 dtk) |
| AC-04 [L] gerbang origin | selftest (dijalankan ulang run ini, hijau) hanya mempin helper: `originAllowed(null / "https://evil.example" / "")` ditolak (`scripts/chat-proxy-selftest.ts:107-110`), `resolveOrigins` produksi tanpa origin dev (:130-134); perilaku level-endpoint — 403 di `/health` dan `/chat`, header `access-control-*` hanya untuk origin situs, preflight OPTIONS ⇒ 204 hanya dengan header origin situs — ada di kode `worker/chat.ts:86-99` dan TIDAK dipin test mana pun |
| AC-05 [L] kuota per pemanggil | selftest: pemanggil A (`9.9.9.9`) lewat jatah ⇒ 429 + pesan kontak, pemanggil B tetap 200; body rusak ⇒ 400 **tanpa** memotong kuota (`put` kosong) |
| AC-06 [L] binding edge tetap | selftest memindai `worker/wrangler.toml` (assert T4); blok `[[ratelimits]] RATE_LIMITER` + `CHAT_ORIGINS` situs dibaca ulang run ini |
| AC-07 [L] giliran assistant bertanda | selftest: balasan >2000 karakter dipotong lalu ditandatangani, kembali sebagai giliran `assistant`; `sig` palsu didemosi + dicatat |
| AC-08 [L] 413/400 tanpa panggilan provider | selftest (dijalankan ulang run ini, hijau) mempin: JSON rusak ⇒ 400 tanpa memotong kuota (`scripts/chat-proxy-selftest.ts:387-389`), URL provider cacat ⇒ 502 (:347-348), provider 500 ⇒ 502 (:355-356); klausa 413 (`content-length` > 128 KB ditolak sebelum parse) TIDAK dipin selftest — perilakunya hanya ada di kode `worker/chat.ts:141-142` (`MAX_BODY_BYTES` :60), belum ada test yang mengujinya |
| AC-09 [L] gerbang drift konten | mutasi tercatat plan.md §6: `<li>Kubernetes</li>` → `KubernetesX` ⇒ `check:regressions` EXIT 1, pulih EXIT 0; `chat-worker-build --check` ada di `check:regressions` (package.json diverifikasi run ini) |
| AC-10 [L] grounding dev = worker | selftest: prompt kedua backend byte-identik; `WORKER.SITE_FACTS === siteFacts(ROOT)` byte for byte |
| AC-11 [L] validate:ci hijau | komposisi `check:regressions` diverifikasi run ini (memuat `chat-proxy-selftest.ts` + `chat:worker:build --check`); selftest chat dijalankan ulang run ini ⇒ `chat proxy selftest: all checks passed`; log `validate:ci` penuh tidak disertakan run ini |
| AC-12 [L] disclosure panel | selftest: kalimat D3 (`generated by an AI model`, `sent to a third-party model provider`) ada, kalimat jaminan lama hilang, nol `{@html}` di jalur chat |
| AC-13 [L] anti-fabrikasi | blok SITE FACTS = kutipan verbatim 7 komponen dengan anchor wajib (plan §2) + assert kesamaan penuh (T1); `cv/*.txt`/`cv/*.pdf` tak tersentuh (diff `master..HEAD`: 15 berkas, +981/−61, tidak ada `cv/*.txt`); review pass kepatuhan 0 blocker/major |
| AC-14 [L] dokumen hidup | grep run ini: README bagian Deployment memuat workflow, 4 GitHub secret, langkah KV sekali-jalan, provider OpenCode Go, kill switch, batas belanja riil (tanpa klaim spend cap); `deploy-worker` ada di README.md dan cv/README.md; CLAUDE.md 8 kemunculan "chat" + baris `docs/sdlc` direktori riil |
| AC-15 [P] job Actions hijau + `/health` produksi | menunggu langkah user (secret/KV/push); dua gerbang pra-deploy terverifikasi ada di berkas workflow yang dibaca run ini (step "Content gate" dan "Guard selftest" keduanya sebelum step Deploy) |
| AC-16 [P] widget live + kill switch | menunggu T9 (`PROD_ENDPOINT`) pasca-deploy user |
| AC-17 [P] bump CV ⇒ redeploy otomatis | menunggu bump CV pertama setelah merge |
| AC-18 [L] thinking bigmodel-only + anggaran token | selftest menangkap payload stub: `thinking` hanya ke hostname `bigmodel.cn`, model + `max_tokens` 700 terkirim; efek terukur tercatat plan.md D10/§6 (A/B 35 vs 39 completion token via gateway) |
| AC-19 [L] workflow memuat selftest penjaga | berkas `.github/workflows/deploy-worker.yml` dibaca run ini: step "Guard selftest — origin, HMAC, quota, limits" sebelum step Deploy |

Pemetaan temuan → AC ada di spec.md §3 (R-01 → AC-03/09/10/13; R-05+CG-05 → AC-12; KV-03 → AC-05; worker-basi → AC-09/17; docs → AC-14; gerbang deploy → AC-15/19).

#### Commit `master..HEAD` (28; merge-base `f032b58`)

```
6be19cd Track the chat go-live build plan in docs/sdlc
3d7f752 Test the shared site facts extractor contract
d9dae1c Add the shared site facts extractor to the chat proxy
0322424 Test the generated worker site facts contract
b4104f8 Inline the site facts into the generated worker content
098480d Add red tests for the two-block chat prompt
c39726c Build the chat prompt from CV and site facts blocks
fd97fd2 Add red tests for the GLM provider and thinking gating
9574112 Point production at GLM and disable bigmodel thinking
9826a0f Add red tests for the per-caller daily quota
b79c936 Charge a per-caller daily quota before the global one
b8be1c8 Add red tests for the chat panel disclosure
a8e4272 Disclose AI generation and third-party processing in the panel
9033ac2 Add red tests for the worker deploy workflow
be617a1 Add the GitHub Actions workflow that deploys the chat worker
4721962 Add red tests for the living docs
0208289 Update the living docs for the chat worker deploy
a0c383d Add red tests for the OpenCode Go gateway switch
6ea9fba Route the chat worker through the OpenCode Go gateway
7dcd600 Add red test for a malformed provider URL
18ee501 Answer a malformed provider URL with the 502 JSON contract
4b5cc59 Add red test pinning deploy workflow actions by sha
8fd3b93 Pin the deploy workflow actions to commit shas
28d58cb Add red test pinning pages workflow actions by sha
e0bb48e Pin the Pages deploy workflow actions to commit shas
6963a2d Record the Pages workflow pin in the build plan
7a3d276 Add red test for the IP retention disclosure
05ce8cf Disclose the 48-hour IP retention in the chat panel
```

#### Ringkasan bukti merah

Baris "Bukti merah:" plan.md (siklus merah-hijau per tugas T1–T8, semua test di `scripts/chat-proxy-selftest.ts`):

- T1 `3d7f752a` (ekstraktor fakta situs) · T2 `0322424f` (bundle SITE_FACTS) · T3 `098480d` (prompt dua blok) · T4 `fd97fd23` (provider GLM + thinking) · T5 `9826a0fd` (kuota per pemanggil) · T6 `b8be1c8e` (disclosure panel) · T7 `9033ac26` (workflow deploy) · T8 `47219626` (dokumen hidup).

Tiga pasang merah→hijau setelah review (di `git log`, direview D10/D11): `a0c383d` → `6ea9fba` (gateway OpenCode Go), `7dcd600` → `18ee501` (URL cacat dijawab 502 JSON), `4b5cc59` → `8fd3b93` (pin SHA action). `test.md` tidak ada di `docs/sdlc/chat-go-live/` — ringkasan verifikator tidak tersedia; bukti verifikasi yang setara = review.md (3 pass: bug/keamanan/kepatuhan) + bukti lapis-2 tercatat plan.md §6 + selftest dijalankan ulang hijau run ini (`bun scripts/chat-proxy-selftest.ts` → `chat proxy selftest: all checks passed`).

#### Ringkasan review.md (sdlc-deploy review 2026-09-23, diff `master` → `6ea9fba`)

Hitungan: blocker/major/minor/nit = **0/0/7/2** terkonfirmasi (mentah 10, digabung 1, terbantah 0). Disposisi tiap temuan:

| Temuan | Isi | Disposisi |
|---|---|---|
| T1 minor (bug) | `new URL(endpoint)` di luar try ⇒ TypeError taktertangkap (500 non-JSON) setelah kuota dipotong | **Diselesaikan run rantai** — `18ee501` (test merah `7dcd600`); kode kini mem-parse di dalam try dengan komentar "Parsed Inside the try…", diverifikasi baca kode + selftest hijau run ini |
| T2 minor (keamanan) | action workflow dipin tag mutable sambil memegang 4 secret | **Diselesaikan run rantai atas keputusan user 2026-09-23** (D11) — `8fd3b93` (test merah `4b5cc59`); ketiga action kini SHA-40 (`checkout@d23441a4…`, `setup-bun@0c5077e5…`, `wrangler-action@ebbaa158…`), dibaca run ini |
| T3 minor (keamanan) | alamat IP pengunjung disimpan plaintext sebagai kunci KV `caller:<utcDay>:<ip>` TTL 48 jam, tak disebut disclosure panel | **Diselesaikan atas keputusan user 2026-09-23** (D12) — panel kini memuat "Your IP address is stored for up to 48 hours after your last question to enforce the daily question limit."; selftest mengikat "48 hours" ke `expirationTtl: 172_800` (merah `7a3d276` → hijau) |
| T4 minor (kepatuhan) | komentar `countDay` masih menyebut "GLM coding plan" sebagai ceiling belanja | **Diselesaikan run rantai** — `6ea9fba`; komentar kini "the OpenCode Go plan's quota over these daily quotas", dibaca run ini |
| T5 minor (kepatuhan) | `namespace_id = "1001"` pada `[[ratelimits]]` = nilai contoh dokumentasi; kevalidan terhadap wrangler belum terverifikasi | **Dibiarkan terbuka (ditunda)** — baru terbukti saat deploy pertama (tindakan user; butuh akun Cloudflare); bila ditolak wrangler, job gagal di step Deploy setelah preflight hijau |
| T6 minor (kepatuhan) | spec.md R2 tanpa penanda amandemen gateway | **Diselesaikan lead** — spec.md R2 kini memuat paragraf "Amandemen user 2026-09-23 (plan.md D10)" (dibaca run ini) |
| T7 minor (kepatuhan) | bukti lapis-2 AC-02/AC-03 tak tercatat di artefak mana pun | **Diselesaikan lead** — plan.md §6 "Bukti lapis-2 tercatat (lead, 2026-09-22/23)" kini memuat AC-02, AC-03, mutasi AC-09, scan kunci |
| T8 nit (bug) | komentar selftest masih "Production points at GLM's coding-plan endpoint" | **Diselesaikan run rantai** — komentar kini "Production points at the OpenCode Go gateway", dibaca run ini |
| T9 nit (kepatuhan) | header `x-opencode-session` dikirim tak bersyarat ke semua provider | **Dibiarkan terbuka (derau)** — nol dampak (endpoint OpenAI-compatible mengabaikan header asing); D10 tidak mewajibkan gerbang hostname |

Pin SHA workflow Pages `deploy.yml` yang lama ikut masuk change ini atas perintah user 2026-09-23 (`28d58cb` merah → `e0bb48e` hijau; D11 di plan.md). Disebut apa adanya: empat berkas `docs/sdlc/chat-go-live/*` (intent/spec/probes/release) gitignored, hanya `plan.md` ter-commit.

## Changelog

### Added
- Widget chat "ask the CV" disiapkan untuk go-live publik: grounding bot diperluas ke fakta yang sudah terbit di situs (Fineksi, availability 40–60 jam/minggu, tag Kubernetes) lewat ekstraktor bersama proxy/worker yang dijaga gerbang drift; kuota harian per pemanggil (20/hari) dimuat sebelum kuota global (200/hari); panel memuat disclosure jawaban AI + pengiriman teks ke penyedia model pihak ketiga; workflow `deploy-worker.yml` men-deploy worker lewat GitHub Actions hanya setelah gerbang konten dan guard selftest hijau, dengan action dipin commit SHA; provider produksi GLM `glm-5.3-flash` via gateway OpenCode Go. Widget menyala setelah langkah deploy pengguna (T9 mengisi `PROD_ENDPOINT`).

## Rollback

Langkah yang sudah ADA di project — kill switch terdokumentasi di `README.md` bagian Deployment (baris 95–96) dan spec.md R11:

> Kosongkan `PROD_ENDPOINT` di `src/lib/chat.js` lalu rebuild + deploy situs, **atau** hapus worker `bio-chat` dari akun Cloudflare — probe `/health` gagal ⇒ widget hilang sendiri tanpa console error (fail-safe R10).

Cara menguji di staging: project tidak punya tier staging. Padanan lokal yang sudah tercatat (plan.md §6, bukti AC-02): dev server dengan `?chat=<endpoint mati>` ⇒ 0 elemen `.chat-fab`/`.chat-panel` dan section lain utuh; kontrol positif stub hidup di `:4321` ⇒ fab dirender. Untuk membatalkan kode sebelum merge: tutup PR tanpa merge / hapus branch `chat-go-live` (`git branch -D chat-go-live`) — situs produksi tidak tersentuh karena `PROD_ENDPOINT` masih kosong.

Status latihan: jalur fail-safe sudah dibuktikan di dev (AC-02, 2026-09-22/23, tercatat plan.md §6); kill switch di produksi **belum pernah diuji** — direncanakan sebagai bagian AC-16 [P] pasca-deploy (plan.md §7 butir 6).

- Celah bernama: **kill-switch-belum-diuji-produksi** — usulan minimal: jalankan uji kill switch tepat setelah AC-16 (hapus worker atau kosongkan `PROD_ENDPOINT`, pastikan widget hilang tanpa console error), catat hasilnya di artefak rantai.
- Celah bernama: **tanpa-tier-staging** — project hanya punya dev (runner lokal) dan produksi (Pages + worker); usulan minimal: pakai worker `bio-chat-staging` + `wrangler.toml` environment terpisah bila preview pra-produksi kelak dibutuhkan.

## Checklist deploy per tier

- [x] **development** — agent boleh menjalankan backend lokal: `bun run chat` (proxy dev) dan `bun run chat:worker` (runner worker lokal, KV in-memory) ada di `package.json`; gerbang `check:regressions`/selftest jalan tanpa kunci provider.
- [ ] **staging** — tidak ada: project tidak punya tier staging (lihat celah di atas).
- [x] **production (rilis disiapkan agent, otorisasi release manager)** — hook gate rilis ADA: `.claude/hooks/release-gate.sh` (blokir `git push`, `gh pr create|merge`, `gh release`, `git tag <nama>`, perintah deploy dari sesi agent; otorisasi = release manager bernama meng-export `SDLC_RELEASE_APPROVAL=<nama>` di sesi yang melahirkan hook — dibaca hook dari `os.environ`, prefiks env di dalam string perintah tidak dibaca). Jalur deploy = job Actions `deploy-worker.yml` (preflight secret/KV → gerbang konten → guard selftest → deploy) setelah langkah user plan.md §7 (KV namespace, 4 GitHub secrets, push/merge). Yang belum dijalankan: seluruh langkah user 1–5 dan T9 (`PROD_ENDPOINT` masih `''`).

## Triage CI

tidak ada log yang diberikan
