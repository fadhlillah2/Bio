# Review sdlc-deploy — chat go-live

Dibuat oleh: sdlc-deploy review, args root/change/base = . / chat-go-live / master, model pelaksana glm-5.3, 2026-09-23T00:23:17+07:00, dilepas oleh: Fadhlillah, skrip: sdlc-deploy.js sha256 fc86b244, sha256 pendek CLAUDE.md edcbc7ee, REVIEW.md tidak ada.

## Diff yang direview

`master` → HEAD `6ea9fbabd0b51b7576134394c8d2e602e3d47be2` (`git rev-parse HEAD`; merge-base `f032b589`). 19 commit, 15 berkas, +956/−60 — inti perubahan: `worker/chat.ts`, `worker/wrangler.toml`, `worker/content.generated.ts` (routing produksi ke gateway OpenCode Go), `.github/workflows/deploy-worker.yml` (workflow deploy worker via Actions), `scripts/chat-proxy-selftest.ts` + `scripts/chat-core.ts` + `scripts/chat-proxy.ts` + `scripts/chat-worker-build.ts` + `scripts/chat-worker-dev.ts`, `src/lib/components/ChatBot.svelte`, `docs/sdlc/chat-go-live/plan.md`, `README.md`, `cv/README.md`, `.gitignore`, `.opencode/agent/bio-guide.md`.

## Pass yang tidak pulang hasil

[]

## Simpangan dari rubrik REVIEW.md project

[] — REVIEW.md tidak ada di repo; rubrik bawaan tiga pass kit (bug/keamanan/kepatuhan) yang dipakai, tidak ada simpangan yang dilaporkan pass.

## Laporan terpotong

[]

## Temuan

Hitungan: blocker/major/minor/nit = 0/0/7/2 terkonfirmasi (mentah 10, digabung 1, terbantah 0, belum dibantah 0)

### Temuan terkonfirmasi

**T1 · minor · pass: bug · worker/chat.ts:168**

Klaim: `new URL(endpoint)` dievaluasi di luar blok try, sehingga `CHAT_API_URL` yang tidak valid membuat handler `worker.fetch` reject dengan TypeError taktertangkap (di Cloudflare = respons 500 non-JSON) SETELAH kuota harian per-pemanggil dan global dipotong; sebelum perubahan, URL yang sama sampai ke `fetch()` di dalam try dan dijawab 502 `{"error":"The model did not answer."}`, dan `/health` tetap 200 karena gerbang konfigurasi tidak memvalidasi URL — merusak janji fail-closed spec B7 untuk kelas misconfig ini.

Evidence: Repro in-process (bun, worker.fetch dengan env `CHAT_API_URL="not-a-url"`): `invalid-url => UNCAUGHT THROW: TypeError "not-a-url/chat/completions" cannot be parsed as a URL.`; `CHAT_API_URL="  "` juga THROW `TypeError "  /chat/completions" cannot be parsed as a URL.`; kedua kuota (baris 159 dan 162) sudah di-charge sebelum baris 168. Kode: `const bigmodel = new URL(endpoint).hostname.endsWith('bigmodel.cn');` berada sebelum `try {` di baris 169.

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

**T2 · minor · pass: keamanan · .github/workflows/deploy-worker.yml:68**

Klaim: Aksi pihak ketiga dipin dengan tag mutable (`cloudflare/wrangler-action@v4`, juga `actions/checkout@v6` dan `oven-sh/setup-bun@v2`) pada workflow yang memegang `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CHAT_API_KEY`, dan `CHAT_SIGNING_KEY` — tag yang ditukar penyusup menjalankan kode arbitrary dengan keempat secret itu; pin ke commit SHA akan menutupnya.

Evidence: Line 68: `uses: cloudflare/wrangler-action@v4` dengan `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}` (step Deploy, lines 67-79). Catatan: workflow Pages eksisting `.github/workflows/deploy.yml` memakai konvensi tag yang sama (@v6/@v5/@v2/@v4), jadi ini pengerasan konsisten dengan konvensi repo, bukan regresi.

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

**T3 · minor · pass: keamanan · worker/chat.ts:159**

Klaim: Kuota harian per-caller baru menyimpan alamat IP pengunjung sebagai key KV plaintext `caller:<utcDay>:<ip>` dengan TTL 172800 detik (48 jam) — retensi data pribadi yang tidak disebut disclosure panel baru (`ChatBot.svelte` hanya mengungkapkan pertanyaan dikirim ke penyedia model pihak ketiga).

Evidence: `if (!(await countDay(env.CHAT_KV, `caller:${utcDay(Date.now())}:${caller}`, dailyPerCaller)))]` dengan countDay menulis `kv.put(key, ..., { expirationTtl: 172_800 })`; caller = `request.headers.get('cf-connecting-ip')` (line 124). Pola serupa sudah ada di fallback `rate:` line 129, jadi ini perluasan pola eksisting, bukan regresi.

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

**T4 · minor · pass: kepatuhan (juga_dari: bug) · worker/chat.ts:68**

Klaim: Komentar countDay masih menyebut "GLM coding plan's plan-wide credits" sebagai ceiling belanja produksi, padahal amandemen D10 (produksi pindah ke gateway OpenCode Go) mensyaratkan komentar ikut menyebut OpenCode Go sebagai langganan pembatas belanja — header file (baris 7) dan `worker/wrangler.toml` sudah sesuai, baris ini tertinggal tidak konsisten; regex selftest `/spend[- ]cap|capped|cap set on the API key/i` tidak menangkapnya.

