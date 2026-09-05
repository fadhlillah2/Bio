<script>
  import { base } from "$app/paths";
</script>

    <section id="resume" class="resume section-alt">
      <div class="wrap">

        <header class="section-head">
          <p class="section-index">04 &mdash; Experience</p>
          <h2>Experience, education, projects, and certifications</h2>
          <p class="section-deck cta-row">
            <a href={base + "/cv/resume-onepager-v1.10.pdf"} class="btn btn-solid btn-sm" download="Fadhlillah - Backend Software Engineer - CV (1 page).pdf">Download CV — 1 page (PDF)</a>
            <a href={base + "/cv/resume-v8.7.pdf"} class="btn btn-ghost btn-sm" download="Fadhlillah - Backend Software Engineer - CV (full).pdf">Full CV (PDF)</a>
            <a href={base + "/cv/resume-v8.7.txt"} class="plain-link" target="_blank" rel="noopener">Plain-text version</a>
          </p>
        </header>

        <ol class="timeline">

          <li class="tl-role" data-reveal>
            <div class="tl-meta">
              <p class="tl-dates">Dec 2025 — Present</p>
              <p class="tl-org">FOX Asset — Infinity Wave Sdn Bhd</p>
              <p class="tl-place">Malaysia (Remote)</p>
            </div>
            <div class="tl-body">
              <h3>Backend Software Engineer (Freelance)</h3>
              <ul>
                <li>Primary backend engineer of the Safety Hub (Permit-to-Work/HIRARC forms + safety induction) on FOX Asset, a multi-tenant asset management &amp; maintenance (CMMS) SaaS built on Django REST Framework — 23 data models, 50+ REST endpoints, ~21,000 lines of Python across the two modules</li>
                <li>Built a multi-tier digital approval workflow (PIC acceptance + up to 3 sequential approvers) with digital signatures, rejection/resubmission cycles, and 12 email notification flows</li>
                <li>Engineered async document pipelines: Celery + wkhtmltopdf permit PDFs with embedded QR codes, and a WeasyPrint + Pillow certificate engine with QR verification, watermarks, and expiry</li>
                <li>Solely built the Project Management module backend: 21 REST endpoints, 10 models, Kanban and timeline views, weightage distribution, and S-Curve planned-vs-actual analytics with adaptive daily/weekly/monthly bucketing</li>
                <li>Enforced role-based access control with field-level write restrictions and cross-company data isolation; wrote 196 unit tests for Project Management and 105 for the Safety Hub apps</li>
                <li>Delivered a 2-week AWS/DevOps security engagement: purged leaked credentials from tracked env templates, added gitleaks secret-scanning CI and a database migration-drift gate, and built a staging environment with a GitHub Actions CI/CD pipeline to AWS ECR</li>
                <li>Authored a 1,260-line bilingual (EN/ID) API reference, Postman collections (38 + 23 requests), and 987 lines of deployment runbooks</li>
              </ul>
            </div>
          </li>

          <li class="tl-role" data-reveal>
            <div class="tl-meta">
              <p class="tl-dates">Aug 2023 — Present</p>
              <p class="tl-org">Bank Danamon</p>
              <p class="tl-place">Jakarta, Indonesia</p>
            </div>
            <div class="tl-body">
              <h3>Software Engineer</h3>
              <ul>
                <li>Automated technical documentation with LLMs, cutting cycle time from 40 hours to 4 hours</li>
                <li>Generated test cases achieving 95% coverage on core modules, reducing prep time by 65%</li>
                <li>Built SFTP automation platform in 10 days against a 17-day plan using AI coding tools</li>
                <li>Running 12 microservices (Hexagonal arch). We handle 500k+ daily txs</li>
                <li>Built and operate Spring Boot microservices serving 2M+ requests/day at sub-200ms response times</li>
                <li>Supporting financial systems processing $10M+ daily volume; consistently meeting 48h reporting SLAs</li>
                <li>Met urgent 48h deadline to deliver a critical financial reporting tool</li>
                <li>Tuned DB queries and caching, improving response times across the platform's user base</li>
                <li>Implemented OAuth 2.0, JWT, and AES-256; passed internal security audits</li>
              </ul>
            </div>
          </li>

          <li class="tl-role" data-reveal>
            <div class="tl-meta">
              <p class="tl-dates">Mar 2023 — Jul 2023</p>
              <p class="tl-org">IDstar</p>
              <p class="tl-place">South Jakarta, Indonesia (Remote)</p>
            </div>
            <div class="tl-body">
              <h3>Backend Software Engineer</h3>
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
          </li>

          <li class="tl-role" data-reveal>
            <div class="tl-meta">
              <p class="tl-dates">Apr 2022 — Feb 2023</p>
              <p class="tl-org">Freelance &amp; personal projects</p>
              <p class="tl-place">Remote</p>
            </div>
            <div class="tl-body">
              <h3>Full Stack Developer</h3>
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
          </li>

          <li class="tl-role" data-reveal>
            <div class="tl-meta">
              <p class="tl-dates">Jul 2020 — Feb 2023</p>
              <p class="tl-org">Assist.id</p>
              <p class="tl-place">Pekanbaru City, Riau, Indonesia</p>
            </div>
            <div class="tl-body">
              <h3>Backend Software Engineer</h3>
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
          <a href={base + "/cv/resume-onepager-v1.10.pdf"} class="btn btn-solid btn-sm" download="Fadhlillah - Backend Software Engineer - CV (1 page).pdf">Download CV — 1 page (PDF)</a>
          <a href={base + "/cv/resume-v8.7.pdf"} class="btn btn-ghost btn-sm" download="Fadhlillah - Backend Software Engineer - CV (full).pdf">Full CV (PDF)</a>
          <a href="#contact" class="btn btn-quiet btn-sm">Get in touch</a>
          <a href={base + "/cv/resume-v8.7.txt"} class="plain-link" target="_blank" rel="noopener">Plain-text version</a>
        </p>

      </div>
    </section>
