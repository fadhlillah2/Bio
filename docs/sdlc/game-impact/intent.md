# Intent: Game WebGL2 baru yang lebih bermakna — riset game berdampak besar dulu, kartu di atas Breakout 3D

Penulis: sdlc-plan (draf unattended, jalur ide, slot model pelaksana caller), 2026-09-23T23:42:05+07:00, dilepas oleh: Fadhlillah (nama saja, tanpa email), skrip: sdlc-plan.js sha256 c693ff6f. Status: draf.

Asal: ide (teks perintah `/sdlc-plan` dari user sesi) oleh tidak tertulis di sumber.

## Masalah

Dalam kata pemilik sumber: "tambahkan game baru lagi diatas Breakout 3D — a hand-written WebGL2 brick breaker. dan game yang jauh lebih bagus dan bermakna diatas nya riset dulu daftar game yg memberikan impact besar nya itu".

Fakta kode yang saya buka sendiri:

- Section Portfolio situs Bio memuat kartu game "Breakout 3D — a hand-written WebGL2 brick breaker" di `src/lib/components/Portfolio.svelte:96` (kartu utuh `src/lib/components/Portfolio.svelte:92-110`) — frasa "a hand-written WebGL2 brick breaker" pada permintaan cocok persis dengan judul kartu yang sudah ada ini (pembacaan bahwa frasa itu appositif menunjuk kartu lama, bukan deskripsi game baru, ada di Asumsi).
- Urutan blok section saat ini: FOX (`src/lib/components/Portfolio.svelte:15-26`) → Fineksi (`src/lib/components/Portfolio.svelte:28-39`) → RAG (`src/lib/components/Portfolio.svelte:42-65`) → Rate Limiter (`src/lib/components/Portfolio.svelte:68-90`) → Breakout 3D (`src/lib/components/Portfolio.svelte:92-110`) → Tower Stack (`src/lib/components/Portfolio.svelte:113-130`) → arsip `early-practice` (`src/lib/components/Portfolio.svelte:134-192`). "Diatas Breakout 3D" = kartu game baru disisipkan tepat sebelum kartu Breakout 3D — blok ke-5 dari 7, TETAP di bawah empat kartu flagship (FOX, Fineksi, RAG, Rate Limiter), bukan paling atas section.
- Pola dua game sebelumnya: repo GitHub terpisah, live demo GitHub Pages, source di GitHub, klaim "No engine, no runtime dependencies" (`src/lib/components/Portfolio.svelte:97` Breakout, `:117` Tower Stack); link demo + source `:103-104` dan `:123-124`; di seluruh repo hanya `src/lib/components/Portfolio.svelte` yang menyebut kedua game, plus aset screenshot `static/assets/img/breakout-3d.png` dan `static/assets/img/tower-stack.png`.
- Belum ada riset "game dengan impact besar" di rantai ini — itu diminta eksplisit sebagai langkah PERTAMA sebelum game dibangun.
- Penanda footer "Updated <bulan> <tahun>" yang masih tercatat sebagai invarian di CLAUDE.md sudah TIDAK ADA di kode: kedua footer (komponen `src/lib/components/SiteFooter.svelte` + salinan inline di route writeup `src/routes/writeups/hybrid-retrieval/+page.svelte:172-186`) tidak memuat teks "Updated" maupun elemen `<time>` (satu-satunya `<time>` di `src/` ada di route writeup, `src/routes/writeups/fox-asset-project-management/+page.svelte:76`) — butir CLAUDE.md itu basi; perubahan footer bukan bagian change ini.

Inti masalah: portfolio game di situs berhenti di Breakout 3D; user mau naik kelas — satu game lagi yang jauh lebih bagus dan bermakna, dipilih berdasarkan riset daftar game yang terbukti berdampak besar, bukan sekadar demo teknik berikutnya.

## Hasil yang diinginkan

