# Pengukuran manual portfolio

## Baseline sebelum perubahan

- Dicatat: **2026-09-16 22:23:12 +07:00 (Asia/Jakarta)**.
- Commit: `47564d56a61786dcc6ff4270f0fe575117adb970`; worktree bersih saat pencatatan.
- Inspeksi source `src/`, `scripts/`, `package.json`, dan workflow tidak menemukan instrumentasi traffic atau event CTA. Ini bukan pemeriksaan dashboard eksternal.
- Kunjungan, sumber kunjungan, klik CV/contact, inquiry, interview, proposal, dan kontrak historis: **belum diketahui**. Tidak ada analytics atau catatan historis yang diberikan untuk baseline ini. Unknown bukan nol.
- Hasil cek teknis situs tidak mengukur minat recruiter atau calon klien. Belum ada bukti perubahan peluang atau konversi.

## Mulai mencatat

Salin `lead-log.template.csv` ke lokasi pribadi **di luar repository**. Template publik ini hanya berisi header; jangan masukkan nama, email, nomor telepon, isi percakapan, tautan privat, atau catatan lead nyata ke Git. Tidak perlu mengubah `.gitignore` jika salinan berada di luar repo.

Satu baris per peluang, gunakan ID anonim yang stabil. Perbarui baris yang sama saat tahap berubah; jangan menghitung satu percakapan berulang kali. Tanggal memakai `YYYY-MM-DD`, dengan acuan Asia/Jakarta. Kosong berarti belum diketahui, bukan nol atau penolakan.

Untuk mulai, cukup isi `lead_id`, `first_contact_date`, `audience`, `direction`, `source` (ketiganya boleh `unknown`), dan `stage`. Kolom lainnya opsional; lengkapi saat informasinya tersedia. Isi `last_updated_date` ketika memperbarui catatan.

| Kolom | Isi |
| --- | --- |
| `lead_id` | ID anonim, tanpa identitas orang/perusahaan |
| `first_contact_date`, `last_updated_date` | Tanggal kontak pertama dan pembaruan terakhir |
| `audience` | `hiring`, `freelance`, atau `unknown` |
| `direction` | `inbound` jika pihak lain memulai inquiry, `outbound` jika dimulai dari lamaran/outreach sendiri, atau `unknown`; tetap mengikuti asal peluang walau kemudian mendapat balasan |
| `source` | Sumber yang diketahui: lamaran, referral, LinkedIn, GitHub, situs, atau `unknown`; jangan menebak dari kanal kontak |
| `source_evidence` | Dasar atribusi singkat, misalnya kontak menyebut case study; tanpa data pribadi |
| `material` | Materi yang dibagikan/disebut: URL publik case study atau versi CV; kosong jika tidak diketahui |
| `fit` | `yes`, `no`, atau `unknown`: cocok dengan role/masalah yang benar-benar ingin ditangani |
| `fit_reason` | Alasan singkat berdasarkan kebutuhan yang diketahui, bukan jabatan kontak semata |
| `stage` | Tahap saat ini sesuai definisi di bawah |
| `outcome` | `open`, `won`, `lost`, `withdrawn`, atau `unknown` |
| `next_action_date` | Tanggal tindak lanjut yang direncanakan; kosong jika belum ada |

Tahap: `contacted` = lamaran/pesan pertama dikirim atau inquiry diterima; `conversation` = sudah ada respons substantif dua arah; `interview` = interview hiring sudah terjadwal/berlangsung; `discovery` = pembahasan kebutuhan freelance sudah terjadwal/berlangsung; `offer` = tawaran kerja diterima untuk dipertimbangkan; `proposal` = proposal freelance dikirim; `closed` = hasil final diketahui. Interview dan discovery tidak harus dilalui berurutan. `won` berarti tawaran kerja disetujui atau kontrak freelance disepakati, bukan sekadar respons positif. Tidak ada balasan tetap `open`/`unknown` sampai ada keputusan menutup peluang.

## Review mingguan

Catat rentang tanggal dan tanggal mulai pencatatan. Pisahkan hiring dan freelance. Hitung peluang baru, sumber yang diketahui/tidak diketahui, fit, tahap saat ini, serta hasil final dari log pribadi. Sebutkan jumlah data yang belum lengkap. Log satu baris per peluang menunjukkan kondisi terbaru, bukan riwayat transisi lengkap atau waktu antar-tahap.

Baca alasan fit dan bukti sumber sebelum memilih perubahan berikutnya. Jika memakai rasio, tampilkan pembilang, penyebut, periode, dan definisinya; jangan sebut rasio lead sebagai konversi pengunjung karena traffic tidak diukur. Jangan menyimpulkan materi baru menyebabkan peningkatan dari perbandingan kecil/sebelum-sesudah: volume distribusi, jenis lowongan, sumber lead, dan waktu dapat berubah bersamaan. Catat observasi dan hipotesis terpisah. Jangan mengisi bulan sebelum pencatatan dengan nol.

Pisahkan lamaran/outreach terkirim (`outbound`) dari inquiry masuk (`inbound`); outbound bukan incoming lead. Respons substantif tidak termasuk receipt otomatis. Interview, proposal, dan kesepakatan hanya dihitung jika benar-benar terjadi; jangan menganggap semua tahap sebelumnya otomatis dilalui. Log tahap terbaru tidak membuktikan jumlah historis transisi tanpa catatan pendukung. Untuk rasio respons outreach, penyebutnya peluang outbound yang benar-benar dikirim dalam cohort tanggal yang disebutkan, bukan seluruh inquiry/pengunjung. Laporkan yang masih menunggu secara terpisah.
