# Spec: Game ketiga — simulasi aliran deterministik dengan agen AI hand-written WebGL2 (kartu tepat di atas Breakout 3D)

Dibuat oleh: sdlc-design, args root=Bio (root repo), change=docs/sdlc/game-impact, slot model pelaksana caller glm-5.3[1m], 2026-09-24T00:05:49+07:00, dilepas oleh: Fadhlillah, skrip: sdlc-design.js sha256 14cfc5c0, kebijakan: CLAUDE.md:edcbc7ee REVIEW.md:tidak ada, skill:tidak ada.

## Rujukan

- Intent: `docs/sdlc/game-impact/intent.md` (definisi; tree Bio).
- Baris status penerimaan intent (disalin): "Status penerimaan: diterima Fadhlillah 2026-09-24T00:00:56+07:00 sha256:e3d0caea."
- Record: tidak ada baris "Record: <sistem> <id>" di intent.md.
- Riset: `docs/sdlc/game-impact/riset-game-impact.md` (definisi; tree Bio) — deliverable Hasil #1 intent; disebut Keputusan penerimaan #2 sebagai dasar arah game. Riset sudah direview user (Keputusan penerimaan 2026-09-23 menunjuk shortlist #1) → Hasil #1 intent terpenuhi.
- Kebijakan project: `CLAUDE.md` (tree Bio). `REVIEW.md` tidak ada di repo.

Peta rujukan baris (label definisi/pemakaian + tree tempat diukur; semua diverifikasi dibuka di run ini):

| Rujukan | Label | Tree | Keterangan |
| --- | --- | --- | --- |
| `src/lib/components/Portfolio.svelte:93` | definisi | Bio | Awal `<article>` kartu Breakout 3D = titik sisip kartu baru (tepat sebelum baris ini) |
| `src/lib/components/Portfolio.svelte:96` | definisi | Bio | Judul kartu "Breakout 3D — a hand-written WebGL2 brick breaker" |
| `src/lib/components/Portfolio.svelte:31` | definisi | Bio | Judul flagship Fineksi — anchor grounding chat worker |
| `scripts/chat-proxy.ts:109` | pemakaian | Bio | `grab('Portfolio.svelte', …, /<h3 class="flagship-title">(Fineksi[^<]*)<\/h3>/g)` wajib match tepat satu; digenerate ke `worker/content.generated.ts`, dijaga `check:regressions` |
| `.github/workflows/deploy-worker.yml:16` | pemakaian | Bio | `src/lib/components/Portfolio.svelte` ter-list di `paths:` trigger deploy worker produksi |
| `scripts/og/` (3 template: cover, writeup FOX, writeup RAG) | definisi | Bio | Kanon kartu OG situs — game tidak punya kartu OG (preseden) |
| `breakout-3d-webgl` lokal: `package.json` tanpa `dependencies`, scripts `test`/`smoke`/`screenshot`, `.github/workflows/ci.yml` | definisi | repo game (bukan Bio) | Pola gerbang kualitas pendahulu yang ditiru |

## Konsep yang dikunci

Keputusan penerimaan #2 mengunci arah "simulasi deterministik + agen AI hand-written" (shortlist #1 riset) dan mewariskan "konsep konkret game dikunci di spec" ke run ini. Konsep yang dikunci:

**Simulasi jaringan aliran/lalu lintas deterministik** (traffic/flow network sim; judul kerja "Gridlock", judul final = keputusan plan — perubahan judul bukan perubahan konsep):

