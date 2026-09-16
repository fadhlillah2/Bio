# Distribution kit

Status: prepared locally; nothing in this kit has been posted, sent, pinned, or deployed.
Public-facing drafts below are in English. Replace only the recipient, company, and role placeholders where present.

**Publication gate:** the new FOX case link is intended for distribution only after deployment and live verification:
https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html
Its presence in this document does not mean it is live. Until verified, use the existing [experience section](https://fadhlillah2.github.io/Bio/#resume) where a case link would be needed; hold the LinkedIn case announcement and Featured item.

## 1. LinkedIn case post and Featured item

Copy-ready post, for use after the publication gate:

```text
Project management software needs more than a list of tasks. The backend also has to support how progress is planned, tracked, and compared.

For FOX Asset at Infinity Wave Sdn Bhd, I solely built the Project Management module backend:

• 21 REST endpoints
• 10 models
• 196 unit tests

The module covers Kanban and timeline views, weightage distribution, and S-Curve planned-versus-actual analytics with adaptive daily, weekly, and monthly bucketing.

I have written up the module's scope and capabilities for hiring teams and project owners looking for a concrete backend example.

Read the case:
https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html

If you are hiring a backend engineer or planning a workflow-heavy backend, I am open to discussing the role or project. What does your system need to track, and where does the current process get difficult?

#BackendEngineering #SoftwareEngineering
```

**Featured title:** Building the Project Management backend for FOX Asset

**Featured description:** A module backend I built independently: 21 REST endpoints, 10 models, and 196 unit tests, covering Kanban, timelines, weightage distribution, and planned-versus-actual S-Curve analytics.

**Featured URL:** https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html

Use the actual case page as the preview. No fabricated product screenshot, customer quotation, or private source-code attachment is needed.

## 2. GitHub pin shortlist

Proposed order for the two public flagship repositories already linked from the site; no pins or repository content have been changed.

| Repository | Why put it near the top | What the public README currently provides |
| --- | --- | --- |
| [llama-docs-auditor](https://github.com/fadhlillah2/llama-docs-auditor) | Evidence for document ingestion, retrieval, and AI/backend integration; pairs with the [hybrid retrieval writeup](https://fadhlillah2.github.io/Bio/writeups/hybrid-retrieval). | Quick start, prerequisites including a Groq API key, architecture/development documentation links, document-question examples, and OCR/RAG test commands. |
| [rate-limiter-project-go](https://github.com/fadhlillah2/rate-limiter-project-go) | Evidence for Go backend engineering and distributed request controls; a better match for systems roles than unrelated practice apps. | Algorithm descriptions, Redis/Lua integration, usage examples, Docker setup, unit/integration/benchmark commands, and assumptions/limitations. |

Readiness inspection was read-only on 2026-09-16. Documentation presence is verified; successful setup, current test results, coverage, and benchmark reproduction are **not** verified by this inspection.

Before changing a pin or README, check:

- The opening paragraph identifies the problem, intended user, and implemented scope.
- The setup path names required services/credentials; examples use synthetic or shareable inputs.
- A reader can find one usage example, the test command, and known limitations without searching the whole repository.
- Any new performance or coverage claim has a reproducible command and dated result. Do not present the README's reported figures as newly measured results.
- Keep the FOX commercial case distinct from public source repositories; this kit does not imply FOX source is public.

These are checks to perform, not a claim that README edits or fresh test runs have happened. Two relevant pins are enough for this campaign; there is no need to fill every slot.

## 3. Targeted application messages

Choose the version matching the actual vacancy. Replace `[Name]`, `[Company]`, and `[Role]`; confirm the role requirements before sending. Do not send both variants to the same person.

### Java / backend role

```text
Subject: [Role] at [Company] — backend engineering examples

Hi [Name],

I am applying for the [Role] position at [Company]. I am a Backend Software Engineer with 6+ years of experience, specializing in Java/Spring Boot and working across Python, Node.js, and Go.

At Bank Danamon, I built and operated 12 Spring Boot microservices serving 2M+ requests/day at sub-200ms response times. My recent freelance work also includes independently building the Project Management module backend for FOX Asset: 21 REST endpoints, 10 models, and 196 unit tests.

One-page CV:
https://fadhlillah2.github.io/Bio/cv/resume-onepager-v1.12.pdf

Backend case:
https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html

I would be glad to discuss how this experience fits the team's backend requirements. I am based in Jakarta (UTC+7) and open to international remote work.

Best,
Fadhlillah
```

For a Go/distributed-systems vacancy, use the rate-limiter repository as the evidence link instead of the FOX case. Do not imply that the Go project was part of Bank Danamon or FOX.

### AI integration / Python backend role

```text
Subject: [Role] at [Company] — document retrieval and backend work

Hi [Name],

I am applying for the [Role] position at [Company]. My backend experience spans Java/Spring Boot and Python, and my public work includes a contract-analysis RAG system with OCR for Indonesian documents and hybrid retrieval over ChromaDB.

The project reached the Top 50 at the Meta Llama Hackathon 2025. The writeup explains the retrieval approach, and the repository includes setup and usage documentation:

https://fadhlillah2.github.io/Bio/writeups/hybrid-retrieval
https://github.com/fadhlillah2/llama-docs-auditor

One-page CV:
https://fadhlillah2.github.io/Bio/cv/resume-onepager-v1.12.pdf

I would welcome a conversation about the role's backend and AI-integration requirements. I am based in Jakarta (UTC+7) and open to international remote work.

Best,
Fadhlillah
```

The CV link is versioned: check it against [CV Current](../../cv/README.md#current--which-file-do-i-send) before reuse after a future CV release.

## 4. Freelance introduction and brief follow-up

Use the introduction only where there is a relevant project discussion or a clear reason to contact the recipient. It does not assume a particular company has a problem.

```text
Hi [Name],

I am Fadhlillah, a backend engineer based in Jakarta. I help teams build backend APIs, improve reporting performance, and integrate document retrieval or AI features into existing workflows.

If [Company] is planning a project in one of these areas, I can discuss the current system and what needs to change. One example of my work is the FOX Asset Project Management module backend, which I built independently: 21 REST endpoints, 10 models, and 196 unit tests.

Case: https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html
Services: https://fadhlillah2.github.io/Bio/#services

Would it be useful to compare the project's requirements with this experience? A short description by email or WhatsApp is enough to start.

Best,
Fadhlillah
```

For a document-search/AI enquiry, replace only the example paragraph and case link with this finished block:

```text
One public example is my Contract Advisor RAG project, which handles scanned and digital contracts using OCR and hybrid retrieval. The writeup explains the retrieval approach and its current limitations, providing a starting point for discussing your document-search requirements.

Writeup: https://fadhlillah2.github.io/Bio/writeups/hybrid-retrieval
```

Brief follow-up, after the recipient expresses interest:

```text
Thanks for the context. To understand the scope, could you share:

1. The workflow or problem you want to change, and who uses it.
2. The system and integrations already in place.
3. What a useful result would look like, and any deadline or constraints you already have.

A short reply is fine; you do not need a finished specification. Please use a non-sensitive example rather than credentials or confidential customer data.

From there, we can agree the deliverables, timeline, milestones, and code ownership in writing before work starts, including the source code, documentation, and deployment details needed for handover.

Best,
Fadhlillah
```

No rates, delivery promises, free audit, support SLA, or guaranteed business outcome are offered by these drafts.

## 5. Urutan penggunaan dan pencatatan

Catatan internal; bukan bagian copy yang dikirim.

1. Verifikasi deploy case baru dan link CV/writeup pada desktop serta mobile. Sampai itu selesai, tahan pengumuman LinkedIn/Featured; pesan lain dapat memakai experience section existing sebagai pengganti case baru.
2. Pilih dua pin sesuai shortlist dan periksa README dengan checklist di atas. Perubahan akun tetap aksi manual yang belum dilakukan.
3. Publish satu case post dan tambahkan Featured setelah link siap. Satu bukti jelas lebih berguna daripada mengulang semua skill dalam satu post.
4. Pilih lowongan yang cocok dengan pengalaman atau pembicaraan bisnis yang relevan; gunakan satu template dan bukti yang paling dekat dengan kebutuhan. Tidak ada pengiriman massal otomatis.
5. Catat setiap aplikasi/perkenalan, balasan, percakapan yang sesuai, interview, serta permintaan proposal menggunakan [manual measurement](measurement.md) dan [template kosong](lead-log.template.csv). Simpan log berisi kontak nyata di luar repo. Source mengikuti bukti asal (bukan otomatis kanal WhatsApp/email); bila tidak diketahui, gunakan `unknown`. Log hanya hasil yang benar-benar terjadi; link berparameter sendiri tidak mengukur kunjungan.
6. Tinjau pola kualitas balasan secara berkala. Perbaiki satu hal pada pesan atau bukti berdasarkan pertanyaan nyata penerima; jangan menganggap kenaikan traffic atau satu balasan sebagai bukti kausal keberhasilan desain.

Status aksi: **posting LinkedIn, Featured, GitHub pin/README edits, pengiriman aplikasi/perkenalan, dan publikasi situs belum dilakukan oleh kit ini.**

## Evidence map

- FOX ownership, endpoint/model/test counts, and capabilities: [current public CV source](../../cv/resume-v8.9.txt) and [site experience source](../../src/lib/components/Resume.svelte). Sole ownership applies to the Project Management module backend; 196 tests belong to that module. No ROI, delivery duration, or ownership of the whole product is claimed.
- Backend experience, availability, and role wording: [recruiter CV source](../../cv/resume-onepager-v1.12.txt). Past Bank Danamon work stays in past tense.
- Service offers and working process: [Services source](../../src/lib/components/Services.svelte); contact channels: [Contact source](../../src/lib/components/Contact.svelte).
- Public repository documentation inspected read-only: [RAG README](https://github.com/fadhlillah2/llama-docs-auditor#readme) and [Go rate-limiter README](https://github.com/fadhlillah2/rate-limiter-project-go#readme). No code from either repository was executed.
