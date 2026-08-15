# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Apa ini

Situs portfolio statis (GitHub Pages, `https://fadhlillah2.github.io/Bio/`) + folder `cv/`
berisi artefak CV yang didistribusikan. **Tidak ada build system, package manager, test runner,
maupun CI** — `index.html`/`assets/` diedit langsung, deploy = push ke `master` (Jekyll hanya
memakai `_config.yml` untuk meng-exclude path dari situs terbit).

## Perintah

```bash
# Preview lokal (MCP Claude-in-Chrome tak bisa localhost/file:// — pakai Chrome headless CLI)
python3 -m http.server 8000        # → http://localhost:8000/

# Regen PDF dari .txt kanonik (butuh pypdf + Chrome; resume 2 halaman butuh arg max_pages=2)
uv run --with pypdf python3 cv/build-pdf.py cv/resume-v8.7.txt 2
uv run --with pypdf python3 cv/build-pdf.py cv/resume-onepager-v1.8.txt
uv run --with pypdf python3 cv/build-pdf.py cv/consulting-onepager-en-v1.4.txt
uv run --with pypdf python3 cv/build-pdf.py cv/consulting-onepager-id-v1.4.txt

# Satu-satunya "test" di repo: self-check parser build-pdf
python3 cv/build-pdf.py --selftest

# --selftest BUTA terhadap line-break URL di PDF — verifikasi URL final terpisah
pdftotext cv/resume-v8.7.pdf - | grep -i 'github\|linkedin\|leetcode'
```

`build-pdf.py` sendiri sudah memverifikasi: wording PDF identik dengan `.txt`
(whitespace-insensitive) dan jumlah halaman ≤ `max_pages` — gagal → exit non-zero.

## Arsitektur

- **`index.html`** (~930 baris) — seluruh situs satu halaman: hero terminal, About, Facts,
  Skills, Resume, Services, Portfolio, Testimonials, Contact. Basis iPortfolio/Bootstrap yang
  dikustomisasi berat (tema konsol gelap) di `assets/css/style.css`.
- **`assets/js/main.js`** — nav-scrollspy, smooth-scroll (hormati `prefers-reduced-motion`),
  back-to-top, init AOS/Typed. Vendor lib di-vendor lokal (`assets/vendor/`), bukan CDN.
- **Contact form** — inline `<script>` di `index.html`: AJAX ke FormSubmit dengan fallback
  graceful bila endpoint down (FormSubmit pernah 522; ganti backend = keputusan user, pending).
- **`cv/`** — `.txt` = source of truth tiap artefak, `.pdf` di-generate darinya oleh
  `build-pdf.py` (Chrome headless print-to-PDF, A4, auto-detect Chrome native/WSL, stamp
  Title/Author/lang). Naming: `<artifact>[-<lang>]-v<major.minor>`; `cv/archive/` = jejak audit
  (jangan pernah didistribusikan), `cv/drafts/` gitignored.
- **`_config.yml`** — meng-exclude `cv/archive`, `cv/README.md`, `cv/build-pdf.py` dari situs
  terbit. Repo publik, jadi apa pun yang tak boleh terlayani harus masuk exclude atau keluar tree.

## Invarian yang mudah dilanggar

- **Bump versi artefak cv/** wajib satu paket: edit `.txt` → arsipkan versi lama ke `cv/archive/`
  → regen PDF → update **semua** spot link (`grep -c 'href="cv/' index.html` — ada 12 href di hero,
  Resume, Services) → update `cv/README.md` (tabel Current/Archive + lineage). Di luar repo:
  badge Resume di README profil GitHub (`fadhlillah2/fadhlillah2`) menunjuk versi spesifik dan
  akan 404 kalau stale.
- **Aturan mirror & anti-fabrikasi konten CV** — LinkedIn live = SoT; `resume-vX.Y` mirror penuh,
  `resume-onepager` edisi recruiter/ATS (boleh fakta user-confirmed, tak boleh kontradiksi
  LinkedIn), `consulting-onepager-{en,id}` lock-step. Metrik ditulis persis seperti sumber:
  dilarang menggabung angka, memperkuat verb, atau menaikkan cakupan klaim. Detail lengkap:
  `cv/README.md` bagian Rules.
- **Snapshot LinkedIn tidak pernah masuk repo** (berisi catatan strategi internal) — lihat
  `cv/README.md` "Removed from the tree".
- Commit **tanpa** trailer `Co-Authored-By`. Push ke origin, merge, dan aksi destruktif hanya
  atas perintah eksplisit user.
- `.claude/` gitignored (local-only): rules yang auto-load + skills `bio-audit`,
  `bio-regen-pdf`, `bio-deploy-verify`, `bio-headless-render`. Kalau ada di mesin ini, rules di
  `.claude/rules/` (termasuk guard-list temuan audit yang sudah settled) berlaku dan lebih rinci
  dari file ini.
