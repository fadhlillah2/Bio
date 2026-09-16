# RAG evaluation evidence

Status: documentation repaired locally; no new retrieval, OCR, or answer-quality result.

- Repository: https://github.com/fadhlillah2/llama-docs-auditor
- Reviewed base: `f47b6c47cda07bd76b7461f6d6788d5c0cb1f12c`.
- Local checkout: `/home/finskor017/Documents/PROJECTS/llama-docs-auditor`.
- Changed file: `docs/EVALUATION_USAGE.md` in that checkout; not committed or published.
- [Published guide at the reviewed base](https://github.com/fadhlillah2/llama-docs-auditor/blob/f47b6c47cda07bd76b7461f6d6788d5c0cb1f12c/docs/EVALUATION_USAGE.md) is the old version, not the local repair.

The repair replaces an absent sample path with the existing public demo contract,
corrects the report-save call, supplies explicit questions and a failed-query exit
guard, and removes unsupported production-ready claims. No model/retrieval code
or historical results were changed.

Local checks on 2026-09-16: both guide Python snippets compiled; the offline
snippet read the 730-character demo and both historical JSON reports. Both report
RAGAS disabled: one has 9/9 processed queries, the other 0/0 and error rate 1.
These are old results, not a new benchmark. `git diff --check` passed.

`python3 -B tests/test_section_references.py` exited zero with **all 11 tests
skipped** because retriever dependencies are absent. This is not a passing
retrieval test run. No dependencies, models, or API calls were downloaded/run.

Next gate: approve an isolated dependency/model environment and bounded Groq API
usage for the guide's three-question public-demo smoke test. Review package/model
versions, time/spending limits, fallback logs, and data sent before execution.
`use_ragas=False` still invokes remote generation. A later quality claim also
requires labeled references and retained per-question answers/contexts; the
current aggregate report does not provide them. The text demo cannot test OCR.
