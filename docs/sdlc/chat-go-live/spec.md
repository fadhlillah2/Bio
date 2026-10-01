# Spec — Chat bot "ask the CV" go-live di situs publik

Tanggal: 2026-09-21. Rantai: intent (DITERIMA user) → **spec ini** → plan → build → test → review.
Status: play spec SELESAI 2026-09-21 — 3 ronde, 0 material; adjudikasi lead §6; R8 dikonfirmasi user; play plan boleh jalan. Urutan kerja bukan milik berkas ini.

Rujukan intent: `docs/sdlc/chat-go-live/intent.md` (symlink → `memory/docs/sdlc/chat-go-live/intent.md`, gitignored).
Kebijakan project yang mengikat: `CLAUDE.md`, `.claude/rules/anti-fabrication.md`,
`.claude/rules/core-conventions.md`, `.claude/rules/guard-list.md`, `cv/README.md` bagian Rules.
`REVIEW.md` tidak ada di repo (diperiksa 2026-09-21) — rubrik = CLAUDE.md + rules di atas.
Register acuan: `memory/bio-chat-security-2026-09-21-VERIFIED-register.json` (R-01, R-05, CG-05),
`memory/bio-chat-worker-2026-09-21-VERIFIED-register.json` (KV-03, KV-04, PS/DRIFT),
`memory/bio-chat-auth-2026-09-21-VERIFIED-register.json`.
Data pendukung di folder yang sama: `probes-2026-09-21.md` (probe lead 2026-09-21 — pengukuran GLM
end-to-end; dipakai di R2/R3 dan OQ-1/OQ-2/OQ-3).

## 0. Kondisi awal yang jadi garis dasar (terverifikasi di tree, 2026-09-21)

- Widget + transport ada: `src/lib/components/ChatBot.svelte`, `src/lib/chat.js`.
  `PROD_ENDPOINT = ''` (`src/lib/chat.js:13`) → di luar localhost `resolveEndpoint()` mengembalikan
  `null`, widget tidak dirender; override `?chat=`/`localStorage` hanya berlaku di localhost.
- Backend worker lengkap dengan gerbang: `worker/chat.ts` + guard bersama `scripts/chat-core.ts`.
  `worker/wrangler.toml` memuat `[[kv_namespaces]] CHAT_KV` (id masih placeholder
  `PASTE_THE_ID_FROM_wrangler_kv_namespace_create`), binding edge `[[ratelimits]] RATE_LIMITER`
  (5/60 detik), `CHAT_ORIGINS = "https://fadhlillah2.github.io"`, dan `[vars]` provider yang belum
  produksi (`CHAT_API_URL = "https://api.deepseek.com"`, `CHAT_MODEL = "deepseek-chat"`).
- Konten worker di-generate: `scripts/chat-worker-build.ts` → `worker/content.generated.ts` dari
  `cv/resume-v8.10.txt` + `.opencode/agent/bio-guide.md`; `--check` sudah ikut `check:regressions`;
  `scripts/chat-proxy-selftest.ts` sudah mengimpor dan menguji `worker.fetch` in-process.
- CI Pages: `.github/workflows/deploy.yml` hanya build + deploy situs; tidak ada job worker.
- Docs: README "Deployment" menyatakan widget dev-only; `CLAUDE.md` nol kata "chat";
  `cv/README.md` Rules belum menyebut worker.
- Working tree: `M .gitignore` (baris `docs/sdlc`) + symlink `docs/sdlc` → `../memory/docs/sdlc`
  sudah ada; keduanya bagian dari change ini (intent A6), belum di-commit.
- Fakta situs yang jadi inti R-01 (terverifikasi grep hari ini):
  `src/lib/components/About.svelte:28` "Software Engineer — Fineksi";
  `Hero.svelte:59` "Fineksi" di proof-list; `Resume.svelte:25` `tl-org` Fineksi + `tl-dates`
  "Present"; `Portfolio.svelte:31` "Fineksi — Financial Document Processing";
  `HomeHead.svelte:37` JSON-LD `"worksFor": {"@type": "Organization", "name": "Fineksi"}`;
  `Services.svelte:64` "Freelance Availability: 40–60 hours/week · Jakarta (UTC+7).";
  `Skills.svelte:44` tag "Kubernetes". Keempat `cv/*.txt` nol memuat "Fineksi".

