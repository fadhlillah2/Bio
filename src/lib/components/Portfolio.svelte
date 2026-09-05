<script>
  import { base } from "$app/paths";
</script>

    <!-- ======= Portfolio ======= -->
    <section id="portfolio" class="portfolio">
      <div class="wrap">

        <header class="section-head">
          <p class="section-index">03 &mdash; Selected work</p>
          <h2>Flagship AI &amp; backend systems</h2>
          <p class="section-deck">Flagship engineering work first; nine early JavaScript practice projects from 2021 remain available below.</p>
        </header>

        <!-- Flagship case study: designed card (no screenshot), links to the live repo -->
        <article class="flagship" data-reveal>
          <div class="flagship-body">
            <p class="flagship-badge">Top 50 &middot; Meta Llama Hackathon 2025 &middot; Hacktiv8 Indonesia</p>
            <h3 class="flagship-title">High-Precision Contract Advisor RAG</h3>
            <p class="flagship-desc">A retrieval-augmented contract analysis system: ingests scanned and digital contracts, runs EasyOCR optimized for Indonesian contract documents (preserving PASAL/AYAT/BAB structure), and answers questions with hybrid retrieval over a ChromaDB vector store and Groq Llama&nbsp;3.3&nbsp;70B inference.</p>
            <p class="flagship-result">EasyOCR ingestion at <strong>88%+ accuracy</strong> on scanned Indonesian contracts &middot; PASAL/AYAT/BAB structure preserved</p>
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
<span class="tmut">ocr:</span>   easyocr(id) &middot; <span class="tm">88%+</span> accuracy
<span class="tmut">chunks:</span> hybrid search &rarr; chromadb
<span class="tmut">model:</span> groq &middot; llama-3.3-70b-versatile
<span class="tc">&#10003;</span> answer from retrieved contract clauses</code></pre>
          </div>
        </article>

        <!-- Backend systems card: real Go artifact, facts from the repo README -->
        <article class="flagship" data-reveal>
          <div class="flagship-body">
            <p class="flagship-badge">Backend systems &middot; Go</p>
            <h3 class="flagship-title">Distributed Rate Limiter (Go)</h3>
            <p class="flagship-desc">A Go rate-limiting service implementing fixed window, sliding window, and token bucket, with Redis-backed atomic Lua scripts and HTTP middleware. Includes 80%+ test coverage, Docker Compose setup, and repository benchmarks.</p>
            <ul class="tag-row">
              <li>Go</li><li>Redis &middot; Lua</li><li>HTTP middleware</li><li>Docker</li><li>80%+ test coverage</li>
            </ul>
            <div class="flagship-cta">
              <a href="https://github.com/fadhlillah2/rate-limiter-project-go" class="btn btn-ghost btn-sm" target="_blank" rel="noopener" aria-label="View the Rate Limiter source on GitHub (opens in new tab)">View source <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></a>
            </div>
          </div>
          <div class="flagship-term" aria-hidden="true">
            <div class="term-bar"><span class="term-dot term-dot-r"></span><span class="term-dot term-dot-y"></span><span class="term-dot term-dot-g"></span><span class="term-title">rate-limiter</span></div>
            <pre class="flagship-code" tabindex="-1"><code><span class="tmut">$</span> hammer the endpoint&hellip;
<span class="tmut">algo:</span>  fixed &middot; sliding &middot; token bucket
<span class="ts">HTTP/1.1</span> <span class="tc">200 OK</span>
<span class="ts">HTTP/1.1</span> <span class="tm">429 Too Many Requests</span>
<span class="tc">&#10003;</span> distributed via redis &middot; atomic lua</code></pre>
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
