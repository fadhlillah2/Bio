<script>
  import { base } from "$app/paths";
</script>

    <section id="resume" class="resume section-alt">
      <div class="wrap">

        <header class="section-head">
          <p class="section-index">04 &mdash; Experience</p>
          <h2>Experience, Education, Projects, and Certifications</h2>
          <p class="section-deck cta-row">
            <a href={base + "/cv/resume-onepager-v1.13.pdf"} class="btn btn-solid btn-sm" download="Fadhlillah - Backend Software Engineer - CV (1 page).pdf">Download CV — 1 page (PDF)</a>
            <a href={base + "/cv/resume-v8.10.pdf"} class="btn btn-ghost btn-sm" download="Fadhlillah - Backend Software Engineer - CV (full).pdf">Full CV (PDF)</a>
            <a href={base + "/cv/resume-v8.10.txt"} class="plain-link" target="_blank" rel="noopener">Plain-text version</a>
          </p>
        </header>

        <ol class="timeline">

          <li class="tl-role" data-reveal>
            <details class="experience-card">
              <summary>
                <span class="tl-meta">
                  <span class="tl-dates">Present</span>
                  <span class="tl-org">Fineksi</span>
                </span>
                <h3>Software Engineer</h3>
              </summary>
              <div class="tl-body">
                <ul>
                  <li>Worked on document upload and structured extraction workflows for corporate onboarding.</li>
                  <li>Worked on resumable uploads, cross-document consistency checks, and corrections to extracted data. Added support for analyst review of company ownership and control.</li>
                  <li>Worked on financial-statement collection, processing, and company and industry ratio calculations.</li>
                  <li>Contributed to document summaries, Excel exports, generative insights, audit trails, and service logging.</li>
                  <li>Worked on React interfaces for document review, analytics, and account-opening workflows.</li>
                </ul>
              </div>
            </details>
          </li>

          <li class="tl-role" data-reveal>
            <details class="experience-card">
              <summary>
                <span class="tl-meta">
                  <span class="tl-dates">Dec 2025 — Present</span>
                  <span class="tl-org">FOX Asset — Infinity Wave Sdn Bhd</span>
                  <span class="tl-place">Malaysia (Remote)</span>
                </span>
                <h3>Backend Software Engineer (Freelance)</h3>
              </summary>
              <div class="tl-body">
                <ul>
                  <li>Primary backend engineer for Safety Hub on FOX Asset, a multi-tenant asset management and maintenance platform built on Django REST Framework, covering Permit-to-Work/HIRARC forms and safety induction.</li>
                  <li>Built approval workflows with PIC acceptance, sequential approvers, signature capture, and rejection/resubmission handling, alongside permit validity checks, expiry reminders, and automatic cancellation.</li>
                  <li>Developed permit PDFs with QR links and induction certificates with QR codes, expiry checks, and watermarks. Built Document Hub upload, rename, trash, restore, and retention handling.</li>
                  <li>Built the Project Management backend, including task assignment, Kanban and timeline views, weightage distribution, and planned-versus-actual S-Curve analytics.</li>
                  <li>Implemented role-based permissions and company data isolation, added backend regression tests, and fixed a Safety Hub null-user rendering failure with a visible error fallback.</li>
                  <li>Implemented secret scanning and tenant release pipelines with GitHub Actions, Amazon ECR, and AWS Systems Manager, including migration and disk-space guards, HTTP health checks, and automatic image rollback on startup or HTTP health-check failure; prepared staging configuration.</li>
                  <li>Removed exposed credentials from tracked env templates, added schema-drift checks, and authored API documentation, deployment runbooks, and operational handover notes.</li>
                </ul>
              </div>
            </details>
          </li>

          <li class="tl-role" data-reveal>
            <details class="experience-card">
              <summary>
                <span class="tl-meta">
                  <span class="tl-dates">Aug 2023 — Aug 2026</span>
                  <span class="tl-org">Danamon</span>
                  <span class="tl-place">Jakarta, Indonesia</span>
                </span>
                <h3>Software Engineer</h3>
              </summary>
              <div class="tl-body">
                <ul>
                  <li>Built and maintained iRecon, a Java/GWT reconciliation platform spanning 660+ classes that serves as the bank's central engine for settling corporate transaction data end to end</li>
                  <li>Automated the daily reconciliation and reporting cycle with scheduled batch jobs producing 10 report formats, including SWIFT MT940/942/950 statements, securely delivered to corporate clients via Email, SFTP, and MFT with PGP/AES encryption</li>
                  <li>Shipped the FSC (Financial Supply Chain) modules, integrating with core-banking middleware over encrypted REST APIs and enforcing banking-grade controls: maker-checker approval, LDAP-based access management, and full audit trail</li>
                  <li>Tuned queries and caching on the corporate reporting pipeline to consistently meet 48-hour reporting SLAs</li>
                  <li>Delivered an SFTP automation platform in 10 days against a 17-day plan by leaning on AI-assisted development to compress the build cycle</li>
                  <li>Applied LLM-assisted workflows across the delivery cycle, cutting technical documentation turnaround from 40 hours to 4 and lifting core-module test coverage to 95%</li>
                  <li>Built and operated 12 Spring Boot microservices on a hexagonal architecture, serving 2M+ requests/day at sub-200ms response times across 500k+ daily transactions</li>
                  <li>Implemented OAuth 2.0, JWT, and AES-256 encryption across the services, passing internal security audits</li>
                </ul>
              </div>
            </details>
          </li>

          <li class="tl-role" data-reveal>
            <details class="experience-card">
              <summary>
                <span class="tl-meta">
                  <span class="tl-dates">Mar 2023 — Jul 2023</span>
                  <span class="tl-org">IDstar</span>
                  <span class="tl-place">South Jakarta, Indonesia (Remote)</span>
                </span>
                <h3>Backend Software Engineer</h3>
              </summary>
              <div class="tl-body">
                <ul>
                  <li>Developed and optimized 40+ RESTful APIs for the OML Innovoice platform</li>
                  <li>Implemented enterprise SSO (OAuth 2.0/JWT) and session tracking to enforce authenticated access</li>
                  <li>Secured the app against OWASP Top 10 (input validation, SQLi)</li>
                  <li>Cut unauthorized access by 95% by adding multi-layer auth</li>
                  <li>Managed sessions with Redis; secured the app against OWASP Top 10</li>
                  <li>Built an MSSQL email logging system to meet compliance audits</li>
                  <li>Dockerized services and hosted on Azure (Apache Tomcat)</li>
                  <li>Kept code quality score at 90+ using SonarLint and peer reviews</li>
                </ul>
              </div>
            </details>
          </li>

          <li class="tl-role" data-reveal>
            <details class="experience-card">
              <summary>
                <span class="tl-meta">
                  <span class="tl-dates">Apr 2022 — Feb 2023</span>
                  <span class="tl-org">Freelance &amp; Personal Projects</span>
                  <span class="tl-place">Remote</span>
                </span>
                <h3>Full Stack Developer</h3>
              </summary>
              <div class="tl-body">
                <ul>
                  <li>Set up Apache Kafka for real-time event processing</li>
                  <li>Hooked up 3+ external systems via REST APIs to automate our data flow</li>
                  <li>Built the restaurant booking alerts system using Kafka</li>
                  <li>Added Redis caching to reduce database load</li>
                  <li>Handled Postgres migration using Flyway with a staged rollout</li>
                  <li>Built a notification service delivering email and SMS</li>
                  <li>Synced orders with Kitchen Displays and POS terminals using REST APIs</li>
                  <li>Built a simulation app using Quarkus microservices. It's event-driven</li>
                  <li>Shipped a home-stay booking site (Next.js/Postgres). Integrated Stripe</li>
                  <li>Coded an Instagram clone. Used WebSockets for live feeds and MongoDB</li>
                  <li>Developed a context-aware AI chatbot on the MERN stack using OpenAI</li>
                  <li>Wrote REST and GraphQL APIs using Spring Boot and FastAPI</li>
                  <li>Deployed Docker containers to AWS ECS</li>
                </ul>
              </div>
            </details>
          </li>

          <li class="tl-role" data-reveal>
            <details class="experience-card">
              <summary>
                <span class="tl-meta">
                  <span class="tl-dates">Jul 2020 — Feb 2023</span>
                  <span class="tl-org">Assist.id</span>
                  <span class="tl-place">Pekanbaru City, Riau, Indonesia</span>
                </span>
                <h3>Backend Software Engineer</h3>
              </summary>
              <div class="tl-body">
                <ul>
                  <li>Built 100+ RESTful APIs for the IBBR healthcare system</li>
                  <li>Integrated 40+ external APIs (payments, logistics, SMS)</li>
                  <li>Synced ERP data in real time via REST and webhooks</li>
                  <li>Designed a request engine handling multi-level approvals</li>
                  <li>Accelerated reports 700% via query tuning and MongoDB materialized views</li>
                  <li>Wrote an auto-cleanup job for 10,000+ daily bookings</li>
                  <li>Built the auto check-in/out feature using MongoDB time triggers</li>
                  <li>Resolved ~100 bugs/month while maintaining 99.5% uptime</li>
                </ul>
              </div>
            </details>
          </li>

        </ol>

        <div class="cred-grid">

          <div class="cred-card" data-reveal>
            <h3 class="cred-title">Education</h3>
            <p class="cred-lead">Bachelor's degree, Mathematics and Computer Science</p>
            <p class="cred-sub">Universitas Gadjah Mada (UGM), Yogyakarta, Indonesia</p>
            <p class="cred-note">Activities and societies: Coordinator of LMNAS-28 UGM</p>
          </div>

          <div class="cred-card" data-reveal>
            <h3 class="cred-title">Projects</h3>
            <p class="cred-lead">High-Precision Contract Advisor RAG</p>
            <p class="cred-sub">Top 50 — Meta Llama Hackathon 2025 (Credential ID 032/H8/META/XI/2025)</p>
            <ul class="cred-list">
              <li><strong>Problem:</strong> contract analysis for scanned and digital documents</li>
              <li><strong>Approach:</strong> RAG with hybrid search and EasyOCR ingestion for scanned contracts</li>
              <li><strong>Stack:</strong> LangChain, Flask, ChromaDB, Groq (Llama 3.3 70B), Hugging Face embeddings, Next.js/TypeScript</li>
              <li>Source: <a href="https://github.com/fadhlillah2/llama-docs-auditor" target="_blank" rel="noopener">github.com/fadhlillah2/llama-docs-auditor</a></li>
            </ul>
            <p class="cred-lead cred-lead-2">Rate Limiter (Go)</p>
            <p class="cred-sub">Rate limiting service implemented in Go with support for multiple algorithms and distributed deployments.</p>
            <ul class="cred-list">
              <li>Source: <a href="https://github.com/fadhlillah2/rate-limiter-project-go" target="_blank" rel="noopener">github.com/fadhlillah2/rate-limiter-project-go</a></li>
            </ul>
          </div>

          <div class="cred-card" data-reveal>
            <h3 class="cred-title">Certifications</h3>
            <ul class="cred-list">
              <li>Meta Llama Hackathon 2025 — Top 50 (Hacktiv8 Indonesia)</li>
              <li>Machine Learning with Python (freeCodeCamp, Nov 2025)</li>
              <li>College Algebra with Python (freeCodeCamp, Nov 2025)</li>
              <li>Scientific Computing with Python (freeCodeCamp, Nov 2025)</li>
              <li>SQL (HackerRank, Feb 2023)</li>
              <li>HTML, CSS &amp; JavaScript training (Digital Talent Scholarship, Apr 2021)</li>
              <li>JavaScript Course (Progate, Apr 2021)</li>
              <li>JavaScript Algorithms and Data Structures (freeCodeCamp, Jan 2021)</li>
            </ul>
            <p class="cred-note">Profiles: <a href="https://www.linkedin.com/in/fadhlillah2" target="_blank" rel="noopener">linkedin.com/in/fadhlillah2</a> &middot; <a href="https://github.com/fadhlillah2" target="_blank" rel="noopener">github.com/fadhlillah2</a> &middot; <a href="https://leetcode.com/orion_omniscient" target="_blank" rel="noopener">leetcode.com/orion_omniscient</a></p>
          </div>

        </div>

        <p class="cta-row cta-row-center">
          <a href={base + "/cv/resume-onepager-v1.13.pdf"} class="btn btn-solid btn-sm" download="Fadhlillah - Backend Software Engineer - CV (1 page).pdf">Download CV — 1 page (PDF)</a>
          <a href={base + "/cv/resume-v8.10.pdf"} class="btn btn-ghost btn-sm" download="Fadhlillah - Backend Software Engineer - CV (full).pdf">Full CV (PDF)</a>
          <a href="#contact" class="btn btn-quiet btn-sm">Get in touch</a>
          <a href={base + "/cv/resume-v8.10.txt"} class="plain-link" target="_blank" rel="noopener">Plain-text version</a>
        </p>

      </div>
    </section>
