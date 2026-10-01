# Intent — Chat bot "ask the CV" go-live di situs publik

Tanggal: 2026-09-21. Rantai SDLC: intent → spec → plan → build → test → review.
Status: DITERIMA user 2026-09-21 (percakapan sesi lead) — play spec boleh jalan.
Rumah artefak: `docs/sdlc/chat-go-live/` (symlink → `memory/docs/sdlc/chat-go-live/`, gitignored;
keputusan user 2026-09-21, pola sama dengan `docs/superpowers`). Satu sumber kebenaran = folder ini.

## Masalah

Widget chat "ask the CV" (`src/lib/components/ChatBot.svelte`, `src/lib/chat.js`) dan backend
serverless-nya (`worker/chat.ts`, guard bersama di `scripts/chat-core.ts`) sudah selesai dan
diserang 4 lensa/83 agent dua kali, tapi **belum pernah terbit**: `PROD_ENDPOINT` di
`src/lib/chat.js` kosong, jadi di luar localhost widget tidak dirender dan situs publik tidak
punya chat sama sekali. Yang menahan hanya langkah-langkah di luar repo (KV namespace, secret,
`wrangler deploy`) dan satu konstanta di repo.

Dua cacat yang terbawa kalau diterbitkan apa adanya:
- **R-01 (MEDIUM, register keamanan 2026-09-21)**: grounding bot = `cv/resume-v8.10.txt` saja,
  sehingga bot menyangkal atau diam soal fakta yang halaman tempat ia menempel sudah nyatakan
  (Fineksi di About/Hero/Resume/Portfolio/JSON-LD `worksFor`; "Freelance Availability: 40–60
  hours/week" di Services; Kubernetes di Skills).
- **Bundle worker meng-inline CV** (`worker/content.generated.ts`): tiap bump `cv/resume-vX.Y.txt`
  membuat worker yang sudah terdeploy basi sampai seseorang ingat me-redeploy.

## Hasil yang diinginkan

1. Pengunjung `https://fadhlillah2.github.io/Bio/` melihat tombol chat, bertanya, dan mendapat
   jawaban yang bersumber dari CV **dan** fakta yang sudah terbit di situs — tanpa kontradiksi
   dengan halaman itu sendiri.
2. Backend = Cloudflare Worker `worker/chat.ts` yang memanggil provider langsung. Provider produksi
   = **GLM `glm-5.3-flash` via coding plan** (`https://open.bigmodel.cn/api/coding/paas/v4`;
   keputusan user 2026-09-21 — risiko AC-06 "kunci = coding-plan pribadi yang dipakai kerja" sudah
   disampaikan dan diterima user).
3. **Deploy worker lewat GitHub Actions**: push ke `master` yang mengubah bundle worker (termasuk
   regenerasi konten saat CV bump) men-deploy worker tanpa langkah manual. Secret Cloudflare dan
   secret worker hidup di GitHub/Cloudflare, tidak pernah di repo.
4. Grounding tambahan (fakta situs) **di-generate dari sumber komponen Svelte yang sama**, bukan
   ditulis tangan, dan dijaga gerbang drift seperti `content.generated.ts` (`--check` di
   `check:regressions`). Backend dev (`scripts/chat-proxy.ts`) dan worker memakai grounding yang
   identik.
5. Situs tetap utuh tanpa worker: bila `/health` gagal atau worker belum ada, widget tidak dirender,
   nol console error, prerender `build/index.html` tetap tanpa markup chat.
6. Semua kontrol yang sudah ada tetap berlaku di produksi: Origin allowlist = origin situs saja,
   rate limit edge per IP, kuota harian, HMAC giliran assistant, `clampReply`, batas body 413,
   gerbang konfigurasi di atas `/health`.
7. Dokumen hidup mengikuti kode: README (bagian Deployment), `CLAUDE.md` (belum menyebut chat sama
   sekali), `cv/README.md` Rules (bump CV ⇒ worker ikut redeploy otomatis, sebutkan gerbangnya).

## User terdampak

- Pengunjung situs (recruiter, hiring manager, pemilik bisnis): dapat kanal tanya-jawab instan.
- Pemilik (Fadhlillah): menanggung biaya/kuota GLM dan reputasi atas jawaban bot; harus bisa
  mematikan fitur cepat (kill switch = kosongkan `PROD_ENDPOINT` atau hapus worker).
- Sesi/agent berikutnya: harus tahu bahwa bump CV kini punya efek samping deploy worker.

## Batasan

- **Anti-fabrikasi** (`.claude/rules/anti-fabrication.md`, `cv/README.md` Rules): fakta situs yang
  masuk grounding harus verbatim dari komponen sumbernya; bot dilarang menggabung angka, memperkuat
  verb, atau menaikkan cakupan klaim. Aturan agent `.opencode/agent/bio-guide.md` menyesuaikan
  (CONTEXT kini CV + fakta situs) tanpa melonggarkan larangan menebak.
- Nol dependency runtime baru di situs; nol API key di klien; widget tetap CSS-native.
- Tidak ada perubahan wording klaim di situs maupun `cv/*.txt` dalam change ini (Fineksi ke
  `cv/*.txt` = change terpisah, tidak dipilih user sekarang).
- `bun run validate:ci` tetap hijau; gerbang yang ada tidak dilemahkan.
- Gate BERHENTI berlaku: push, deploy, pembuatan secret/KV, dan edit setting repo GitHub =
  tindakan user atas perintah eksplisit; rantai ini menyiapkan kode, workflow, dan checklist-nya.
- Commit tanpa trailer; pesan subjek ≤72 karakter.
- Repo publik: tidak ada path internal, id akun, atau nilai secret di berkas yang di-commit
  (id KV namespace bukan secret dan boleh di `wrangler.toml`).

## Pertanyaan terbuka (belum dijawab, dibawa ke spec)

1. **URL worker** (`https://bio-chat.<subdomain>.workers.dev`): subdomain workers.dev akun user
   belum diketahui — dibutuhkan untuk `PROD_ENDPOINT`. Bisa diisi setelah deploy pertama.
2. **GLM coding-plan**: apakah kunci bisa di-mint terpisah dan diberi spend cap? Kalau tidak,
   satu-satunya batas belanja = kuota harian worker (KV, bukan cap keras) + rate limit edge.
3. **GLM + `max_tokens: 700`**: probe 21 Sep menunjukkan `content` kosong saat `max_tokens:16`
   karena `reasoning_content` memakan anggaran. Harus dibuktikan `700` cukup untuk jawaban 2–5
   kalimat pada model ini, atau angkanya dinaikkan.
4. **Cakupan "fakta situs"**: minimal Fineksi (role + kartu portfolio), availability 40–60 jam,
   tag Skills. Apakah Facts/Services/Testimonials ikut? Default: yang menjawab R-01 saja.
5. **Kapan job deploy worker jalan**: setiap push `master` yang menyentuh `worker/**` dan sumber
   grounding, atau setiap push (idempoten)? Termasuk apakah `wrangler deploy` juga mengisi secret
   worker dari GitHub secrets atau secret di-set sekali manual oleh user.

## Asumsi (draf lead; coret kalau tidak setuju)

- A1. Widget hanya di halaman home (`src/routes/+page.svelte`), bukan di route writeup — sama
  seperti sekarang.
- A2. Nilai batas produksi mengikuti `wrangler.toml` saat ini (5/menit per IP, 200/hari), plus satu
  kunci harian per pemanggil supaya satu pengunjung tidak bisa menghabiskan jatah seluruh situs
  (temuan KV-03).
- A3. Panel widget memuat satu kalimat pemberitahuan bahwa jawaban dihasilkan model AI dari CV dan
  teks pengunjung dikirim ke penyedia model pihak ketiga (temuan R-05 / CG-05); nama model di
  header widget tetap ditampilkan.
- A4. Deploy worker = job terpisah di `.github/workflows/` yang memakai `cloudflare/wrangler-action`
  dengan secret `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`; ia menjalankan gerbang
  `chat:worker:build --check` sebelum deploy.
- A5. Urutan rilis: worker terbit dulu (job CI, setelah user memasang secret), lalu commit yang
  mengisi `PROD_ENDPOINT` — karena widget fail-safe, urutan terbalik pun tidak merusak situs.
- A6. `docs/sdlc` symlink + baris `.gitignore` = bagian dari change ini (sudah dibuat 2026-09-21).