1. Artefak riset "daftar game yang memberikan impact besar" (sejarah/influensial, dengan sumber) tersedia dan DIREVIEW SEBELUM genre/judul game baru dikunci — user menyebut urutan ini eksplisit ("riset dulu").
2. Satu game baru dibangun dan live (pola yang diikuti dua game sebelumnya: repo GitHub terpisah + demo GitHub Pages; asumsi, lihat bawah), yang "jauh lebih bagus dan bermakna" daripada Breakout 3D (frasa pemilik; definisi operasionalnya = Pertanyaan terbuka #1).
3. Kartu game baru muncul di section Portfolio tepat DI ATAS kartu Breakout 3D, mengikuti pola kartu existing (badge, judul, deskripsi, result, tags, CTA play-demo + view-source, screenshot `static/assets/img/`), dan semua klaim kartu tergrounding pada repo game yang benar-benar ada.
4. Situs tetap lolos `bun run validate` — termasuk `check:regressions` yang menjaga grounding chat worker atas `Portfolio.svelte` (lihat sistem terdampak).

## User dan sistem terdampak

- Pengunjung situs Bio (recruiter/HM) — melihat kartu game baru tepat di atas Breakout 3D, tetap di bawah empat kartu flagship (FOX, Fineksi, RAG, Rate Limiter); bukan kartu paling atas di Project Showcase.
- Repo GitHub `fadhlillah2` — repo game baru + repo Bio (kartu + aset screenshot).
- Pipeline deploy Bio (GitHub Actions → GitHub Pages, push `master`) dan CI repo game baru.
- Layanan chat worker produksi ("ask the CV") — tidak ada perubahan fungsional yang diminta, tapi change menyentuh `src/lib/components/Portfolio.svelte` yang punya dua keterkaitan: (1) file itu ter-list di trigger `paths:` `.github/workflows/deploy-worker.yml:16`, sehingga push `master` yang menyentuhnya otomatis menjalankan workflow deploy worker produksi; (2) file yang sama adalah sumber grounding `siteFacts()` — `scripts/chat-proxy.ts:109` membaca anchor judul flagship Fineksi (`src/lib/components/Portfolio.svelte:31`) yang wajib match tepat satu, digenerate ke `worker/content.generated.ts` dan dijaga `check:regressions`; kartu baru tidak boleh menduplikasi anchor itu (judul kartu baru tidak boleh diawali "Fineksi"; pergeseran posisi aman karena `grab()` memakai `matchAll` atas seluruh file).
- Artefak `cv/` serta repo Tower Stack/Breakout 3D tidak tersentuh change ini.

## Batasan

- Kartu dan link Breakout 3D serta Tower Stack tidak diubah/dihapus; hanya disisipkan kartu baru di atasnya.
- Konvensi repo situs tetap: tanpa CSS framework, tanpa request pihak ketiga saat load, tanpa runtime dependency baru di situs; desain memakai token look yang ada.
- Anti-fabrikasi konten: semua klaim pada kartu/game harus bisa diverifikasi dari repo dan sumber nyata; tidak menaikkan klaim di luar bukti.
- `.claude/` dan `memory/` tetap local-only (gitignored); snapshot LinkedIn tidak masuk repo.
- Artefak `cv/` tidak tersentuh change ini.
- Penerimaan intent ini milik user — draf ini belum diterima.

## Pertanyaan terbuka

- Apa definisi operasional "jauh lebih bagus dan bermakna" — ukurannya visual, kedalaman gameplay, makna/naratif, atau dampak ke recruiter?
- Genre game apa yang dipilih setelah riset — dan apakah wajib tetap hand-written WebGL2 tanpa engine seperti dua pendahulunya, atau teknologi bebas?
- Kanon riset mana untuk "daftar game dengan impact besar" (sejarah/generik vs indie/portofolio-recruiter), dan berapa panjang daftarnya?
- Game baru di repo GitHub terpisah dengan deploy GitHub Pages (pola lama) atau langsung di dalam repo Bio?
- Standar gerbang kualitas: apakah wajib unit test + smoke test headless + screenshot gate seperti Tower Stack/Breakout 3D, atau lebih?
- Apakah aset kartu (PNG 1200x675) otomatis termasuk scope, atau terpisah?
- Ada anggaran waktu/deadline untuk change ini?
- Apakah game baru juga perlu kartu OG / penyinggungan di tempat lain (README profil, dsb.) seperti pola sebelumnya?
- Perangkat dan skema input yang ditargetkan game baru: desktop mouse/keyboard saja, atau responsif dengan kontrol sentuh?

## Asumsi

- "Diatas Breakout 3D" berarti POSISI KARTU di section Portfolio (`src/lib/components/Portfolio.svelte`), bukan di atas repo atau halaman lain.
- Frasa "a hand-written WebGL2 brick breaker" adalah appositif menunjuk kartu Breakout 3D yang sudah ada (`src/lib/components/Portfolio.svelte:96`); game baru TIDAK harus brick breaker lagi.
- Game baru mengikuti pola dua game sebelumnya: repo GitHub terpisah, demo GitHub Pages, kartu + screenshot di Bio, tanpa engine/runtime dependency (konvensi tercatat di memory `bio-looks-3d-2026-09-05`: keputusan dependency = user — akan dikonfirmasi di stage design).
- "Riset dulu" berarti riset adalah deliverable stage design dalam rantai SDLC ini (dipilih sebagai dasar keputusan genre), bukan pekerjaan paralel terpisah.
- Scope = SATU game baru (bukan beberapa), plus kartunya.

## Keputusan penerimaan (2026-09-23, Fadhlillah via wawancara lead)

1. Intent diterima sebagai baseline stage design.
2. Arah game (menjawab Pertanyaan terbuka #2, bagian genre): **simulasi deterministik + agen AI hand-written** (shortlist #1 `riset-game-impact.md` — RTS-lite/colony/traffic sim: fixed timestep + fixed-point, replay + desync hash, agen flow-field/A*/steering, PG map). Konsep konkret game dikunci di spec.
3. Teknologi (menjawab Pertanyaan terbuka #2, bagian teknologi): **tetap hand-written WebGL2, zero runtime dependency** — konsisten dua pendahulu; mengonfirmasi Asumsi #3.
4. Pertanyaan terbuka lainnya dibawa ke sdlc-design.

Status penerimaan: diterima Fadhlillah 2026-09-24T00:00:56+07:00 sha256:e3d0caea.
