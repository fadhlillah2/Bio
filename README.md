<h1 align="center">Fadhlillah — Backend Software Engineer · AI Native Engineer</h1>

<div align="center">

[![Portfolio](https://img.shields.io/badge/Portfolio-fadhlillah2.github.io%2FBio-5ce1c6?style=for-the-badge&labelColor=0b0f17)](https://fadhlillah2.github.io/Bio/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&labelColor=0b0f17)](https://www.linkedin.com/in/fadhlillah2)
[![Email](https://img.shields.io/badge/Email-Contact-D14836?style=for-the-badge&labelColor=0b0f17)](mailto:fadhlillah949699@gmail.com)

</div>

<h3 align="center">Java/Spring Boot microservices at 2M+ requests/day · LLM-integrated products end to end</h3>

---

## Professional Profile

Backend Software Engineer (6+ yrs) — deep in **Java/Spring Boot**, adaptable across the languages, domains and paradigms around it. Builds Spring Boot microservices serving **2M+ requests/day**, shipping in Python, Node, and Go across healthcare, F&B, and fintech as each problem demands. Adopted AI-augmented workflows early — a production SFTP platform delivered in **10 days against a 17-day plan** — and lifted reporting speed **700%** via query and data-model optimization on a healthcare platform. Builds LLM-integrated products end to end: **RAG systems, AI chatbots, internal automation**. **Top 50 at the LLaMA Hackathon** — equally at home in regulated enterprise systems and fast-moving AI builds.

**Highlights:**
- **2M+ requests/day at sub-200ms** — 12 Spring Boot microservices (hexagonal architecture), 500k+ daily transactions
- **48-hour reporting SLAs** — corporate reporting pipelines tuned (queries and caching) to meet them consistently
- **700% faster reports** — query tuning & materialized views on a healthcare platform (99.5% uptime, 100+ APIs)
- **Top 50, LLaMA Hackathon** — [High-Precision Contract Advisor RAG](https://github.com/fadhlillah2/llama-docs-auditor) (LangChain, ChromaDB, Groq, EasyOCR)

---

## Tech Stack

|                             |                                                                                                                     |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------|
| **AI/LLM**                  | RAG (LangChain, ChromaDB), LLM integration (OpenAI, LLaMA, Groq), AI chatbots, AI-augmented engineering (Cursor AI) |
| **Languages**               | Java, Python, JavaScript/TypeScript, Go                                                                             |
| **Backend**                 | Spring Boot, Quarkus, FastAPI, Flask, Node.js, Express.js                                                           |
| **Architecture**            | Microservices, REST, GraphQL, Event-driven architecture, Hexagonal Architecture                                     |
| **Databases**               | PostgreSQL, MySQL, Microsoft SQL Server, MongoDB, Redis                                                             |
| **Messaging & Integration** | Apache Kafka, RabbitMQ, gRPC, WebSocket                                                                             |
| **DevOps/Cloud**            | Docker, Kubernetes, Jenkins, CI/CD, Flyway, Maven, Git, AWS (ECS, EC2, S3), Azure                                   |
| **Security**                | OAuth 2.0, JWT, SSO, AES-256, OWASP Top 10                                                                          |

---

## About This Repo

Source of my portfolio site, live at **[fadhlillah2.github.io/Bio](https://fadhlillah2.github.io/Bio/)**. It is a fully prerendered SvelteKit site with a console theme that shifts between morning, dusk, and night looks (picked from the visitor's local time, switchable from the bottom-left control), handwritten CSS, and progressive client-side enhancements. Fonts are self-hosted, icons are inline SVG, and production is deployed to GitHub Pages through GitHub Actions.

- [`src/routes/`](src/routes/) contains the home page and technical writeup routes.
- [`src/lib/components/`](src/lib/components/) contains the portfolio sections.
- [`static/`](static/) contains the stylesheet, fonts, images, metadata, and generated CV copies served as-is.
- [`cv/`](cv/) contains the canonical `.txt` sources and distributable PDFs for the full resume, recruiter/ATS one-pager, and consulting one-pagers in English and Bahasa Indonesia.

## Local Development

The project uses Bun for dependency and script management, Vite for development and bundling, and SvelteKit's static adapter for production output.

```bash
bun install
bun run dev          # http://localhost:5173/Bio/
bun run check        # Svelte diagnostics
bun run cv:selftest  # CV parser checks
bun run build        # prerendered output in build/
bun run validate     # core checks + build + sky check; requires Chrome and Python 3
bun run validate:ci  # all checks, including browser acceptance; requires native Chrome and Python 3
bun run chat         # local dev backend for the chat widget (needs the opencode CLI; CHAT_MODEL overrides the model)
bun run chat:worker  # the deployable backend (worker/chat.ts) run locally; needs CHAT_API_KEY + CHAT_SIGNING_KEY; the per-caller daily quota applies here too (all local requests are one caller, 127.0.0.1) — override with CHAT_DAILY_PER_CALLER
```

## Deployment

The chat backend (`worker/` — a Cloudflare Worker that calls the provider API directly, with no
opencode CLI and no personal credential file on a public host) is deployed automatically by
[`.github/workflows/deploy-worker.yml`](.github/workflows/deploy-worker.yml) whenever a push to
`master` touches the worker bundle or its grounding sources (the resume, the agent definition, the
site components the facts are quoted from). Two gates run before the deploy step:
`bun run chat:worker:build --check` (generated bundle matches its sources) and
`bun scripts/chat-proxy-selftest.ts` (the guard selftest). Production provider: GLM `glm-5.3-flash`
through the OpenCode Go gateway (see `worker/wrangler.toml`).

One-time setup — the secrets and the KV namespace live in your accounts, not in this repo:

- GitHub repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CHAT_API_KEY` (an
  OpenCode Go key), `CHAT_SIGNING_KEY` (`openssl rand -hex 32`). The action copies the two worker
  secrets to Cloudflare on every deploy; its preflight step fails with `::error::` naming anything
  missing.
- Create the KV namespace once (`cd worker && bunx wrangler kv namespace create CHAT_KV`) and
  paste the id into `worker/wrangler.toml`.

A private instance that also wants the optional access token sets it by hand —
`bunx wrangler secret put CHAT_TOKEN` (32+ characters) — deliberately not part of the action's
`secrets:` list, because the public page cannot hold a secret.

What actually bounds spending: the OpenCode Go plan's quota on top of the worker's own daily
quotas (200 answers global, 20 per caller) and the edge rate limit (5 per minute per IP). The
gateway key cannot carry a per-key limit.

Kill switch: empty `PROD_ENDPOINT` in `src/lib/chat.js` and rebuild, or delete the worker — the
widget's probe fails and the widget disappears with no errors. `PROD_ENDPOINT` is still empty
today; it is filled with the worker URL after the first deploy, and until then the widget never
renders outside localhost.

Pushes to `master` also run [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), build
the static site, and deploy the resulting `build/` artifact. The repository's Pages source must be
set to **GitHub Actions**; branch publishing is incompatible because the repository root contains
source files rather than generated HTML.

## Contact

- **Email:** [fadhlillah949699@gmail.com](mailto:fadhlillah949699@gmail.com)
- **LinkedIn:** [linkedin.com/in/fadhlillah2](https://www.linkedin.com/in/fadhlillah2)
- **WhatsApp:** [+62 851-5704-3131](https://wa.me/6285157043131)
- **LeetCode:** [leetcode.com/orion_omniscient](https://leetcode.com/orion_omniscient)

Open to full-time roles, international remote opportunities, and consulting engagements.
