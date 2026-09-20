<script>
  import { base } from "$app/paths";
</script>

    <!-- ======= Portfolio ======= -->
    <section id="portfolio" class="portfolio">
      <div class="wrap">

        <header class="section-head">
          <p class="section-index">03 &mdash; Selected Work</p>
          <h2>Project Showcase</h2>
          <p class="section-deck">Commercial work and personal projects, with details on my contributions and links to available source code.</p>
        </header>

        <article class="flagship" data-reveal>
          <div class="flagship-body">
            <p class="flagship-badge">Commercial delivery &middot; Freelance backend engineering</p>
            <h3 class="flagship-title">FOX Asset: Project Management Backend</h3>
            <p class="flagship-desc">I solely built the Project Management module backend within FOX Asset, a multi-tenant asset management and maintenance SaaS: Kanban and timeline support, weightage distribution, and S-Curve planned-vs-actual analytics.</p>
            <p class="flagship-result">Project Management backend: <strong>21 REST endpoints &middot; 10 models &middot; 196 unit tests</strong>.</p>
            <div class="flagship-cta">
              <a href={base + "/writeups/fox-asset-project-management"} class="btn btn-solid btn-sm">Read the delivery case</a>
              <a href="#services" class="btn btn-ghost btn-sm">Explore services</a>
            </div>
          </div>
        </article>

        <article class="flagship" data-reveal>
          <div class="flagship-body">
            <p class="flagship-badge">Project Overview</p>
            <h3 class="flagship-title">Fineksi — Financial Document Processing</h3>
            <p class="flagship-desc">Tools for corporate document review and financial-statement analysis.</p>
            <p class="flagship-result">Structured extraction, cross-document checks, and analyst review for corporate onboarding.</p>
            <p class="flagship-result">Financial-statement pipelines for company and industry ratio analysis.</p>
            <ul class="tag-row">
              <li>Node.js</li><li>Express</li><li>MySQL</li><li>React</li>
            </ul>
          </div>
        </article>

        <!-- Public project: source and implementation limits are linked below. -->
        <article class="flagship" data-reveal>
          <div class="flagship-body">
            <p class="flagship-badge">Top 50 &middot; Meta Llama Hackathon 2025 &middot; Hacktiv8 Indonesia</p>
            <h3 class="flagship-title">High-Precision Contract Advisor RAG</h3>
            <p class="flagship-desc">A retrieval-augmented contract analysis project using EasyOCR, ChromaDB, and Groq Llama&nbsp;3.3&nbsp;70B, with hybrid retrieval and exact-reference matching in its fallback path.</p>
            <p class="flagship-result"><a class="plain-link" href="https://github.com/fadhlillah2/llama-docs-auditor/blob/609c0a07f0828c2dbf691fa15d898ff7ab2a8691/README.md#L72" target="_blank" rel="noopener">Project README</a> reports <strong>88%+ OCR accuracy</strong>; the measurement method is not documented in the linked source. Read the writeup for the implementation and known limitations.</p>
            <ul class="tag-row">
              <li>RAG</li><li>LangChain</li><li>ChromaDB</li><li>Groq · Llama 3.3 70B</li><li>EasyOCR</li><li>Flask</li><li>Next.js / TypeScript</li>
            </ul>
            <div class="flagship-cta">
              <a href={base + "/writeups/hybrid-retrieval"} class="btn btn-solid btn-sm">Read the writeup</a>
              <a href="https://github.com/fadhlillah2/llama-docs-auditor" class="btn btn-ghost btn-sm" target="_blank" rel="noopener" aria-label="View the Contract Advisor RAG source on GitHub (opens in new tab)">View source <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></a>
              <span class="flagship-cred">Credential ID 032/H8/META/XI/2025</span>
            </div>
          </div>
          <div class="flagship-term" aria-hidden="true">
            <div class="term-bar"><span class="term-dot term-dot-r"></span><span class="term-dot term-dot-y"></span><span class="term-dot term-dot-g"></span><span class="term-title">contract-advisor</span></div>
            <pre class="flagship-code" tabindex="-1"><code><span class="tmut">&gt;</span> <span class="ts">"Apa kewajiban para pihak dalam kontrak?"</span>
<span class="tmut">ocr:</span>   easyocr(en, id)
<span class="tmut">chunks:</span> chromadb &middot; hybrid fallback
<span class="tmut">model:</span> groq &middot; llama-3.3-70b-versatile
<span class="tc">&#10003;</span> answer from retrieved contract clauses</code></pre>
          </div>
        </article>

        <!-- Backend systems card: real Go artifact, facts from the repo README -->
        <article class="flagship" data-reveal>
          <div class="flagship-body">
            <p class="flagship-badge">Backend systems &middot; Go</p>
            <h3 class="flagship-title">Distributed Rate Limiter (Go)</h3>
            <p class="flagship-desc">A Go rate-limiting service implementing fixed window, sliding window, and token bucket, with Redis-backed atomic Lua scripts and HTTP middleware. Tests and race checks passed in CI; Redis tests use miniredis.</p>
            <p class="flagship-result">Statement coverage: <strong>86.1% limiter &middot; 74.4% middleware</strong>. Whole repository: 51.2%; server and examples: 0%.</p>
            <ul class="tag-row">
              <li>Go</li><li>Redis &middot; Lua</li><li>HTTP middleware</li><li>Docker</li><li>Race checks</li>
            </ul>
            <div class="flagship-cta">
              <a href="https://github.com/fadhlillah2/rate-limiter-project-go" class="btn btn-ghost btn-sm" target="_blank" rel="noopener" aria-label="View the Rate Limiter source on GitHub (opens in new tab)">View source <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></a>
              <a href="https://github.com/fadhlillah2/rate-limiter-project-go/actions/runs/35127882994" class="plain-link" target="_blank" rel="noopener" aria-label="View verified Go checks for commit cb4bced on GitHub (opens in new tab)">Verified CI &middot; cb4bced</a>
            </div>
          </div>
          <div class="flagship-term" aria-hidden="true">
            <div class="term-bar"><span class="term-dot term-dot-r"></span><span class="term-dot term-dot-y"></span><span class="term-dot term-dot-g"></span><span class="term-title">rate-limiter</span></div>
            <pre class="flagship-code" tabindex="-1"><code><span class="tmut">test:</span> loopback HTTP &middot; fixed window
