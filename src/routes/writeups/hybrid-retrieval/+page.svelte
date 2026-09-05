<script>
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import IconSprite from "$lib/components/IconSprite.svelte";
  import { enhance } from "$lib/enhance.js";

  // Svelte reads { } in markup as expressions and ends a <script> at the first
  // literal closing tag, so the JSON-LD ships verbatim as one {@html} string with \/ escaped.
  const jsonLd = `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Hybrid retrieval for scanned Indonesian contracts",
    "description": "Why vector search can miss exact clause references, how the retrieval layer combines semantic search, TF-IDF and a literal fallback, and which limitations remain.",
    "datePublished": "2026-08-17",
    "dateModified": "2026-09-05",
    "inLanguage": "en",
    "author": {
      "@type": "Person",
      "name": "Fadhlillah",
      "url": "https://fadhlillah2.github.io/Bio/",
      "jobTitle": "Backend Software Engineer"
    },
    "image": "https://fadhlillah2.github.io/Bio/assets/img/og-writeup-retrieval.png",
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://fadhlillah2.github.io/Bio/writeups/hybrid-retrieval.html" },
    "isBasedOn": "https://github.com/fadhlillah2/llama-docs-auditor",
    "about": ["Retrieval-Augmented Generation", "Information retrieval", "Optical character recognition", "Hybrid search"],
    "keywords": "RAG, hybrid search, TF-IDF, EasyOCR, ChromaDB, LangChain, contract analysis"
  }
  <\/script>`;

  onMount(() => enhance());
</script>

<svelte:head>
  <title>Hybrid retrieval for scanned Indonesian contracts — Fadhlillah</title>
  <meta name="description" content="Why vector search can miss exact clause references, and how Contract Advisor RAG combines semantic search, TF-IDF, and a literal fallback — with its limits.">
  <link rel="canonical" href="https://fadhlillah2.github.io/Bio/writeups/hybrid-retrieval.html">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Fadhlillah — Bio">
  <meta property="og:title" content="Hybrid retrieval for scanned Indonesian contracts">
  <meta property="og:description" content="Why vector search can miss exact clause references, how the hybrid retrieval layer works, and which limitations remain.">
  <meta property="og:url" content="https://fadhlillah2.github.io/Bio/writeups/hybrid-retrieval.html">
  <meta property="og:image" content="https://fadhlillah2.github.io/Bio/assets/img/og-writeup-retrieval.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Hybrid retrieval for scanned Indonesian contracts">
  <meta name="twitter:description" content="Why vector search can miss exact clause references — and how hybrid retrieval handles them.">
  <meta name="twitter:image" content="https://fadhlillah2.github.io/Bio/assets/img/og-writeup-retrieval.png">

  {@html jsonLd}
