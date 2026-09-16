# Draft offer: one backend workflow, ready for handover

## Client-facing copy

I help teams deliver or improve a defined backend workflow in an existing product—for example, a project-status workflow, an approval process, or a reporting API. We choose one workflow and agree its boundaries before implementation.

For FOX Asset, I independently built the Project Management module backend: 21 REST endpoints, 10 models, and 196 unit tests. Its capabilities include Kanban and timeline support, weightage distribution, and S-Curve planned-versus-actual analytics. [Read the delivery account](https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html). That example describes past work; the scope of your engagement is agreed separately.

**Availability: 8–16 hours per week**, based in Jakarta (UTC+7). We agree meeting overlap, milestones, price, and delivery dates after reviewing the current system and requirements.

### What we define together

Bring the workflow you want to improve, who uses it, what happens today, and the outcome you need. Useful inputs include existing API documentation, relevant code access, a safe test environment, sample data you are permitted to share, user roles, integration dependencies, and a person who can confirm acceptance.

The first deliverable is a short agreed scope: current behavior, intended behavior, affected endpoints/data, permissions, assumptions, dependencies, and examples of success and failure. If the work is larger than one milestone, we divide it before estimating delivery.

### Implementation and handover

- Backend changes for the agreed workflow, fitting the existing architecture.
- Tests for the agreed behavior, validation failures, and relevant permission boundaries.
- API examples and any agreed schema/migration notes, including deployment and recovery considerations.
- A demonstration against the agreed examples in the test environment.
- Source changes, test commands/results, known limitations, and concise handover notes for the maintaining team.

### Acceptance

Before implementation, we agree concrete input/output examples, permitted and denied user actions, and any relevant data or integration constraints. Acceptance means those agreed examples and tests pass in the agreed environment and the maintaining team receives the handover. Performance targets, if needed, require a defined workload, environment, and measurement method; they are not assumed from past-project figures.

Deployment responsibilities, access, migration execution, and approval are specified in the scope. Changes outside the agreed milestone are reviewed together for scope, time, and price before proceeding.

### After delivery

We agree the acceptance-review period and treatment of defects against the signed-off scope. Ongoing maintenance, support hours, response expectations, and additional features are discussed separately. Availability of 8–16 hours/week is not an on-call or response-time guarantee.

To start, describe the workflow, current stack, affected users, desired result, and any target date. I can then propose an initial milestone and the questions we need to resolve before estimating it.

## Catatan internal — bukan copy untuk klien

- Ini pilihan penawaran awal untuk diskusi, bukan kontrak, harga tetap, atau janji deadline. User mengonfirmasi kapasitas 8–16 jam/minggu dan tidak memberi pengecualian kategori proyek/support.
- Batas satu workflow menjaga estimasi dapat ditinjau; jangan menganggap semua pekerjaan harus dibatasi jenis proyek ini. Ruang lingkup lain tetap bisa dibahas sesuai kebutuhan dan kapasitas.
- Jangan mencantumkan 196 test sebagai target test-count proyek baru, menjanjikan ROI, atau memberikan akses kode/data FOX. Bukti berasal dari case publik dan CV, bukan repositori klien yang dibuka untuk calon klien.
- Konfirmasi beban kerja, timezone overlap, budget, hak akses, acceptance owner, periode review, dan kebutuhan support sebelum mengirim proposal harga/jadwal. Gunakan [shortlist](targeted-opportunities.md) dan [log privat](measurement.md); belum ada penawaran ini yang dikirim.