## 1. Persyaratan teknis (APA yang dibangun)

R1. **Widget publik menyala.** `PROD_ENDPOINT` di `src/lib/chat.js` diisi URL worker produksi
    (hasil deploy pertama), sehingga di `https://fadhlillah2.github.io/Bio/` widget dirender dan
    bisa ditanya. Sebelum itu nilainya tetap `''` dan situs tetap utuh tanpa chat. Komentar header
    `src/lib/chat.js:5-6` ("PROD_ENDPOINT is empty because no proxy is hosted yet… dev-only")
    ikut ditulis ulang saat konstanta diisi.

R2. **Provider produksi = GLM `glm-5.3-flash` via coding plan**
    (`https://open.bigmodel.cn/api/coding/paas/v4`), keputusan user 2026-09-21; risiko "kunci
    coding-plan pribadi yang dipakai kerja" sudah disampaikan dan diterima. `wrangler.toml`
    `[vars]` disetel ke provider itu — nilai provider bukan secret dan boleh di-commit.
    Hasil probe 2026-09-21 (`probes-2026-09-21.md`): `max_tokens: 700` cukup (puncak 389 token
    completion, `content` tidak pernah kosong), dan mengirim `thinking: {type:"disabled"}` untuk
    endpoint bigmodel membuat jawaban 2–3× lebih cepat (~3–5 dtk) dan ~4× lebih hemat token dengan
    `content` tetap non-kosong; parameter khusus bigmodel itu tidak boleh dikirim ke endpoint lain.
    **Amandemen user 2026-09-23 (plan.md D10):** provider produksi pindah ke gateway **OpenCode Go**
    `https://opencode.ai/zen/go/v1` (kunci `opencode-go`), bukan endpoint bigmodel langsung — kuota
    situs publik diambil dari plan OpenCode Go, bukan GLM coding plan; model tetap `glm-5.3-flash`,
    aturan `thinking` (R2 di atas) tetap berlaku apa adanya untuk endpoint bigmodel.

R3. **Grounding diperluas: CV + fakta situs yang sudah terbit.** Minimal (default, penutup R-01):
    - Fineksi sebagai tempat kerja sekarang: role/org/tanggal sebagaimana komponen menyatakannya
      (`About`, `Hero` proof-list, `Resume` timeline, kartu `Portfolio`, JSON-LD `worksFor`);
    - ketersediaan freelance "40–60 hours/week · Jakarta (UTC+7)" dari `Services.svelte:64`;
    - tag `Kubernetes` dari `Skills.svelte:44`.
    Cakupan lain (Facts/Services/Testimonials penuh, `scripts/og/cover.html`) hanya bila OQ-4
    diputuskan lain. Bukti langsung dari probe: bot hari ini menjawab "doesn't state his weekly
    hours" dan "Kubernetes isn't mentioned in his CV" — keduanya terbit di situs.

R4. **Grounding tambahan di-generate, bukan ditulis tangan.** Sumber = komponen Svelte yang sama
    yang dirender situs + `cv/resume-vX.Y.txt` + `.opencode/agent/bio-guide.md`. Pola yang sudah
    ada dipertahankan (`scripts/chat-worker-build.ts:4-6`): proxy dev membaca sumber langsung
    (CV + komponen + agent) — seperti sekarang, sekali saat startup (`scripts/chat-proxy.ts:169`),
    jadi edit sumber terbaca setelah proxy di-restart — worker membaca artefak
    tergenerate `worker/content.generated.ts`, dan gerbang `--check` di `check:regressions`
    membuktikan keduanya identik — komponen/CV/agent berubah tanpa regen ⇒ gate gagal dengan pesan
    `bun run chat:worker:build`. Ekstraktor fakta situs = satu fungsi yang dipakai proxy maupun
    generator, sehingga teks grounding kedua backend byte-identik (AC-10).