</svelte:head>

  <a href="#main" class="skip-link">Skip to content</a>

  <div class="read-progress" aria-hidden="true"></div>

  <IconSprite />

  <header class="topbar is-stuck" id="topbar">
    <div class="topbar-inner">
      <a class="brand" href="{base}/">
        <span class="brand-mark" aria-hidden="true">F</span>
        <span class="brand-text">
          <span class="brand-name">Fadhlillah</span>
          <span class="brand-role">Backend &middot; AI Native</span>
        </span>
      </a>
      <div class="topbar-actions">
        <a href="{base}/#portfolio" class="btn btn-quiet btn-sm"><svg class="ico" aria-hidden="true"><use href="#i-arrow-back"/></svg> Back to portfolio</a>
        <a href="{base}/cv/resume-onepager-v1.9.pdf" class="btn btn-solid btn-sm" download="Fadhlillah - Backend Software Engineer - CV (1 page).pdf">Download CV</a>
      </div>
    </div>
  </header>

  <main id="main" tabindex="-1">
    <article class="article">
      <div class="wrap article-wrap">

        <header class="article-head" data-reveal>
          <p class="section-index">Writeup &mdash; Retrieval</p>
          <h1>Hybrid retrieval for scanned Indonesian contracts</h1>
          <p class="article-deck">A contract question like <em>“what does PASAL 5 say?”</em> can fail in a RAG pipeline in two independent places — and neither is the language model. Here is how the retrieval layer in Contract Advisor RAG is put together, and which limitations remain.</p>
          <p class="article-meta">
            <span>August 2026</span>
            <span aria-hidden="true">·</span>
            <span>~6 min read</span>
            <span aria-hidden="true">·</span>
            <a href="https://github.com/fadhlillah2/llama-docs-auditor" target="_blank" rel="noopener">Source on GitHub <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></a>
          </p>
        </header>

        <p>The project is a retrieval-augmented contract advisor: you upload a contract — PDF, DOCX, or a photo of a printed page — and ask questions about it. It placed Top 50 at the Meta Llama Hackathon 2025. The generation step is not the bottleneck explored here: even a capable language model cannot answer from context it never receives. The difficulty is getting the right text there at all, and scanned Indonesian contracts expose two different failure modes.</p>

        <h2>Two failure modes that look like one bug</h2>

        <p>The first failure is optical. A phone photo of a printed contract gives EasyOCR a page with uneven lighting, compression noise, and a slight skew. Get the preprocessing wrong and <code>PASAL</code> comes back as <code>PASAI</code> or <code>PASAL  5</code> with a doubled space — the clause is in the extracted text, but no longer matches anything a user would type.</p>

        <p>The second failure is retrieval. Even with clean text, a specific clause number is a poor fit for embedding search. Embeddings encode meaning, and many contract clauses appear semantically similar to a sentence transformer: obligations between parties. The identifier is the decisive part of the query, yet it carries little semantic meaning. Ask for clause 5 and the results can drift to neighboring clauses — plausible semantic matches, but the wrong answer source.</p>

        <p>Both failures produce the same symptom: a confident answer about the wrong clause. That is why they are worth separating.</p>

        <h2>OCR: six variants, then pick a winner</h2>

        <p>Rather than tuning one preprocessing chain, the pipeline runs six and lets the results compete. From <a href="https://github.com/fadhlillah2/llama-docs-auditor/blob/main/rag/easyocr_implementation.py" target="_blank" rel="noopener">easyocr_implementation.py</a>: the original image, grayscale, denoised (<code>fastNlMeansDenoising</code>), CLAHE contrast enhancement at <code>clipLimit=2.0</code>, a 3×3 sharpening kernel, and finally Otsu binarization. Each variant is written to disk, run through EasyOCR with Indonesian and English enabled, and scored.</p>

        <p>The selection rule is the part I would defend in review:</p>

        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <pre class="code-block" tabindex="0" role="region" aria-label="Code sample"><code>best_result = max(all_results, key=lambda x: x['confidence'] * x['word_count'])</code></pre>

        <p>Confidence alone is the obvious choice and the wrong one. An aggressive binarization pass can destroy most of the page while reading the few surviving words with high confidence — a strong score carrying almost no document. Multiplying by word count makes a variant earn its confidence across the whole page, so a slightly noisier read of the full contract beats a pristine read of one heading. It is a crude objective function, but it encodes the requirement that matters here: coverage is not optional when the answer might be in the clause that was discarded.</p>

        <p>As each detection comes out of EasyOCR it is cleaned in place: whitespace collapsed, a fixed list of stray punctuation stripped, and a small substitution table applied for recurring OCR confusions. It does not attempt to parse the document into a clause tree.</p>

        <h2>Retrieval: two lists, weighted, plus a bonus</h2>

        <p>The retriever runs both strategies and merges them rather than choosing between them. Semantic search returns 15 candidates; a TF-IDF keyword search returns 10. The merge in <a href="https://github.com/fadhlillah2/llama-docs-auditor/blob/main/rag/retriever.py" target="_blank" rel="noopener">retriever.py</a> weights them 0.7 to 0.3 in favor of semantics — but the detail that does the real work is the third term:</p>

        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <pre class="code-block" tabindex="0" role="region" aria-label="Code sample"><code>combined_scores[doc_id]['combined_score'] += keyword_score + 0.1  <span class="tmut"># bonus for appearing in both</span></code></pre>

        <p>A chunk that both searches surface independently gets a flat bonus on top of its weighted sum. The methods use different signals: semantic search can drift to neighboring clauses, while TF-IDF can match boilerplate that shares vocabulary. Agreement between them is therefore useful evidence rather than a louder version of one signal. Weighted sums alone let a single strong semantic hit dominate; the bonus rewards consensus instead.</p>

        <p>On top of the merge sits a domain-specific boost: a tiered keyword dictionary (<em>obligations, liability, breach</em> ranked above <em>party, shall, whereas</em>, ranked above <em>jurisdiction, governing</em>) that nudges contract-bearing chunks upward. And when a query names a section explicitly, the retriever checks whether any merged result actually contains that reference — if none does, it falls back to a literal text scan of the chunks and injects those matches at the top with a hard-coded score of 2.0.</p>

        <p>That fallback is the practical answer to “why not just use vector search.” Semantic retrieval fits <em>“what happens if we terminate early?”</em> but is a poor fit for exact identifier lookup such as <em>“what does clause 5 say?”</em>. The literal path handles that narrower job directly — but only for queries that need it.</p>

        <h2>What changed — and what remains</h2>

        <p>Three findings matter here. The first is now fixed, but it remains useful because the regression it exposed is more instructive than the patch itself.</p>

        <p><strong>The exact-match fallback was hard-coded.</strong> <span class="tag-fixed">Fixed Aug 2026</span> The pattern extraction in <code>_exact_section_search</code> tested for <code>'IV.15' in query</code> — a debugging shortcut from the hackathon that never got generalized, so every other clause reference fell through to semantic search. All section-detection paths now read from one shared <code>SECTION_PATTERNS</code> list.</p>

        <p>Finishing it surfaced a second bug, this time in the fix. Matching needs to tolerate the doubled spacing OCR leaves behind, so the reference is spliced with <code>\s+</code> — but escaping the whole string first turns its spaces into <code>\␠</code>, and the <code>\s+</code> then attaches to the backslash:</p>

        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <pre class="code-block" tabindex="0" role="region" aria-label="Code sample"><code><span class="tmut"># wrong: matches a literal backslash followed by one or more 's'</span>