<span class="tmut">requests 1&ndash;5:</span> <span class="tc">200 OK</span>
<span class="tmut">request 6:</span>    <span class="tm">429 Too Many Requests</span>
<span class="tmut">Retry-After:</span> 1
<span class="tc">&#10003;</span> integration test passed</code></pre>
          </div>
        </article>

        <!-- Interactive experiment: real WebGL2 demo; live build and source are linked -->
        <article class="flagship" data-reveal>
          <div class="flagship-body">
            <p class="flagship-badge">Interactive experiment &middot; WebGL2</p>
            <h3 class="flagship-title">Tower Stack — a hand-written WebGL2 game</h3>
            <p class="flagship-desc">A block-stacking game rendered by a small hand-written WebGL2 pipeline: one shader program, one cube mesh, fog and a floor grid in the fragment shader. No engine, no runtime dependencies.</p>
            <p class="flagship-result">Vanilla JS + GLSL; the repo ships unit tests, a Chrome-headless smoke test, and a real screenshot of the live build.</p>
            <ul class="tag-row">
              <li>WebGL2</li><li>GLSL</li><li>Vanilla JS</li><li>Canvas</li>
            </ul>
            <div class="flagship-cta">
              <a href="https://fadhlillah2.github.io/tower-stack-webgl/" class="btn btn-solid btn-sm" target="_blank" rel="noopener" aria-label="Play the Tower Stack demo (opens in new tab)">Play the demo</a>
              <a href="https://github.com/fadhlillah2/tower-stack-webgl" class="btn btn-ghost btn-sm" target="_blank" rel="noopener" aria-label="View the Tower Stack source on GitHub (opens in new tab)">View source <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></a>
            </div>
          </div>
          <div class="flagship-shot" aria-hidden="true">
            <img src={base + "/assets/img/tower-stack.png"} alt="" loading="lazy" decoding="async" width="1200" height="675" />
          </div>
        </article>

        <!-- Early-practice archive: native <details>, collapsed by default so the
             2021 JS practice apps don't visually compete with the flagship work above -->
        <details class="early-practice" data-reveal>
          <summary><span class="ep-prompt" aria-hidden="true">$</span> ls early-practice/ <span class="ep-note">— 9 vanilla-JS mini-apps (2021) &middot; all live demos</span><span class="ep-chevron" aria-hidden="true"></span></summary>
          <ul class="ep-grid">
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/calculator-app/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/calculator.jpg"} alt="Calculator app screenshot" loading="lazy" decoding="async" width="800" height="600">
                <span class="ep-name">Calculator <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/weather-app/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/weather.jpg"} alt="Weather app screenshot" loading="lazy" decoding="async" width="800" height="600">
                <span class="ep-name">Weather <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/ramadhanCountdownTimer-app/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/countdown.jpg"} alt="Ramadan countdown timer screenshot" loading="lazy" decoding="async" width="800" height="544">
                <span class="ep-name">Ramadan countdown <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/quiz-app/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/quiz.jpg"} alt="Quiz app screenshot" loading="lazy" decoding="async" width="800" height="544">
                <span class="ep-name">Quiz <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/ticTacToe-game/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/tictac.jpg"} alt="Tic-tac-toe game screenshot" loading="lazy" decoding="async" width="800" height="600">
                <span class="ep-name">Tic-tac-toe <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/drumKit-game/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/drum1.jpg"} alt="Drum kit game screenshot" loading="lazy" decoding="async" width="800" height="600">
                <span class="ep-name">Drum kit <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/toDoList-app/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/toDoList.jpg"} alt="To-do list app screenshot" loading="lazy" decoding="async" width="800" height="600">
                <span class="ep-name">To-do list <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/whackAMoncik-game/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/moncik.jpg"} alt="Whack-a-mole game screenshot" loading="lazy" decoding="async" width="800" height="600">
                <span class="ep-name">Whack-a-mole <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
            <li class="ep-item">
              <a href="https://fadhlillah2.github.io/piano-game/" target="_blank" rel="noopener">
                <img src={base + "/assets/img/piano1.jpg"} alt="Piano game screenshot" loading="lazy" decoding="async" width="800" height="600">
                <span class="ep-name">Piano <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></span>
              </a>
            </li>
          </ul>
        </details>

      </div>
    </section>