R5. **Anti-fabrikasi tidak dilonggarkan.** Fakta situs masuk grounding sebagai frasa yang sudah
    dirender komponen (tanpa klaim baru, tanpa penggabungan angka, tanpa verb yang diperkuat).
    `.opencode/agent/bio-guide.md` menyesuaikan definisi CONTEXT (kini CV + fakta situs), dan
    header prompt bersama di `scripts/chat-core.ts` (`buildPrompt`, baris "CONTEXT — Fadhlillah's
    current CV…") ikut diubah menjadi "CV + fakta yang sudah terbit di situs" dengan blok CV dan
    blok fakta situs dipagari terpisah berlabel beda — supaya model tidak mengatributkan fakta
    site-only ke dokumen CV. Larangan menebak, aturan kutip-metrik-persis, aturan bahasa pengunjung, dan pagar prompt-injection
    tetap utuh. Kutipan kontak publik dari baris kontak CV (email/WhatsApp) bukan pelanggaran.
    Aturan mirror cv/ tidak berubah: Fineksi tetap site-only, tidak masuk `cv/*.txt`
    (change terpisah, tidak dipilih).

R6. **Deploy worker lewat GitHub Actions.** Push ke `master` yang mengubah bundle worker —
    termasuk regenerasi konten saat CV bump — men-deploy worker tanpa langkah manual. Job berjalan
    hanya setelah dua prasyarat hijau — (a) gerbang konten `chat:worker:build --check` dan (b)
    selftest penjaga worker `scripts/chat-proxy-selftest.ts` (mengimpor `worker/chat.ts`, memanggil
    `worker.fetch` in-process — mengunci origin/HMAC/kuota); regresi guard yang membuat selftest
    merah ⇒ job gagal sebelum langkah deploy, sehingga worker publik tidak pernah ter-deploy di
    belakang gerbang yang lebih lemah dari gerbang Pages (batasan intent: "gerbang yang ada tidak
    dilemahkan"). Keduanya sudah ada di `check:regressions` yang dijalankan `validate:ci`.
    Kredensial Cloudflare
    (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) dan secret worker (`CHAT_API_KEY`,
    `CHAT_SIGNING_KEY`, opsional `CHAT_TOKEN`) hidup sebagai GitHub secrets — nilai secret worker
    disalin ke Cloudflare oleh job lewat `secrets:`/`env:` `cloudflare/wrangler-action@v4`
    (`wrangler secret put`; README action dibaca 2026-09-21, `probes-2026-09-21.md`), jadi nol
    langkah wrangler manual selain membuat KV namespace sekali. Tidak ada nilai secret di repo.
    Pemicu default (OQ-5, keputusan lead): push `master` yang menyentuh `worker/**`,
    `scripts/chat-core.ts`, `scripts/chat-worker-build.ts`, atau sumber grounding, plus
    `workflow_dispatch`. Job ini terpisah dari job Pages dan tidak boleh menggagalkan/terganggu
    olehnya.

R7. **Kuota harian per pemanggil (temuan KV-03).** Selain kuota global (default 200/hari) dan rate
    limit edge 5/menit per IP, satu pemanggil tidak boleh bisa menghabiskan jatah seluruh situs:
    ada batas harian per pemanggil yang menolak pemanggil itu saja sampai hari UTC berganti,
    sementara pemanggil lain tetap dilayani. Default (OQ-6, keputusan lead): 20 jawaban per
    pemanggil per hari UTC (≈10 % kuota global), var worker `CHAT_DAILY_PER_CALLER`, terdokumentasi
    di `wrangler.toml` + README; plan boleh mengubah angkanya dengan alasan tertulis.

R8. **Disclosure di panel (temuan R-05 / CG-05).** Panel memuat satu kalimat yang menyatakan
    jawaban dihasilkan model AI dan teks pengunjung dikirim ke penyedia model pihak ketiga; kalimat
    pembuka yang lama (jaminan kategoris "Anything it cannot source, it says so instead of
    guessing.") diganti wording deskriptif yang tidak menjanjikan. Nama model di header tetap
    ditampilkan. Kalimat itu copy UI widget, bukan klaim tentang Fadhlillah — intent C3 mengikat
    wording klaim (fakta/metrik) — dan "Answers come from the CV on this site" memang tidak lagi
    benar setelah R3, jadi harus berubah; penggantian ini DIKONFIRMASI user 2026-09-21
    ("Setuju, ganti") — bukan lagi pertanyaan terbuka.

R9. **Semua kontrol yang sudah ada tetap berlaku di produksi** — tidak dilemahkan, tidak dihapus:
    Origin allowlist = origin situs saja (`DEV_ORIGINS` tidak pernah di-union di deployment), rate
    limit edge per IP, kuota harian, HMAC giliran `assistant` + demosi giliran palsu, `clampReply`
    sebelum menandatangani, batas body 413 sebelum parse, gerbang konfigurasi fail-closed yang
    dievaluasi di atas `/health`.

R10. **Situs utuh tanpa worker (fail-safe).** `PROD_ENDPOINT` kosong, `/health` gagal/non-ok,
    atau worker belum ada ⇒ widget tidak dirender, nol console error; prerender `build/index.html`
    tetap tanpa markup chat. Urutan rilis terbalik (PROD_ENDPOINT dulu, worker belakangan) tidak
    merusak situs.

R11. **Kill switch cepat.** Mematikan fitur = kosongkan `PROD_ENDPOINT` (rebuild) atau hapus
    worker (probe gagal ⇒ widget hilang sendiri). Tidak ada flag runtime baru (A9).

R12. **Higiene repo.** Nol dependency runtime baru di situs; nol API key/session di klien; widget
    tetap CSS-native; berkas yang di-commit tidak memuat path internal, id akun, atau nilai secret
    (id KV namespace bukan secret dan boleh ada di `wrangler.toml`); commit tanpa trailer
    `Co-Authored-By`, subjek ≤72 karakter.

R13. **Non-goal.** Tidak ada perubahan wording klaim di komponen situs maupun `cv/*.txt` dalam
    change ini (kecuali kalimat panel R8); tidak mengganti backend contact form (FormSubmit,
    settled); tidak menyentuh route writeup (widget tetap hanya home, A1); tidak menghapus atau
    melemahkan gerbang lama.

R14. **Dokumen hidup mengikuti kode.**
    - `README.md` bagian Deployment: worker ter-deploy otomatis via Actions pada push `master`,
      daftar secret GitHub + secret worker, provider/model produksi, dan kill switch;
      frasa "dev-only" yang basi diperbarui — termasuk komentar `bun run chat` di bagian Local
      Development (`README.md:63`) dan komentar header `src/lib/chat.js:5-6` (R1).
    - `CLAUDE.md`: menyebut chat (perintah `bun run chat` / `bun run chat:worker` dan pekerjaan
      worker) — minimal tidak lagi nol kata "chat" — dan satu bullet di bagian Arsitektur untuk
      workflow deploy worker (pemicu, secret, gerbang pra-deploy), mengikuti konvensi bullet
      `deploy.yml` yang sudah ada.
    - `cv/README.md` Rules: pada bump CV, worker chat ikut ter-redeploy otomatis oleh CI dan
      gerbang `chat:worker:build --check` menahan bundle basi.
    - `CLAUDE.md` bagian Memory: menyebut `docs/sdlc` → `memory/docs/sdlc` (pola sama dengan
      `docs/superpowers`) sebagai rumah artefak rantai SDLC.
    - Koreksi klaim belanja (probe Q2): `README.md:78` ("a fresh provider key, scoped with a spend
      cap") dan komentar `worker/wrangler.toml:33-38` ("the spend cap you set on CHAT_API_KEY")
      diganti dengan batas yang benar-benar ada — kredit plan-wide GLM (5 jam + mingguan) di atas
      kuota harian worker + rate limit edge; kunci coding-plan tidak bisa di-mint dengan spend cap
      per kunci.

R15. **Gate BERHENTI.** Push, deploy, pembuatan KV/secret, dan edit setting repo GitHub tetap
    tindakan user atas perintah eksplisit; rantai ini hanya menyiapkan kode, workflow, dan
    checklist langkah user. `bun run validate:ci` tetap hijau.

## 2. Behavior yang diharapkan (permukaan teramati)

B1. **Happy path (pengunjung situs live).** Buka home → tombol chat tampil → panel terbuka
    (fokus ke input) → bertanya → jawaban 2–5 kalimat prosa, bersumber dari CONTEXT (CV + fakta
    situs), bahasa mengikuti bahasa pengunjung; lanjutan percakapan multi-turn berjalan; `Escape`
    menutup panel dan mengembalikan fokus ke tombol.

B2. **Konsistensi dengan halaman (inti R-01).** "Where does he work now?" ⇒ Fineksi (bukan
    menyangkal atau menjawab FOX saja); "Is he available for freelance work?" ⇒ 40–60 hours/week;
    "Does he know Kubernetes?" ⇒ ya. Bot tidak menggabung angka, tidak memperkuat verb, tidak
    menaikkan cakupan klaim.

B3. **Di luar grounding.** Pertanyaan yang tidak tersumber ⇒ satu kalimat jujur tidak tahu +
    arahkan ke bagian kontak/CV; tidak menebak.

B4. **Giliran assistant tepercaya hanya bila bertanda.** Balasan `>2000` karakter dipotong
    sebelum ditandatangani, sehingga giliran berikutnya tetap dikenali sebagai `assistant` (tidak
    didemosikan, tidak "menyangkal jawabannya sendiri"). Giliran `assistant` dari klien tanpa
    `sig` yang cocok didemosikan menjadi `user` + dicatat.

B5. **Gerbang pemanggil.** Origin absen, origin asing, atau variasi (huruf besar/trailing slash)
    ⇒ 403 di `/health` maupun `/chat`, respons tanpa header `access-control-*`. Hanya origin situs
    yang mendapat CORS, termasuk preflight `OPTIONS` dengan `authorization, content-type`.

B6. **Batas.** Melebihi rate limit per IP ⇒ 429 ("Too many questions — up to 5 per minute.").
    Kuota harian global habis ⇒ 503 dengan pesan mengarahkan ke bagian kontak. Kuota harian
    per pemanggil habis ⇒ pemanggil itu ditolak (pesan jelas, bukan 200), pemanggil lain tetap
    dilayani. Body `content-length` > 128 KB ⇒ 413 sebelum parse; body JSON rusak ⇒ 400; tidak ada
    panggilan provider untuk keduanya.

B7. **Provider gagal/timeout.** Worker menjawab 502 `{"error":"The model did not answer."}` tanpa
    detail internal/body provider; jawaban parsial tidak pernah disajikan; widget menampilkan baris
    galat, sisa halaman tetap berfungsi. Konfigurasi setengah jadi (KV/API key/signing key hilang
    atau lemah) ⇒ `/health` bukan 200 ⇒ widget tidak dirender di mana pun (fail-closed).

B8. **Bump CV tidak menghasilkan worker basi.** Setelah `cv/resume-vX.Y.txt` berubah dan di-regen,
    gate konten gagal sampai regen dijalankan; setelah push, job CI men-deploy worker versi baru
    tanpa langkah manual — worker yang sudah ter-deploy tidak diam-diam melayani CV lama.

B9. **Tanpa JS / tanpa backend.** Tanpa JS tidak ada chat (enhancement), halaman tetap terbaca
    penuh; tanpa backend nol markup chat dan nol request ke worker selain probe `/health`
    (timeout 2 dtk) saat `PROD_ENDPOINT` terisi.

## 3. Acceptance criteria (dapat diperiksa satu per satu)

Tag: [L] = dapat diperiksa lokal sebelum push; [P] = baru dapat diperiksa setelah langkah user
(deploy/secret) — bukan target test-play lokal.

AC-01 [L] `bun run build` menghasilkan `build/index.html` tanpa markup chat (grep
    `chat-fab|chat-panel|ask the CV` = 0 hit) saat `PROD_ENDPOINT` kosong.
AC-02 [L] Dengan `PROD_ENDPOINT`/override menunjuk URL mati, probe gagal ⇒ nol markup chat,
    nol console error, halaman lain utuh (uji browser lokal).
AC-03 [L] Happy path terhadap worker runner lokal (`bun run chat:worker` + kunci provider):
    `GET /health` dengan `Origin: https://fadhlillah2.github.io` ⇒ 200 `{"ok":true,"model":...}`;
    tiga pertanyaan R-01 (Fineksi / availability / Kubernetes) ⇒ jawaban non-kosong 2–5 kalimat
    yang konsisten dengan komponen situs (OQ-3: `max_tokens` 700 cukup — bukti probe: puncak 389
    token completion).
AC-04 [L] Origin: absen/asing ⇒ 403 di `/health` dan `/chat` tanpa header CORS; preflight hanya
    mengizinkan origin situs.
AC-05 [L] Kuota: burst >5/menit per IP ⇒ 429; kuota harian global kecil (uji) habis ⇒ 503
    mengarahkan ke kontak; **per-pemanggil**: pemanggil A (satu `cf-connecting-ip`) menghabiskan
    jatah hariannya ⇒ A ditolak sampai hari UTC berganti, pemanggil B tetap 200. Angka default
    per-pemanggil ada sebagai var worker dan terdokumentasi.
AC-06 [L] Binding edge `[[ratelimits]]` tetap ada di `wrangler.toml` dan jalur itu yang dipakai
    saat binding tersedia (bukan diganti hitungan KV).
AC-07 [L] Balasan > `MAX_CHARS` (2000) tetap kembali sebagai giliran `assistant` pada request
    berikutnya (assert di selftest); giliran `assistant` tanpa `sig` cocok didemosikan + warning.
AC-08 [L] `content-length` > 128 KB ⇒ 413 sebelum parse; JSON rusak ⇒ 400; tidak ada panggilan
    provider pada kedua kasus; pesan galat tidak memantulkan detail internal.
AC-09 [L] Gerbang drift konten: mengubah `cv/resume-v8.10.txt` atau string fakta situs di
    komponen tanpa regen ⇒ `bun run check:regressions` gagal dengan instruksi
    `bun run chat:worker:build`; setelah regen ⇒ hijau. Artefak tergenerate memuat fakta R-01
    verbatim dari komponen dan aturan bio-guide terbaru.
AC-10 [L] Grounding dev dan worker identik: teks CONTEXT dari `scripts/chat-proxy.ts` dan
    `worker/chat.ts` byte-identik (di-assert selftest), keduanya memuat CV current + fakta situs.
AC-11 [L] `bun run validate:ci` exit 0; `check:regressions` memuat selftest chat (proxy + worker)
    dan `chat:worker:build --check`; tidak ada gerbang lama yang dihapus/dilemahkan.
AC-12 [L] Panel memuat kalimat disclosure AI + pihak ketiga; kalimat pembuka bukan jaminan lagi;
    nama model tetap tampil; jalur render jawaban tetap escape (nol `{@html}` di jalur chat).
AC-13 [L] Anti-fabrikasi: diff tidak mengubah teks klaim di komponen selain kalimat panel dan
    tidak menyentuh `cv/*.txt`/`cv/*.pdf`; grounding tidak menambah klaim di luar frasa komponen;
    larangan menebak di `bio-guide.md` tetap ada; header CONTEXT di `scripts/chat-core.ts` menyebut
    CV + fakta situs, bukan CV saja (R5).
AC-14 [L] Docs: README Deployment memuat (automated worker deploy, secret GitHub + worker,
    provider/model produksi, kill switch); nol sisa frasa "dev-only" yang basi di `README.md`
    (termasuk baris `bun run chat`) dan di komentar header `src/lib/chat.js`; `CLAUDE.md`
    menyebut chat + bullet Arsitektur workflow deploy worker; `cv/README.md` Rules memuat
    bump CV ⇒ worker redeploy otomatis + gerbangnya; `CLAUDE.md` bagian Memory menyebut
    `docs/sdlc` → `memory/docs/sdlc`; `README.md:78` dan komentar
    `worker/wrangler.toml:33-38` menyatakan batas belanja riil (kredit plan-wide GLM, kuota harian
    worker, rate limit edge) tanpa klaim "spend cap per kunci" (probe Q2).
AC-15 [P] Worker ter-deploy: push `master` yang menyentuh bundle worker ⇒ job Actions hijau dan
    log job menunjukkan prasyarat konten **dan** selftest penjaga worker lulus sebelum langkah
    deploy; regresi guard di `worker/chat.ts` yang lolos `--check` konten tetapi membuat selftest
    merah ⇒ job gagal sebelum deploy (worker lama tetap melayani; tidak ada worker rusak yang
    terbit); `GET /health` dari origin situs ⇒ 200; dari origin lain ⇒ 403.
AC-16 [P] Situs live dengan `PROD_ENDPOINT` terisi ⇒ widget tampil dan menjawab; kill switch
    (hapus worker atau kosongkan `PROD_ENDPOINT`) ⇒ widget hilang, situs utuh, nol console error.
AC-17 [P] Bump CV berikutnya ⇒ worker ter-redeploy otomatis tanpa langkah manual (terbukti dari
    log job).
AC-18 [L] Permintaan ke endpoint GLM menyertakan `thinking: {type:"disabled"}` (atau setelan
    setara yang terbukti) dan parameter khusus bigmodel tidak dikirim ke endpoint non-GLM —
    diperiksa dari payload yang ditangkap (mock fetch in-process); efek terukur mengikuti probe:
    latensi ~3–5 dtk, completion ≤ ~110 token untuk tiga pertanyaan R-01, `content` tetap
    non-kosong.
AC-19 [L] Definisi workflow job deploy worker menjalankan selftest penjaga worker (atau
    `check:regressions`) sebagai prasyarat sebelum langkah deploy — diperiksa dari berkas
    workflow; gerbang konten saja (tanpa selftest) bukan implementasi yang sah.

Pemetaan temuan → AC: R-01 → AC-03/AC-09/AC-10/AC-13; R-05+CG-05 → AC-12; KV-03 → AC-05;
worker-basi → AC-09/AC-17; fail-safe → AC-01/AC-02; docs (termasuk koreksi klaim belanja, OQ-2) → AC-14; OQ-3/probe → AC-03/AC-18;
    gerbang deploy worker → AC-15/AC-19.

## 4. Asumsi

A1–A6 dibawa apa adanya dari `intent.md` (widget hanya home; batas produksi 5/menit per IP +
200/hari plus kunci per-pemanggil; panel AI + pihak ketiga dengan nama model tetap; job deploy
terpisah memakai `cloudflare/wrangler-action` + secret `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`
dengan `chat:worker:build --check` sebelum deploy; urutan rilis worker dulu baru `PROD_ENDPOINT`;
symlink `docs/sdlc` + baris `.gitignore` bagian change ini).

Catatan: A4 hanya membawa gerbang konten `chat:worker:build --check` sebelum deploy; R6
memperkuatnya dengan selftest penjaga worker sebelum langkah deploy — `--check` hanya menjaga
konten tergenerate dan tidak menangkap regresi guard di `worker/chat.ts`, sedangkan job worker yang
berjalan sejajar job Pages tidak boleh men-deploy di belakang gerbang yang lebih lemah dari gerbang
Pages.

A7. Cakupan default "fakta situs" = hanya yang menutup R-01 (Fineksi, availability, tag
    Kubernetes); `scripts/og/cover.html` bukan sumber grounding (bukan halaman yang dibaca
    pengunjung).
A8. Worker tetap nol dependency runtime/CLI: bundel wrangler atas `worker/chat.ts` +
    `scripts/chat-core.ts`, grounding ikut di-inline saat build; tidak ada opencode/auth.json di
    host publik.
A9. Kill switch = `PROD_ENDPOINT`/hapus worker; tidak ada flag runtime baru di change ini.
A10. Uji jalur worker lokal memakai `bun run chat:worker` (KV in-memory) dan impor `worker.fetch`
    in-process — pola yang sudah ada di `scripts/chat-proxy-selftest.ts`, diperluas bila perlu.
A11. Fineksi tetap site-only (tidak masuk `cv/*.txt`) sampai change terpisah dipilih user.

## 5. Pertanyaan terbuka

OQ-1 (dibawa; probe 2026-09-21: `wrangler` tidak terpasang dan tidak ada state login — subdomain
    hanya bisa dibaca user dari dashboard Cloudflare atau `bunx wrangler whoami` setelah login).
    URL worker `https://bio-chat.<subdomain>.workers.dev` — dibutuhkan untuk mengisi `PROD_ENDPOINT`,
    diisi setelah deploy pertama.
OQ-2 (dibawa; TERJAWAB oleh probe 2026-09-21 Q2). GLM coding-plan: tidak ada kunci terpisah
    ber-spend-cap per kunci — batasnya plan-wide (5 jam + mingguan; `https://docs.z.ai/devpack/
    overview`). Satu-satunya batas belanja = kredit plan-wide + kuota harian worker + rate limit
    edge; kap KV bukan kap keras (burst bisa lolos, KV-01). Kredit 5-jam habis ⇒ worker 502.
    Kalimat "spend cap per kunci" di `README.md:78` / `worker/wrangler.toml:33-38` wajib
    dikoreksi (R14/AC-14).
OQ-3 (dibawa; TERJAWAB sebagian oleh probe 2026-09-21). `max_tokens: 700` cukup: puncak 389 token
    completion di tiga pertanyaan R-01, `content` tidak pernah kosong — margin tipis untuk
    pertanyaan panjang/multi-turn. Rekomendasi probe (dibawa sebagai R2/AC-18): `thinking:
    {type:"disabled"}` untuk GLM. Sisa terbuka: pastikan parameter itu hanya dikirim ke endpoint
    yang mendukungnya; kalau margin token tipis, naikkan `max_tokens`.
OQ-4 (dibawa). Cakupan "fakta situs": cukup penutup R-01 (default), atau ikut Facts/Services/
    Testimonials penuh?
OQ-5 (dibawa; DEFAULT DITETAPKAN lead di R6). Pemicu = push `master` yang menyentuh `worker/**`,
    `scripts/chat-core.ts`, `scripts/chat-worker-build.ts`, sumber grounding + `workflow_dispatch`;
    secret worker diisi job dari GitHub secrets (`wrangler-action` `secrets:`). User boleh
    mengubah keduanya sebelum play build.
OQ-6 (baru; DEFAULT DITETAPKAN lead di R7). 20 jawaban/pemanggil/hari UTC via
    `CHAT_DAILY_PER_CALLER`; plan boleh mengubah dengan alasan tertulis.
OQ-7 (baru). Apakah panel juga memuat tautan kontak/koreksi (mitigasi R-05) atau cukup kalimat
    disclosure? Default: kalimat A3 saja.
OQ-8 (baru; DIPUTUSKAN lead: di luar scope). Penanda versi konten di `/health` tidak dikerjakan —
    kebasian worker ditutup job CI (R6/AC-17) + `deployment-url`/log job; hash = nice-to-have
    non-scope, tanpa padanan di intent.

## 6. Adjudikasi lead (2026-09-21, setelah 2 ronde pembantah)

Ronde 2 pembantah kebijakan menandai satu temuan material (README/wrangler.toml masih menjanjikan
"spend cap per kunci" yang deployment GLM tidak bisa penuhi); perbaikan r2 menutupnya (R14 butir
koreksi klaim belanja, AC-14, OQ-2) — dicek ulang pembantah kebijakan ronde 3. Lima temuan minor
diterapkan lead:
1. R8 mengganti kalimat pembuka panel (perluasan C3) — dipertahankan dengan alasan di R8;
   DIKONFIRMASI user 2026-09-21.
2. OQ-8 diberi keputusan: non-scope.
3. R4 disesuaikan ke pola yang ada (proxy baca sumber langsung sekali saat startup, worker baca
   artefak, `--check` menjaga), bukan satu artefak untuk kedua backend.
4. R5/AC-13 menambah header CONTEXT `scripts/chat-core.ts`.
5. R14/AC-14 menambah `CLAUDE.md` Memory → `docs/sdlc`.
Ditambah default lead untuk OQ-5 (pemicu job + secret via GitHub) dan OQ-6 (20/pemanggil/hari).
Ronde 3 (pembantah kebijakan, konteks segar): 0 material; 4 minor baru diterapkan lead — R4
dikoreksi (proxy membaca CV sekali saat startup, bukan per request), R14/AC-14 menambah
`README.md:63` "dev-only", komentar header `src/lib/chat.js:5-6`, dan bullet Arsitektur CLAUDE.md
untuk workflow deploy worker.