Evidence: `worker/chat.ts:68`: " * the real ceilings on spend are the GLM coding plan's plan-wide credits (5-hour + weekly) over" — bandingkan `worker/chat.ts:7` "OpenCode Go plan's quota plus this worker's daily quotas" dan `plan.md` D10: "Docs/wrangler/komentar ikut menyebut OpenCode Go sebagai langganan pembatas belanja."

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

**T5 · minor · pass: kepatuhan · worker/wrangler.toml:17**

Klaim: `namespace_id` binding `[[ratelimits]]` bernilai `"1001"` (nilai contoh dokumentasi, bukan id namespace akun; sama pra-ada di master) — preflight workflow hanya memeriksa placeholder KV (`PASTE_THE_ID_FROM_wrangler_kv_namespace_create`) dan daftar setup sekali-jalan di README/plan §7 tidak menyebut pembuatan namespace rate-limit, jadi bila id ini ditolak wrangler, deploy pertama gagal di step Deploy setelah preflight hijau; kevalidan nilai ini terhadap wrangler belum diverifikasi.

Evidence: `worker/wrangler.toml:17`: `namespace_id = "1001"` (dalam blok `[[ratelimits]] name = "RATE_LIMITER"`); `.github/workflows/deploy-worker.yml` preflight hanya: `if grep -q PASTE_THE_ID_FROM_wrangler_kv_namespace_create worker/wrangler.toml`; README "One-time setup" hanya memuat KV namespace + 4 GitHub secrets.

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

**T6 · minor · pass: kepatuhan · docs/sdlc/chat-go-live/spec.md:50**

Klaim: R2 spec masih menamai endpoint produksi `https://open.bigmodel.cn/api/coding/paas/v4` (GLM via coding plan), sedangkan diff mengarahkan produksi ke gateway OpenCode Go `https://opencode.ai/zen/go/v1` — deviasi ini disengaja dan terdokumentasi sebagai amandemen user 2026-09-23 di plan.md D10, tetapi spec.md internal tidak diberi penanda amandemen sehingga pembaca spec bisa menilai diff melanggar R2.

Evidence: `spec.md:50-53`: "R2. **Provider produksi = GLM `glm-5.3-flash` via coding plan** (`https://open.bigmodel.cn/api/coding/paas/v4`)" vs `worker/wrangler.toml`: `CHAT_API_URL = "https://opencode.ai/zen/go/v1"` dan `plan.md` D10: "provider produksi pindah ke gateway OpenCode Go ... (amandemen user 2026-09-23)".

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

**T7 · minor · pass: kepatuhan · docs/sdlc/chat-go-live/plan.md:350**

Klaim: Bukti [L] Lapis 2 — AC-02 (fail-safe widget di browser dengan kontrol stub hidup) dan AC-03 (happy-path tiga pertanyaan R-01 lewat endpoint produksi baru) — belum tercatat di artefak mana pun yang dibuka; D10 hanya mencatat probe 400-tanpa-header dan A/B 35 vs 39 completion token, bukan jawaban end-to-end; plan mensyaratkan keduanya dijalankan sebelum push.

Evidence: `plan.md:350`: "**Lapis 2 — bukti [L] di luar `validate:ci`:**" lalu "dua bukti [L] berikut wajib dijalankan terpisah sebelum push"; grep AC-02/AC-03 di luar plan.md/spec.md (docs/sdlc/, memory/docs/sdlc/) = nol hasil; selftest yang dijalankan hijau hanya membuktikan sisi mock.

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

**T8 · nit · pass: bug · scripts/chat-proxy-selftest.ts:308**

Klaim: Komentar blok test provider menyatakan "Production points at GLM's coding-plan endpoint" yang sudah tidak benar setelah amandemen D10 (produksi = `https://opencode.ai/zen/go/v1`, thinking tidak dikirim ke sana); assert di dalamnya tetap sah sebagai guard cabang bigmodel.

Evidence: `scripts/chat-proxy-selftest.ts:307-309`: `// The provider call itself. Production points at GLM's coding-plan endpoint, where the model / burns its completion budget on hidden reasoning unless \`thinking\` is explicitly disabled` vs `worker/wrangler.toml:30` `CHAT_API_URL = "https://opencode.ai/zen/go/v1"`.

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

**T9 · nit · pass: kepatuhan · worker/chat.ts:177**

Klaim: Header routing `x-opencode-session: bio-chat` dikirim tak bersyarat ke semua provider (jalur deepseek/endpoint non-gateway juga menerimanya), tidak digerbangkan hostname sebagaimana `thinking` di D7 — plan D10 tidak mewajibkan gerbang dan endpoint OpenAI-compatible mengabaikan header asing, jadi nol dampak; hanya inkonsistensi pola gating.

Evidence: `worker/chat.ts:170-177`: `headers: { 'content-type': ..., authorization: ..., 'x-opencode-session': 'bio-chat' }` — tanpa kondisi, sementara thinking digerbangkan: `const bigmodel = new URL(endpoint).hostname.endsWith('bigmodel.cn'); ...(bigmodel && { thinking: { type: 'disabled' } })`.

Alasan pembantah tidak membantah: tidak dibantah (minor/nit)

Penilaian lead: (berguna|derau) -

### Temuan terbantah

Tidak ada (0 temuan terbantah).

### Belum dibantah

Tidak ada (semua pembantah pulang hasil).