re.sub(r'\s+', r'\\s+', re.escape("Section II.3"))  <span class="tmut">→</span> Section\\s+II\.3

<span class="tmut"># right: escape per word, then rejoin</span>
r'\s+'.join(re.escape(p) for p in "Section II.3".split())  <span class="tmut">→</span> Section\s+II\.3</code></pre>

        <p>Every prefixed reference failed silently, and the tests still passed — the bare <code>II.3</code> form matched the same chunk and masked it. What caught it was reading the debug trace rather than the green checkmark. The regression test now puts the bare form in an earlier chunk so the prefixed reference has to win on its own; the suite is 11 cases, and I checked that it fails when either bug is put back — one failure for the escaping, six for the hard-coding.</p>

        <p><strong>The section patterns still target English conventions.</strong> Those regexes match <code>Section IV.15</code> and <code>Article IV</code>. The OCR layer handles <code>PASAL</code> and <code>AYAT</code>, but the retriever never learned to look for them, so the exact path does not currently fire for the Indonesian documents the OCR pipeline was built for. The two halves were developed against different sample documents and never met.</p>

        <p><strong>Retrieval quality is not measured.</strong> There is an evaluation harness, and it does record real numbers — 9 of 9 questions answered, 15.5s average response, context utilization at 0.35. But the RAGAS metrics in the committed results are all zero because the runs had <code>include_ragas: false</code>, so faithfulness and context precision are unmeasured rather than good. Everything above is an argument from design, not from measurement. The weighting is 0.7/0.3 and the consensus bonus is 0.1 because those were reasonable starting values, not because a sweep said so.</p>

        <p>That last gap matters most. The architecture separates OCR corruption from retrieval mismatch, but until RAGAS is enabled and the weights are tuned against measured results, the tuning remains engineering judgment rather than evidence.</p>

        <p class="article-close">Code: <a href="https://github.com/fadhlillah2/llama-docs-auditor" target="_blank" rel="noopener">github.com/fadhlillah2/llama-docs-auditor</a> — retrieval in <code>rag/retriever.py</code>, OCR in <code>rag/easyocr_implementation.py</code>, and the fix described above in <a href="https://github.com/fadhlillah2/llama-docs-auditor/commit/f47b6c4" target="_blank" rel="noopener">commit f47b6c4</a> with its tests in <code>tests/test_section_references.py</code>.</p>

        <nav class="article-nav" data-reveal>
          <a href="{base}/#portfolio" class="btn btn-ghost btn-sm"><svg class="ico" aria-hidden="true"><use href="#i-arrow-back"/></svg> Back to portfolio</a>
          <a href="{base}/#contact" class="btn btn-solid btn-sm">Get in touch</a>
        </nav>

      </div>
    </article>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-inner">
      <div class="footer-brand">
        <p class="footer-name">Fadhlillah</p>
        <p class="footer-tag">Backend Software Engineer &middot; AI Native Engineer &middot; Jakarta (UTC+7)</p>
      </div>
      <nav class="footer-links" aria-label="Profiles">
        <a href="https://github.com/fadhlillah2" target="_blank" rel="noopener">GitHub <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></a>
        <a href="https://www.linkedin.com/in/fadhlillah2" target="_blank" rel="noopener">LinkedIn <svg class="ico" aria-hidden="true"><use href="#i-arrow-out"/></svg></a>
        <a href="mailto:fadhlillah949699@gmail.com">Email</a>
      </nav>
      <p class="footer-colophon">
        <span>Prerendered with SvelteKit &middot; handwritten CSS and JavaScript &middot; self-hosted fonts.</span>
        <span>Updated <time datetime="2026-09-05">September 2026</time></span>
      </p>
    </div>
  </footer>

  <a href="#top" class="fab fab-top" aria-label="Back to top"><svg class="ico" aria-hidden="true"><use href="#i-arrow-up"/></svg></a>

