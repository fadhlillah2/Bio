# Plan: Gridlock — simulasi lalu lintas deterministik WebGL2 (repo game baru `gridlock-webgl` + kartu Bio di atas Breakout 3D)

Dibuat oleh: sdlc-build mode plan, args root=Bio (root repo), change=docs/sdlc/game-impact, slot model pelaksana caller glm-5.3[1m], 2026-09-24T00:26:11+07:00, dilepas oleh: Fadhlillah, skrip: sdlc-build.js sha256 30336f1a, sha256 pendek CLAUDE.md edcbc7ee dan REVIEW.md tidak ada.

Status penerimaan: (ditulis lead — jangan diisi pelaksana)

## Rujukan

- Intent: `docs/sdlc/game-impact/intent.md` (definisi; tree Bio).
- Baris status penerimaan intent (disalin): "Status penerimaan: diterima Fadhlillah 2026-09-24T00:00:56+07:00 sha256:e3d0caea."
- Spec: `docs/sdlc/game-impact/spec.md` (definisi; tree Bio).
- Baris status penerimaan spec (disalin): "Status penerimaan: diterima user Fadhlillah 2026-09-24T00:24:58+07:00 sha256:e5df5f34."
- Record: tidak ada baris "Record: <sistem> <id>" di intent.md maupun spec.md.
- Riset: `docs/sdlc/game-impact/riset-game-impact.md` (definisi; tree Bio) — dasar arah game (shortlist #1).
- Kebijakan project: `CLAUDE.md` (tree Bio) sha256 pendek edcbc7ee; `REVIEW.md` tidak ada di repo.

Peta jangkar konten (label definisi/pemakaian + tree; kutipan teks dipakai sebagai jangkar grep karena nomor baris bisa bergeser):

| Jangkar | Label | Tree | Kutipan / arti |
| --- | --- | --- | --- |
| Kartu Breakout di `src/lib/components/Portfolio.svelte` | definisi | Bio | Komentar `<!-- Interactive experiment: real WebGL2 brick breaker; live build and source are linked -->` — kartu baru disisipkan TEPAT SEBELUM komentar ini |
| Judul kartu Breakout | definisi | Bio | `Breakout 3D — a hand-written WebGL2 brick breaker` — pembanding pola kartu; harus tetap tepat satu |
| Judul flagship Fineksi | definisi | Bio | `Fineksi — Financial Document Processing` — anchor grounding chat worker |
| Regex `siteFacts()` di `scripts/chat-proxy.ts` | pemakaian | Bio | `/<h3 class="flagship-title">(Fineksi[^<]*)<\/h3>/g` wajib match tepat satu; judul kartu baru TIDAK boleh diawali "Fineksi" |
| Trigger worker di `.github/workflows/deploy-worker.yml` | pemakaian | Bio | Entri `      - src/lib/components/Portfolio.svelte` di `paths:` — push `master` yang menyentuh file itu otomatis deploy worker chat produksi |
| Step Validate CI di `.github/workflows/deploy.yml` | pemakaian | Bio | `bun run validate:ci` di push `master`; tidak ada trigger `pull_request` di workflow Bio mana pun |
| Pola screenshot gate di repo `breakout-3d-webgl` | definisi | repo game (sibling Bio, `../breakout-3d-webgl`) | `scripts/screenshot.mjs`: dua capture `?shot=1` 1200x675 SwiftShader, bandingkan byte, tulis `screenshots/<nama>.png`; dipertiru untuk game baru |

Keputusan yang spec delegasikan ke plan (diputuskan di sini):

1. **Judul final + nama repo**: "Gridlock" — kartu berjudul `Gridlock — a hand-written WebGL2 traffic simulation`; repo GitHub `fadhlillah2/gridlock-webgl`, demo `https://fadhlillah2.github.io/gridlock-webgl/` (mengikuti pola sufiks `-webgl` dua pendahulu). Ketersediaan nama diverifikasi 2026-09-24 via `gh api repos/fadhlillah2/gridlock-webgl` → 404 (belum dipakai).
2. **Replay user-facing**: TIDAK — replay hidup sebagai test + mode `?autotest=1` internal; UI replay pemain = jalur evolusi (fase 2), bukan scope. Spec kriteria 3 terpenuhi dari test.
3. **Anggaran scope gameplay (dikunci agar SHIPPED)**: grid jalan 24x14 simpang; maksimum 300 agen konkuren; tick simulasi 20 Hz; checkpoint hash tiap 100 tick; dua dari tiga teknik AI (A* + steering) — flow-field BUKAN scope (jalur evolusi). Fitur di luar daftar tugas di bawah = non-goals.

## Berkas yang berubah

Repo game baru (baru; lokasi `../gridlock-webgl` relatif root Bio — sibling `breakout-3d-webgl`; repo git sendiri, branch `main`, diberi commit per tugas oleh pelaksana; TIDAK di-commit ke tree Bio):

- `package.json`, `.gitignore`, `LICENSE`, `README.md`, `index.html`, `style.css`
- `src/rng.js`, `src/fixed.js`, `src/map.js`, `src/path.js`, `src/steer.js`, `src/sim.js`, `src/replay.js`, `src/gl.js`, `src/render.js`, `src/input.js`, `src/main.js`, `src/autotest.js`
- `test/unit.rng.test.mjs`, `test/unit.fixed.test.mjs`, `test/unit.map.test.mjs`, `test/unit.path.test.mjs`, `test/unit.steer.test.mjs`, `test/unit.sim.test.mjs`, `test/unit.markup.test.mjs`
- `tools/harness.mjs`, `tools/serve.mjs`, `tools/smoke.mjs`, `scripts/screenshot.mjs`
- `screenshots/gridlock.png` (hasil generate, di-commit seperti pendahulu)
- `.github/workflows/ci.yml`

Repo Bio:

- `src/lib/components/Portfolio.svelte` (ada — sisip kartu)
- `static/assets/img/gridlock.png` (baru — salinan `screenshots/gridlock.png` dari repo game)
- `scripts/app-smoke.ts` (ada — tambah blok assertion kartu Gridlock)
- `docs/sdlc/game-impact/baseline-portfolio.png` TIDAK dibuat — bukti tampilan kartu = assertion `check:app` + probe visual tiga look di V3 (lihat tugas B1)

Berkas yang TIDAK boleh berubah (kriteria 14 spec): kartu/link Breakout 3D dan Tower Stack, `static/assets/css/style.css` (kartu baru memakai class flagship yang sudah ada), `src/lib/enhance.js`, semua skrip chat, kedua workflow Bio, seluruh `cv/`, `scripts/og/`, kedua footer, `memory/`, `.claude/`, repo `breakout-3d-webgl` dan `tower-stack-webgl`.

## Urutan kerja

Konvensi eksekusi: tugas 1–7 dikerjakan di repo game (`cd ../gridlock-webgl` dari root Bio), commit merah lalu commit hijau per tugas DI REPO GAME (git init di tugas 1, branch `main`; tanpa trailer `Co-Authored-By` — aturan CLAUDE.md mengalahkan default harness). Tugas 8–11 menyentuh Bio pada branch kerja `game-impact` dengan disiplin commit yang sama. Semua perintah dijalankan dengan cwd repo yang relevan.

### Tugas 1 — Fondasi repo game + primitif determinisme

- id: G1, kind: kode
- Prasyarat: —
- Berkas: `package.json`, `.gitignore`, `LICENSE`, `README.md` (stub), `src/rng.js`, `src/fixed.js`, `test/unit.rng.test.mjs`, `test/unit.fixed.test.mjs`
- Isi: `git init -b main` + scaffold: `package.json` model pendahulu (`name: gridlock-webgl`, `private`, `type: module`, scripts `start|test|smoke|screenshot`, TANPA `dependencies` maupun `devDependencies`; `homepage: https://fadhlillah2.github.io/gridlock-webgl/`); `.gitignore` berisi `node_modules/`; `LICENSE` disalin dari `../breakout-3d-webgl/LICENSE`. `src/rng.js`: `createRng(seed)` → `{ next(): uint32, nextInt(min, maxExclusive) }` (sfc32/splitmix32, aritmetika integer saja). `src/fixed.js`: fixed-point Q10 (1 unit = 1024; 1 << 10) — `toFp/fromFp`, `fpMul/fpDiv` via `Math.imul` + shift (integer-only, tanpa pembagian float di jalur state), plus `fnv1a(...)` → hex 8 digit untuk hash checkpoint. Modul inti (`rng/fixed/map/path/steer/sim/replay/autotest`) wajib DOM-free (diimpor Node tanpa browser).
- Test: `test/unit.rng.test.mjs` (seed sama → urutan `next()` identik ≥1000 nilai; seed beda → urutan beda; `nextInt` di rentang). `test/unit.fixed.test.mjs` (round-trip toFp/fromFp; `fpMul` exact pada kasus identitas; hasil `fnv1a` stabil dan beda untuk input beda).
- Cara membuktikan selesai: `npm test` hijau (`node --test` menemukan kedua file; keluaran `# pass` ≥ jumlah test, exit 0).

Bukti merah: 9a2cf70 test/unit.rng.test.mjs

### Tugas 2 — Peta prosedural dari seed

- id: G2, kind: kode
- Prasyarat: G1
- Berkas: `src/map.js`, `test/unit.map.test.mjs`
- Isi: `createMap(seed, {cols: 24, rows: 14})` → graf jalan grid: bangun spanning tree acak ber-seed (semua simpang terhubung BY CONSTRUCTION — tanpa DSU/cek bridge) lalu tambahkan edge ber-seed sampai densitas target, simpang tepi = calon spawn/tujuan; state edge `open` bisa di-toggle (`close(edgeId)/open(edgeId)`) TANPA mengubah identitas/urutan edge; `hash()` = `fixed.fnv1a` atas serialisasi kanonik (daftar edge terurut id, field tetap).
- Test: seed sama → `hash()` peta identik; seed beda → beda; `close` tercermin di adjacency tapi `hash()` struktur topologi awal tetap fungsi seed; jumlah edge dalam rentang wajar (≥ 50% edge grid penuh; konektivitas = properti konstruksi spanning-tree, tanpa test BFS terpisah).
- Cara membuktikan selesai: `npm test` hijau.

Bukti merah: 49dd000 test/unit.map.test.mjs

### Tugas 3 — Pathfinding A* + steering

- id: G3, kind: kode
- Prasyarat: G2
- Berkas: `src/path.js`, `src/steer.js`, `test/unit.path.test.mjs`, `test/unit.steer.test.mjs`
- Isi: `path.js` — `findRoute(map, fromId, toId)`: A* deterministik pada grid (heuristik Manhattan fixed-point; neighbor diurut id edge naik; tie-break id kecil dulu), menghindari edge `open=false`, `null` bila terputus. `steer.js` — `stepAgents(agents, dtFp)`: separation (spatial hash sel grid; dorong menjauh dari tetangga terdekat), speed adjustment (melambat bila leader di depan pada edge sama), semua fixed-point, iterasi array urut tetap, tanpa alokasi float nondeterministik.
- Test: `unit.path` — rute valid (edge berturutan, ujung sambung), shortest pada graf kecil yang diketahui, deterministik dua panggilan + dua seed, rute menghindari edge tertutup (dan berubah setelah `close`). `unit.steer` — dua agen bertetangga bergerak saling menjauh (jarak naik); agen di belakang leader melambat; dua run state awal sama → state akhir identik (hash).
- Cara membuktikan selesai: `npm test` hijau.

Bukti merah: 5fe5c8b test/unit.path.test.mjs test/unit.steer.test.mjs

### Tugas 4 — Sim inti deterministik + replay + desync

- id: G4, kind: kode
- Prasyarat: G3
- Berkas: `src/sim.js`, `src/replay.js`, `test/unit.sim.test.mjs`
- Isi: `createSim({seed, maxAgents: 300, tickHz: 20})` → `{ step(inputs), snapshot(), hashCheckpoint(), metrics() }`. Fixed timestep: satu `step` = satu tick; semua state agen (posisi/kecepatan/rute) fixed-point; scheduler spawn + pemilihan tujuan dari RNG seeded; agen lahir di simpang tepi, mencapai tujuan → dicatat arrival (throughput, trip time). Input pemain masuk sebagai log `{tick, type, ...}` (`toggle-edge` / `spawn-rate`) dan DITERAPKAN pada tick persis; penutupan edge memicu re-rute agen yang rutenya memakai edge itu. Checkpoint tiap 100 tick: `hashCheckpoint()` = `fnv1a` atas serialisasi kanonik seluruh state (urutan array tetap). `replay.js` — `recordInputs()/playback(sim, log, ticks)/assertInSync(sim, expectedHashes)` melempar `DesyncError` bila hash melewati checkpoint menyimpang (simpangan bentuk kode: `playback` membutuhkan `ticks` eksplisit — log input tidak punya panjang run yang tersirat).
- Test (test/unit.sim.test.mjs, memetakan langsung kriteria 3 spec): (a) dua run seed sama → hash identik di tiap checkpoint; (b) anti-hash-konstan: input beda (toggle edge vs tidak) → hash beda; (c) replay dari rekaman input → hash identik run asli; (d) desync: injeksi penyimpangan state (geser posisi satu agen setelah checkpoint) → `DesyncError` terdeteksi; (e) efek reroute: setelah `toggle-edge` menutup segmen padat, metrik antrean/trip-time berubah terukur dalam ≤ 200 tick (inti tanpa-browser untuk kriteria 8); (f) source-scan: membaca isi `src/{rng,fixed,map,path,steer,sim,replay}.js` dan gagal bila ada `Math.random`, `Date.now`, atau `performance.now` (kriteria 5).
- Cara membuktikan selesai: `npm test` hijau.

Bukti merah: 7b07c6a test/unit.sim.test.mjs

### Tugas 5 — Render WebGL2 + HUD + input + mode shot/autotest

- id: G5, kind: kode
- Prasyarat: G4
- Berkas: `src/gl.js`, `src/render.js`, `src/input.js`, `src/main.js`, `src/autotest.js` (stub minimal — skenario final di G6), `index.html`, `style.css`, `test/unit.markup.test.mjs`
- Isi: `gl.js` — pipeline WebGL2 hand-written (satu program, instanced quad untuk jalan + agen, kamera ortho miring 2.5D, palet konstanta; fallback pesan bila WebGL2 absen). `render.js` — gambar `snapshot()`; HUD = DOM overlay (bukan canvas): throughput (arrival/menit), trip-time rata-rata, panjang antrean, tick, seed, jumlah segmen tertutup — HUD juga mengekspos `data-metrics` JSON dan (mode autotest) `data-sim-hash` untuk probe. `input.js` — pointer: hit-test segmen → antre `toggle-edge`; kontrol laju spawn di HUD via pointer; keyboard HANYA `Space` pause dan `N` step (pembagian kanal input persis spec Persyaratan 9; pause/step = meta render, TIDAK masuk input log; tanpa tombol reset — muat ulang halaman = seed sama karena deterministik); kontrol masuk input-log dengan tick sehingga tetap deterministik. `main.js` — loop accumulator (sim fixed timestep, render rAF); mode `?shot=1&ticks=N&w=W&h=H`: jalan N tick, freeze, set atribut `data-frame="WxH"` dan `data-box="0,0,W,H"` pada elemen akar (pola pendahulu); `data-gl="ok"` saat WebGL2 hidup / nilai error saat gagal, plus `data-draws` = penghitung draw frame terakhir (pola `breakout-3d-webgl/src/main.js`) untuk guard smoke/screenshot; mode `?autotest=1`: eksekusi skenario `src/autotest.js` secara SINKRON lalu render sekali + set atribut hasil (pola pendahulu — BUKAN accumulator rAF real-time). `index.html`/`style.css` — kanvas fokus-able dengan `aria-label`, tanpa resource eksternal (font sistem), layout tidak pecah di layar sempit (canvas responsive). Aksesibilitas mengikuti pola pendahulu: kontrol keyboard lengkap, `prefers-reduced-motion` → mulai paused.
- Test: `test/unit.markup.test.mjs` — index.html memuat id HUD yang dipakai render.js; scan `index.html` + `src/*.js`: tidak ada URL `http(s)://` pihak ketiga (hanya boleh `127.0.0.1`/komentar `homepage` di package.json); atribut `data-frame`/`data-box`/`data-sim-hash`/`data-metrics`/`data-draws`/`data-gl` disebut di main.js.
- Cara membuktikan selesai: `npm test` hijau. Celah bernama: acuan visual - tampilan game baru tidak punya mock; yang digerbangi adalah determinisme capture (screenshot gate G6) dan struktur DOM (smoke G6), bukan kesesuaian dengan desain visual eksternal.

Bukti merah: a9bfdc5 test/unit.markup.test.mjs

### Tugas 6 — Smoke lintas-lingkungan + screenshot gate

- id: G6, kind: kode
- Prasyarat: G5
- Berkas: `src/autotest.js` (skenario final), `tools/harness.mjs`, `tools/serve.mjs`, `tools/smoke.mjs`, `scripts/screenshot.mjs`, `index.html` (wiring mode autotest — simpangan G6: tidak jadi berubah, wiring `?autotest=1` sudah tuntas di G5), `README.md` (cara menjalankan gerbang), `screenshots/gridlock.png` (hasil)
- Isi: `src/autotest.js` — skenario tetap: seed `0xC0FFEE`, tutup satu edge padat tick 120, buka lagi tick 400, ubah laju spawn tick 600, jalankan 1200 tick; ekpos `data-sim-hash` + `data-metrics` ke DOM; skenario yang SAMA bisa dijalankan murni di Node (impor modul inti). `tools/harness.mjs` — `findChrome/runChrome/startServer` meniru `../breakout-3d-webgl/tools/harness.mjs`. `tools/serve.mjs` — server statis `127.0.0.1:8000` (`npm start`; port ini yang dipakai probe V3). `tools/smoke.mjs` — headless Chrome muat `?autotest=1`: (1) `data-gl="ok"` dan `data-draws > 0` (frame betul-betul digambar — pola pendahulu, bukan inspeksi piksel); (2) `data-sim-hash` browser SAMA dengan hash yang dihitung Node dari skenario sama (kriteria 4 lintas-lingkungan); (3) nilai HUD masuk akal (agen aktif > 0, throughput > 0); (4) bebas resource eksternal dijamin STATIS oleh scan markup G5 (`unit.markup.test.mjs`) — `--dump-dom` tidak mengekspos network, smoke tidak menulis mekanisme intersepsi baru. Smoke membawa `--virtual-time-budget` pada setiap runChrome; autotest dieksekusi sinkron lalu render sekali. `scripts/screenshot.mjs` — dua capture `?shot=1&ticks=600&w=1200&h=675` (flag SwiftShader + virtual-time-budget ala pendahulu; guard = sentinel `assertShotDom` pendahelu disalin UTUH — `data-gl=ok`, tanpa `data-error`, `data-draws>0` — plus `data-frame`/`data-box`/PNG header/dimensi), bandingkan byte-identical, tulis `screenshots/gridlock.png`.
- Cara membuktikan selesai: `npm run smoke` hijau dan `npm run screenshot` mencetak keberhasilan compare + menghasilkan `screenshots/gridlock.png` 1200x675.

Bukti merah: 7c561d8 tools/smoke.mjs

### Tugas 7 — CI + deploy Pages + README final (repo game)

- id: G7, kind: dokumen
- Prasyarat: G6
- Berkas: `.github/workflows/ci.yml`, `README.md` (final), `LICENSE` (final bila masih stub)
- Isi: `ci.yml` — trigger push `main` + `pull_request` + `workflow_dispatch`, Node 22, dua step persis pola kedua pendahulu: `npm test`, `node tools/smoke.mjs`. `scripts/screenshot.mjs` = gerbang LOKAL (`npm run screenshot`, bukti tugas V1) persis pendahulu — kriteria 9 "setara pendahulu" dibaca: CI menjalankan unit+smoke, screenshot gate dua-capture tetap hidup sebagai gerbang lokal; menaikkannya ke CI hanya bila terbukti stabil lintas mesin (keputusan lead terpisah, bukan scope build; lihat Risiko 7). TIDAK ada workflow deploy (tanpa `.github/workflows/deploy.yml`, tanpa `actions/upload-pages-artifact`/`actions/deploy-pages`): repo statis tanpa build step disajikan Pages langsung dari root branch `main` — source Pages = branch `main` path `/` (`build_type: legacy`), persis konfigurasi terverifikasi kedua pendahulu via `gh api repos/fadhlillah2/{breakout-3d-webgl,tower-stack-webgl}/pages` → `{"build_type":"legacy","source":{"branch":"main","path":"/"}}`; user memilih source itu saat gate manusia. `README.md` — judul, link demo, kontrol, penjelasan determinisme/replay/desync, daftar gerbang dan cara menjalankan, screenshot; SEMUA klaim README = artefak yang ada (sumber grounding kartu Bio; anti-fabrikasi).
- Cara membuktikan selesai: `grep -c "npm test\|tools/smoke.mjs" .github/workflows/ci.yml` ≥ 2 DAN `grep -c "scripts/screenshot.mjs" .github/workflows/ci.yml` = 0 (screenshot tetap gerbang lokal); README memuat URL demo dan tabel gerbang; CI benar-benar hijau terbukti SETELAH user push (gate manusia, dicatat di open_questions) — bukan bagian build.

### Tugas 8 — Kartu Bio + aset + guard app-smoke

- id: B1, kind: kode
- Prasyarat: G6 (aset `screenshots/gridlock.png` dan URL final)
- Berkas (Bio): `scripts/app-smoke.ts` (ada), `src/lib/components/Portfolio.svelte` (ada), `static/assets/img/gridlock.png` (baru)
- Urutan TDD: (merah) tambah blok assertion di `scripts/app-smoke.ts` → `bun run build && bun run check:app` GAGAL karena kartu belum ada; (hijau) sisip kartu + salin aset → hijau.
- Assertion app-smoke (via `js()` pada built page): array judul `#portfolio .flagship-title` memuat `Gridlock — a hand-written WebGL2 traffic simulation`; indeks Gridlock = indeks `Breakout 3D — a hand-written WebGL2 brick breaker` dikurangi 1 (tepat di atas); kartu Gridlock memuat dua CTA `https://fadhlillah2.github.io/gridlock-webgl/` dan `https://github.com/fadhlillah2/gridlock-webgl`; `img` di kartu ber-`src` berakhiran `/assets/img/gridlock.png` dengan atribut `width="1200" height="675"`; hanya judul Fineksi yang berawalan "Fineksi" (kriteria 12).
- Kartu disisipkan TEPAT SEBELUM komentar `<!-- Interactive experiment: real WebGL2 brick breaker; live build and source are linked -->` di `src/lib/components/Portfolio.svelte`, markup verbatim (pola dan class identik pendahulu; `base` sudah diimpor file itu):

```svelte
        <!-- Interactive experiment: deterministic WebGL2 traffic simulation; live build and source are linked -->
        <article class="flagship" data-reveal>
          <div class="flagship-body">
            <p class="flagship-badge">Interactive experiment &middot; WebGL2</p>
            <h3 class="flagship-title">Gridlock — a hand-written WebGL2 traffic simulation</h3>
            <p class="flagship-desc">A deterministic traffic simulation rendered by a small hand-written WebGL2 pipeline: a road grid generated procedurally from a seed, autonomous vehicles that route with hand-written A* and steering on a fixed timestep with fixed-point state, and input-logged runs that replay exactly while a state hash catches any desync. Close a road and watch the network reroute. No engine, no runtime dependencies.</p>
            <p class="flagship-result">Vanilla JS + GLSL; the repo ships unit tests for determinism, replay, and desync detection, a Chrome-headless smoke test that cross-checks the browser against Node, and a screenshot gate that fails unless two captures of the same frame agree byte for byte.</p>
            <ul class="tag-row">
              <li>WebGL2</li><li>GLSL</li><li>Vanilla JS</li><li>A* + steering</li><li>Deterministic replay</li>
            </ul>
            <div class="flagship-cta">
              <a href="https://fadhlillah2.github.io/gridlock-webgl/" class="btn btn-solid btn-sm" target="_blank" rel="noopener" aria-label="Play the Gridlock demo (opens in new tab)">Play the demo</a>
              <a href="https://github.com/fadhlillah2/gridlock-webgl" class="btn btn-ghost btn-sm" target="_blank" rel="noopener" aria-label="View the Gridlock source on GitHub (opens in new tab)">View source <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></a>
            </div>
          </div>
          <div class="flagship-shot" aria-hidden="true">
            <img src={base + "/assets/img/gridlock.png"} alt="" loading="lazy" decoding="async" width="1200" height="675" />
          </div>
        </article>
```

- Grounding tiap klaim kartu (anti-fabrikasi, kriteria 11): "procedurally from a seed" → G2+test; "hand-written A* and steering" → G3+test; "fixed timestep with fixed-point state" → G4+test; "input-logged runs that replay exactly while a state hash catches any desync" → G4 test (c)+(d); "Close a road and watch the network reroute" → G4 test (e) + probe V2; "No engine, no runtime dependencies" → `package.json` tanpa dependencies; "unit tests for determinism, replay, and desync detection" → `test/unit.sim.test.mjs`; "smoke test that cross-checks the browser against Node" → `tools/smoke.mjs`; "screenshot gate ... byte for byte" → `scripts/screenshot.mjs`. DILARANG menambah klaim angka (jumlah test, FPS, jumlah agen) pada kartu.
- Aset: `cp ../gridlock-webgl/screenshots/gridlock.png static/assets/img/gridlock.png` (PNG asli hasil capture live build, bukan mock).
- Acuan visual (tugas mengubah tampilan): Celah bernama: acuan visual - Bio tidak punya gerbang screenshot section otomatis (frontend-regression.ts = cek DOM/print/menu, bukan piksel; diff piksel section tinggi nondeterministik per pelajaran memory), dan loop pembanding manual baru hanya menggandakan probe yang sudah ada. Bukti tampilan = tiga lapis yang direncanakan: markup kartu verbatim pola pendahulu (di atas), assertion struktural `check:app` (posisi, CTA, aset, anatomi), dan probe visual tiga look + screenshot bukti di V3 langkah 6.
- Cara membuktikan selesai: `bun run build && bun run check:app` hijau (assertion kartu lulus); `bun run check` (svelte-check) bersih.

Bukti merah: 70be068 scripts/app-smoke.ts

### Tugas 9 — Verifikasi lengkap repo game

- id: V1, kind: verifikasi
- Prasyarat: G6, G7
- Berkas: tidak mengubah apa pun
- Cara membuktikan selesai: di `../gridlock-webgl`: `npm test` hijau; `npm run smoke` hijau; `npm run screenshot` hijau (dua capture byte-identical); `git log --oneline` memperlihatkan pasangan commit merah/hijau per tugas G1–G6 (G7 = commit tunggal, dokumen); audit anti-fabrikasi: setiap klaim pada teks kartu Bio dipetakan ke bukti (checklist grounding di tugas B1) via grep jangkar, mis. `grep -c "DesyncError" src/replay.js` ≥ 1, `grep -c '"dependencies"' package.json` mencetak `0` (exit 1 dari grep memang berarti tidak ketemu — nilai cetakan `0` yang dicek, bukan exit code; pola ber-kutip agar tak termakan kata "dependencies" di field description), `grep -c "findRoute" src/path.js` ≥ 1.

### Tugas 10 — Verifikasi lengkap repo Bio + audit diff tak-tersentuh

- id: V2, kind: verifikasi
- Prasyarat: B1
- Berkas: tidak mengubah apa pun
- Cara membuktikan selesai (di root Bio, branch kerja): `bun run validate` hijau; `bun run validate:ci` hijau; `bun scripts/chat-proxy-selftest.ts` dan `bun scripts/chat-worker-build.ts --check` hijau. Audit diff atas rentang commit ter-commit (`git diff $(git merge-base HEAD master)..HEAD --stat` — bukan `git status`): hanya `src/lib/components/Portfolio.svelte`, `static/assets/img/gridlock.png`, `scripts/app-smoke.ts`, dan `docs/sdlc/game-impact/{intent,spec,plan}.md` (plan.md di-force-add ke branch oleh lead saat penerimaan plan — pola intent/spec; tanpa itu plan memang tak muncul di diff karena `docs/sdlc` di-gitignore); probe jangkar konten (bukan nomor baris): `git diff $(git merge-base HEAD master)..HEAD -- cv/ scripts/og/ src/lib/components/SiteFooter.svelte memory/ .claude/` kosong (pathspec HANYA path dalam repo Bio — pathspec di luar root seperti `../breakout-3d-webgl` membuat git gagal `fatal: ... is outside repository` exit 128 SEBELUM output apa pun, membunuh seluruh audit; kedua repo sibling adalah repo git terpisah yang tak mungkin muncul di diff Bio, jadi diaudit TERPISAH): `git -C ../breakout-3d-webgl status --porcelain` kosong dan `git -C ../tower-stack-webgl status --porcelain` kosong, plus `git -C ../breakout-3d-webgl rev-parse HEAD` dan `git -C ../tower-stack-webgl rev-parse HEAD` = HEAD baseline yang dicatat pelaksana SAAT MULAI bekerja (tanpa hash literal di plan — pin hash membuat eksekusi berhenti palsu bila repo itu sah bergerak sebelum build; bila status tidak kosong atau HEAD bergeser dari baseline → BERHENTI dan laporkan ke lead — kriteria 14 "tidak ada komit/push ke repo kedua game" terlanggar atau ada aktivitas lain yang lead harus tahu, jangan lanjut); `grep -c "Breakout 3D — a hand-written WebGL2 brick breaker" src/lib/components/Portfolio.svelte` = 1 dan `grep -c "Tower Stack — a hand-written WebGL2 game" src/lib/components/Portfolio.svelte` = 1 dan `grep -c "Gridlock — a hand-written WebGL2 traffic simulation" src/lib/components/Portfolio.svelte` = 1.

### Tugas 11 — Probe interaksi browser (hook ≤ 10 detik + reroute)

- id: V3, kind: verifikasi
- Prasyarat: B1, V1
- Berkas: tidak mengubah apa pun
- Cara membuktikan selesai: di `../gridlock-webgl` jalankan `npm start`; dengan Playwright (browser nyata — memori project: Chrome headless CLI tidak men-fire event pointer/scroll, wajib Playwright): (1) navigate `http://127.0.0.1:8000/`; (2) dalam ≤ 10 detik sejak load, agen terlihat mengalir di jaringan (baca `data-metrics`: agents aktif > 0, throughput > 0) — kriteria 8 + behavior 2; (3) catat metrik, klik satu segmen jalan padat (real click), dalam ≤ 10 detik `data-metrics` berubah (antrean/trip-time naik atau agen pindah jalur — reroute emergent); (4) buka kembali, metrik pulih; (5) kontrol laju spawn di HUD (pointer) mengubah spawn tercermin di metrik; (6) screenshot sesi sebagai bukti visual. Lalu probe kartu Bio: `bun run preview`, navigate `#portfolio`, verifikasi visual kartu Gridlock tampil benar di tiga look (switch kiri-bawah), screenshot bukti.

## Risiko dan mitigasi

1. **Scope gameplay melebar → game tak pernah SHIPPED** (risiko utama shortlist #1 riset; anti-patan eksplisit). Mitigasi: fitur dikunci daftar tugas G1–G7 (anggaran: grid 24x14, ≤300 agen, 20 Hz, checkpoint 100 tick; A*+steering saja); flow-field, multiplayer, replay UI, mode kampanye = non-goals spec; perubahan scope = keputusan lead baru, bukan improvisasi pelaksana.
2. **Non-determinisme terselundup di jalur state** (float, `Math.random`, `Date.now`, iterasi `Map`). Mitigasi: fixed-point integer-only (`Math.imul`+shift), RNG seeded tunggal, serialisasi/iterasi kanonik urut id; test G4 (a)–(d) + source-scan G4 (f); cross-check Node vs browser G6 (kriteria 4).
3. **False desync dari serialisasi tidak kanonik** → replay selalu "desync". Mitigasi: format serialisasi ditetapkan di G4 (field tetap, urutan array tetap, hash via `fnv1a`); test (c) replay identik adalah penangkalnya.
4. **Anchor chat worker pecah** (judul kartu baru meniru/menduplikasi "Fineksi", regex `scripts/chat-proxy.ts` match ≠ 1). Mitigasi: judul dikunci `Gridlock — …`; assertion B1 melarang prefiks "Fineksi"; gerbang `chat-proxy-selftest` + `chat-worker-build --check` wajib hijau di V2.
5. **Push `master` paska-merge otomatis deploy worker chat produksi** (`deploy-worker.yml` paths memuat Portfolio.svelte). Mitigasi: `bun run validate:ci` hijau lokal di branch kerja SEBELUM merge (memuat kedua gerbang chat via `check:regressions`); run workflow post-merge dipantau lead; kill switch `PROD_ENDPOINT` per CLAUDE.md bila darurat. Di PR tidak ada workflow Bio yang berjalan (tanpa trigger `pull_request`) — gerbang pra-merge memang validate:ci lokal.
6. **Performa: 300 agen × A* tiap tick**. Mitigasi: rute dihitung sekali saat spawn, re-rute HANYA saat edge di rute ditutup; steering pakai spatial hash; smoke G6 menjalankan 1200 tick dengan timeout — anggaran ini yang diuji, bukan asumsi.
7. **Pembacaan kriteria 9 spec (screenshot gate di CI vs lokal) — DIPUTUSKAN LEAD saat menerima plan**: CI repo game = `npm test` + `node tools/smoke.mjs` persis kedua pendahulu (Chrome headless + SwiftShader di runner terbukti oleh step smoke CI kedua pendahulu); screenshot gate dua-capture = gerbang LOKAL (`npm run screenshot`, bukti tugas V1) persis pendahulu — "setara pendahulu" dibaca demikian, menghindari risiko first-time-in-CI yang belum pernah dibuktikan stabil lintas mesin. Menaikkan screenshot ke CI = keputusan lead terpisah di masa depan, hanya setelah capture terbukti stabil.
8. **Nama repo `gridlock-webgl` dipakai orang lain saat gate manusia** (tersedia saat pengecekan 2026-09-24, 404). Mitigasi: bila saat create sudah ada, pelaksana BERHENTI dan minta keputusan nama lead; jangan memilih nama lain sendiri (mengubah URL kartu + README).
9. **Dua sesi edit bersamaan / kontaminasi tree** (pelajaran memory: side-effects agent, tool lain menulis tree). Mitigasi: semua tugas Bio pada branch `game-impact` saja; sebelum tiap commit, `git status --porcelain -uall` diperiksa; artefak build (`build/`, `static/cv/`) tidak pernah di-commit.
10. **Footer/kartu lama ikut tergeser** (invarian basi CLAUDE.md soal footer mudah menyesatkan). Mitigasi: kriteria 14 — probe V2 memastikan kedua footer dan kedua kartu lama byte-identical terhadap base; footer TIDAK disentuh.
11. **Urutan gate manusia: repo game WAJIB live sebelum PR Bio di-merge** — `app-smoke` memblokir semua request non-origin (`scripts/app-smoke.ts:50-53`) dan audit grounding V1 memetakan klaim ke artefak lokal, jadi tanpa kendala urutan ini kartu dengan link demo/source 404 bisa terbit live tanpa gerbang pra-merge yang menangkapnya (curl 200 baru memverifikasi setelah keduanya terlanjur). Mitigasi: open questions #1 (push repo game + aktifkan Pages) HARUS selesai sebelum #2 (merge PR Bio).

## Cara membuktikan selesai keseluruhan

Repo Bio (cwd = root Bio, branch `game-impact`):

```
bun install
bun run validate
bun run validate:ci
bun scripts/chat-proxy-selftest.ts
```
harus mencetak: `chat proxy selftest: all checks passed`
```
bun scripts/chat-worker-build.ts --check
```
harus mencetak: `worker content: in sync with cv/ and the agent definition`
```
bun run check
```
(svelte-check; bagian dari validate, dipisah di sini untuk iterasi cepat kartu)

Repo game (cwd = `../gridlock-webgl`):

```
npm test
npm run smoke
npm run screenshot
```

Probe browser (Playwright, browser nyata — bukan Chrome headless CLI dump; sesuai pelajaran memory bahwa headless CLI tidak men-fire event scroll/pointer): langkah tugas V3 (hook ≤ 10 detik, reroute terlihat, metrik berubah, kartu Bio tampil benar di tiga look).

Pemeriksaan pasca-gate-manusia (bukan bagian build; dicatat di open_questions): `curl -fsSI https://fadhlillah2.github.io/gridlock-webgl/` → `HTTP/2 200` setelah user push + Pages aktif; run "Deploy chat worker" hijau pada push `master` paska-merge (kriteria 15b); CI repo game hijau pada push pertama (kriteria 9 live).

## Open questions

Tidak ada kekhawatiran spec yang belum beres (spec: "Tidak ada kekhawatiran yang tidak bisa dipenuhi dan tidak ada kebijakan project yang bertabrakan dengan change ini."). Yang tersisa adalah gate manusia dan keputusan yang sudah didelegasikan ke plan dan DIKUNCI di sini (judul "Gridlock", repo `gridlock-webgl`, replay test-only):

1. Membuat repo GitHub publik `fadhlillah2/gridlock-webgl`, push, dan mengaktifkan Pages dengan source = branch `main` path `/` (`build_type: legacy`, persis dua pendahulu — tanpa workflow deploy, repo statis disajikan langsung dari root) = gate manusia — build tidak push. Demo live (kriteria 1) baru terverifikasi setelah ini.
2. Merge PR Bio ke `master` = gate manusia — HANYA SETELAH #1 selesai (repo game live, `curl -fsSI` → 200; lihat Risiko 11); run "Deploy chat worker" paska-merge harus diawasi hijau (kriteria 15b).
3. Jalur evolusi (fase 2, di luar scope ini; jangan dikerjakan): replay UI pemain, flow-field, multiplayer lockstep.
4. CLAUDE.md masih mencatat invarian footer "Updated <bulan> <tahun>" yang basi (footer sudah tidak memuatnya) — memperbarui CLAUDE.md di luar scope change ini; keputusan lead/user terpisah.
5. TERSELESAIKAN oleh lead saat penerimaan plan: kriteria 9 "setara pendahulu" = CI menjalankan unit+smoke; screenshot gate dua-capture = gerbang lokal (lihat Risiko 7). Menaikkan screenshot ke CI hanya setelah terbukti stabil lintas mesin — keputusan lead terpisah, bukan scope build.

Status penerimaan: diterima user Fadhlillah 2026-09-24T07:38:39+07:00 sha256:27cc9d0e.