- Peta = graf jalan pada grid, digenerate prosedural dari seed.
- Agen = kendaraan otonom yang lahir di tepi jaringan dengan tujuan, merute lewat pathfinding hand-written (flow-field dan/atau A*), dan bergerak dengan steering (separation/avoidance, penyesuaian kecepatan). Jumlah agen dibatasi performa (angka final di plan).
- Pemain = operator jaringan: membuka/menutup segmen jalan dan mengatur laju spawn (input pointer; keyboard untuk pause/step); sistem merespons dengan rerouting emergent dan kemacetan.
- Metrik hidup di layar (throughput, waktu tempuh rata-rata, panjang antrean) dibaca seperti metrik sistem terdistribusi (backpressure, reroute, degradasi angkutan) — mengisyaratkan tema #3 riset tanpa jadi game abstrak.
- Hook terlihat ≤ ~10 detik: agen mengalir di jaringan, pemain menutup satu jalan, gelombang reroute terlihat.

Alasan varian ini dipilih dibanding colony/RTS-lite (varian lain shortlist #1): (a) scope terkecil yang tetap mengisi ketiga gap riset (determinisme+replay, algoritma AI, PG) sehingga risiko "half-finished engine" — anti-pola eksplisit di riset §1 — paling kecil; (b) agen dan efek interaksinya paling cepat terbaca oleh recruiter yang membuka demo beberapa detik; (c) paling cocok dengan rekomendasi lead ("opsi meminim tema #3") dan menyisakan jalur evolusi ke multiplayer lockstep (riset §3) karena determinisme adalah prasyaratnya.

Non-goals (bukan scope change ini): multiplayer/server/signaling apa pun (fase 2 posible, bukan sekarang), engine/game engine, dependency baru, perubahan kartu Breakout 3D/Tower Stack, perubahan `cv/`, perubahan footer, kartu OG game, penyinggungan di README profil, perubahan apa pun di `memory/` atau `.claude/` (keduanya tetap local-only/gitignored — `.gitignore:27`, `.gitignore:9`), dan snapshot LinkedIn masuk repo (batasan intent.md:41).

## Persyaratan teknis

1. Game: WebGL2 + GLSL hand-written, vanilla JS; NOL runtime dependency — dan mengikuti jejak pendahulu bila memungkinkan NOL `dependencies` di `package.json` (Breakout membuktikan pola ini; alat CI lokal boleh). Tanpa engine, tanpa CDN pihak ketiga saat load.
2. Simulasi deterministik: fixed timestep; state yang di-hash memakai aritmetika fixed-point (integer), bukan float; RNG seeded; hash state pada checkpoint tetap; rekaman input menghasilkan replay penuh.
3. Agen AI hand-written: pathfinding (flow-field dan/atau A*) plus perilaku steering; minimal dua dari tiga teknik hadir; tanpa library AI.
4. Peta prosedural dari seed; seed sama menghasilkan peta sama.
5. Distribusi: repo GitHub publik terpisah + demo GitHub Pages, statis murni tanpa backend (matriks infra riset §3; mengonfirmasi Asumsi #3 intent).
6. Kartu di situs Bio: disisipkan tepat sebelum kartu Breakout 3D (`src/lib/components/Portfolio.svelte:93`), mengikuti pola kartu existing (flagship-badge, flagship-title, flagship-desc, flagship-result, tag-row, CTA "Play the demo" + "View source", flagship-shot `static/assets/img/` PNG 1200x675 screenshot asli live build); tanpa CSS framework, tanpa request pihak ketiga, token look yang ada; teks kartu bahasa Inggris (konsisten seluruh kartu).
7. Judul kartu TIDAK boleh diawali "Fineksi" (agar regex `scripts/chat-proxy.ts:109` tetap match tepat satu).
8. Klaim kartu tergrounding: setiap klaim (teknik, jumlah test, gerbang CI) harus bisa diverifikasi dari repo game / demo live (anti-fabrikasi: CLAUDE.md; `cv/README.md` bagian Rules sebagai kanon klaim — meski artefak cv/ sendiri tak tersentuh).
9. Input: desktop-first (pointer + keyboard). Demo tidak boleh rusak di layar sempit/mobile; kontrol sentuh penuh bukan syarat.

## Behavior yang diharapkan

1. Pengunjung Bio melihat kartu game baru pada blok ke-5 dari 7 section Portfolio — tepat di atas kartu Breakout 3D, tetap di bawah empat kartu flagship (FOX, Fineksi, RAG, Rate Limiter) — sebagai kartu interactive-experiment pertama; reveal dan ketiga look berperilaku sama dengan kartu lain.
2. "Play the demo" membuka live demo tanpa akun/unduhan; agen otonom langsung hidup dan efek interaksi pemain (tutup/buka jalan, ubah laju spawn) terlihat ≤ ~10 detik sejak load.
3. Dua run ber-seed identik menghasilkan hash state identik di setiap checkpoint; replay dari rekaman input mereproduksi run asli; penyimpangan state terdeteksi lewat desync hash (dibuktikan di test dengan injeksi).
4. Chat worker produksi tetap sehat: `siteFacts()` meregenerasi konten grounding dengan benar. Workflow "Deploy chat worker" TIDAK terpicu pada PR (trigger-nya hanya `push: branches: [master]` dengan `paths:` plus `workflow_dispatch` — tanpa blok `pull_request` di `.github/workflows/deploy-worker.yml`); pada PR itu sendiri tidak ada workflow CI Bio yang berjalan sama sekali (`deploy.yml` juga tanpa `pull_request` — `validate:ci` di CI hanya hidup pada push `master`, step "Validate" `.github/workflows/deploy.yml:39-45`), sehingga kesehatan worker selama pengembangan dijaga `bun run validate:ci` yang dijalankan lokal di branch kerja — memuat `chat-proxy-selftest` + `chat-worker-build --check` lewat `check:regressions`. Push `master` paska-merge yang menyentuh `Portfolio.svelte` otomatis menjalankan workflow itu (konsekuensi `deploy-worker.yml` paths) dan run tersebut harus hijau.
5. Halaman Bio tetap terbaca penuh tanpa JS (kartu statis); game itu sendiri butuh JS karena berada di luar halaman Bio.
6. `bun run validate` hijau (termasuk `check:regressions`: selftest chat-proxy + `chat-worker-build --check`); `bun run validate:ci` hijau dijalankan lokal di branch kerja, dan di CI pada push `master` (step "Validate" `deploy.yml`) — bukan di PR (tidak ada workflow Bio dengan trigger `pull_request`).

## Acceptance criteria

Diperiksa satu per satu; semua harus benar sebelum change diterima. (intent.md tidak memuat seksi "## Usulan eval", jadi tidak ada kriteria pemulihan kasus wajib.)

1. Repo game publik baru di `github.com/fadhlillah2/<nama-game>` berisi source; demo live di `https://fadhlillah2.github.io/<nama-game>/` merespons HTTP 200 dan frame pertama tergambar (dibuktikan smoke headless).
2. `package.json` repo game tidak punya `dependencies` (atau kosong); tidak ada request pihak ketiga saat load demo.
3. Unit test determinisme: (a) sesi ber-seed dijalankan dua kali → hash state identik di tiap checkpoint; (b) test penjaga anti-hash-konstan: input berbeda → hash berbeda; (c) replay dari rekaman input → hash identik dengan run asli; (d) desync: injeksi penyimpangan state terdeteksi oleh hash.
4. Test lintas-lingkungan: hash checkpoint yang dihitung di Node sama dengan yang dihitung browser headless pada sesi ber-seed sama (pola cross-check pendahulu).
5. State simulasi berjalan pada fixed timestep dengan fixed-point untuk jalur state yang di-hash; tidak ada `Math.random` tanpa seed di jalur state (diperiksa dari kode + test).
6. Agen AI hand-written: minimal dua dari {flow-field, A*, steering} hadir di kode, berperilaku di gameplay (agen menempuh rute dan saling menghindar), tanpa library AI.
7. Peta prosedural: test membuktikan seed sama → peta sama; peta digenerate runtime, bukan aset statis.
8. Interaksi live: menutup/membuka jalan dan mengubah laju spawn memengaruhi arus agen secara terlihat; efek rerouting teramati ≤ ~10 detik sejak aksi.
9. CI repo game hijau: unit test DOM-free + smoke headless Chrome + screenshot gate dua capture frame sama byte-identical (setara pendahulu).
10. Kartu baru ada di `src/lib/components/Portfolio.svelte` tepat sebelum kartu Breakout 3D, memuat seluruh pola kartu (badge, judul, deskripsi, result, tag-row, dua CTA, screenshot `static/assets/img/` 1200x675 dari live build asli).
11. Anti-fabrikasi: setiap klaim pada teks kartu dapat diverifikasi dari repo game atau demo live; tidak ada klaim di luar bukti (angka test, teknik, metrik).
12. Judul kartu tidak diawali "Fineksi"; `bun scripts/chat-proxy-selftest.ts` dan `bun scripts/chat-worker-build.ts --check` hijau (regex `scripts/chat-proxy.ts:109` tetap match tepat satu).
13. `bun run validate` dan `bun run validate:ci` hijau dijalankan lokal pada branch kerja repo Bio; `validate:ci` kemudian hijau di CI pada push `master` lewat step "Validate" `deploy.yml` (pada PR tidak ada workflow Bio yang berjalan — tidak ada trigger `pull_request`; menambahkannya bukan scope change ini).
14. Tak tersentuh: kartu dan link Breakout 3D serta Tower Stack byte-identical dengan sebelum change; tidak ada komit/push ke repo `breakout-3d-webgl` dan `tower-stack-webgl`; tidak ada file di `cv/` yang berubah; kedua footer tidak berubah; `scripts/og/` dan kartu OG tidak berubah; diff change/PR tidak memuat perubahan apa pun di `memory/` maupun `.claude/` dan tidak menambahkan snapshot LinkedIn ke repo (batasan intent.md:41; diperiksa dari diff).
15. Gerbang worker chat dua tahap: (a) `bun run validate:ci` hijau dijalankan lokal pada branch kerja sebelum merge — workflow "Deploy chat worker" tidak terpicu di PR (trigger tanpa `pull_request`), dan di PR tidak ada workflow CI Bio yang berjalan (`deploy.yml` pun tanpa `pull_request`), sehingga gerbang worker pra-merge = `validate:ci` lokal → `check:regressions` → `chat-proxy-selftest` + `chat-worker-build --check`; (b) workflow "Deploy chat worker" hijau pada push `master` paska-merge yang menyentuh `Portfolio.svelte` (terpicu otomatis oleh `paths:` `.github/workflows/deploy-worker.yml:16`; bukan merah karena kartu baru).

## Kekhawatiran dan kebijakan bertabrakan

Tidak ada kekhawatiran yang tidak bisa dipenuhi dan tidak ada kebijakan project yang bertabrakan dengan change ini.

Catatan kebijakan yang menyentuh change ini (bukan tabrakan, tidak butuh keputusan lead):

- CLAUDE.md masih mencatat invarian footer "Updated <bulan> <tahun>" yang menurut pemeriksaan intent.md sudah tidak ada di kode; change ini tidak menyentuh footer, jadi invarian basi itu tidak dieksekusi. Memperbarui CLAUDE.md di luar scope run ini (run ini hanya boleh menulis spec.md).
- CLAUDE.md merujuk `.claude/rules/anti-fabrikasi.md` via `.claude/README.md`; direktori `.claude/rules/` tidak ditemukan di run ini — aturan anti-fabrikasi tetap berlaku dari CLAUDE.md dan `cv/README.md` bagian Rules.
- `validate` Bio tidak melintasi repo game: gerbang kualitas game (kriteria 1–9) hidup di CI repo game sendiri, kartu Bio hanya memverifikasi grounding teksnya (kriteria 10–12) — konsisten dengan pola dua game sebelumnya.

Kelas risiko: dua kelas yang kebijakan project sebut dan change ini sentuh (kebijakan project = CLAUDE.md, satu-satunya kebijakan tertulis; REVIEW.md tidak ada):

1. Anti-fabrikasi klaim konten — CLAUDE.md "Invarian yang mudah dilanggar" memuat "Anti-fabrikasi konten CV" (guard fakta user-confirmed: `.claude/rules/anti-fabrikasi.md`); change ini menambah teks klaim baru (kartu game), grounding-nya diketatkan Persyaratan 8 dan kriteria 11.
2. Deploy worker chat produksi — push `master` paska-merge yang menyentuh `src/lib/components/Portfolio.svelte` otomatis menjalankan workflow "Deploy chat worker" (trigger `paths:` `.github/workflows/deploy-worker.yml:16`) — deploy worker chat produksi dengan secrets dan kill switch sebagaimana CLAUDE.md gambarkan; kesehatannya dijaga kriteria 15.

## Asumsi

Dibawa dari intent.md (kecuali dinyatakan dikonfirmasi/dijawab):

- "Diatas Breakout 3D" = posisi kartu di section Portfolio `src/lib/components/Portfolio.svelte`, bukan halaman lain.
- Frasa "a hand-written WebGL2 brick breaker" pada permintaan = appositif kartu Breakout 3D lama; game baru bukan brick breaker.
- Game baru mengikuti pola dua pendahulu (repo terpisah + GitHub Pages + tanpa engine/runtime dependency) — DIKONFIRMASI Keputusan penerimaan #3.
- Scope = SATU game baru plus kartunya.
- Definisi operasional "jauh lebih bagus dan bermakna" (Pertanyaan terbuka #1 intent) dijawab spec ini: game mengisi tiga gap riset sekaligus (determinisme+replay, algoritma AI, PG) sebagaimana kriteria 3–7; hook terlihat ≤ 10 detik (kriteria 8); SHIPPED + live + CI (kriteria 1, 9); dan kartu membawa cerita engineering problem → approach → hasil (kriteria 10–11). Definisi ini mengikat bila lead menerima spec.

Lahir di run ini:

- Judul final game dan nama repo = keputusan plan; judul kerja "Gridlock".
- Anggaran scope gameplay diketatkan di plan agar SHIPPED (risiko utama shortlist #1); spec hanya mengunci konsep dan kriteria.
- Perilaku aksesibilitas game mengikuti pola pendahulu (belum diperiksa detailnya di run ini — diukur di repo game saat build).
- Footer tidak disentuh; kartu OG game dan penyinggungan README profil di luar scope, mengikuti preseden dua game sebelumnya (kanon OG situs hanya 3 template di `scripts/og/`, tanpa game).
- Vhost "pola gerbang pendahulu" diukur dari repo lokal `breakout-3d-webgl` (bukan tree Bio); repo game baru dianggap mengikuti pola yang sama.

## Pertanyaan terbuka

- Anggaran waktu/deadline untuk change ini (Pertanyaan terbuka #7 intent — milik user, belum dijawab).
- Judul final game + nama repo (diputuskan di plan; tidak memblokir penerimaan spec).
- Fitur replay dapat diakses pemain di demo (di test saja sudah memenuhi kriteria 3; versi user-facing = peningkatan opsional, diputuskan plan sesuai anggaran scope).

## Keputusan penerimaan (2026-09-24, Fadhlillah via wawancara lead)

1. Spec diterima; definisi operasional "jauh lebih bagus dan bermakna" (Asumsi lahir-run butir 1) mengikat.
2. Anggaran waktu (menjawab Pertanyaan terbuka #1): **tanpa deadline** — kualitas dan SHIPPED penuh didahulukan, pola rantai Breakout enhance; bukan berarti scope tak terkunci (Non-goals tetap berlaku, anggaran scope gameplay diketatkan di plan).

Status penerimaan: diterima user Fadhlillah 2026-09-24T00:24:58+07:00 sha256:e5df5f34.
