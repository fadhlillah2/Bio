<script>
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { enhance } from "$lib/enhance.js";
  import IconSprite from "$lib/components/IconSprite.svelte";
  import SiteFooter from "$lib/components/SiteFooter.svelte";
  import LookSwitch from "$lib/components/LookSwitch.svelte";

  // Svelte reads { } in markup as expressions and ends a <script> at the first
  // literal closing tag, so the JSON-LD ships verbatim as one {@html} string with \/ escaped.
  const jsonLd = `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "Building the Project Management backend for FOX Asset",
    "description": "Building the FOX Asset Project Management backend: 21 REST endpoints, 10 models, Kanban and timeline support, and S-Curve planned-vs-actual analytics.",
    "datePublished": "2026-09-16",
    "dateModified": "2026-09-16",
    "inLanguage": "en",
    "author": {
      "@type": "Person",
      "name": "Fadhlillah",
      "url": "https://fadhlillah2.github.io/Bio/",
      "jobTitle": "Backend Software Engineer"
    },
    "image": "https://fadhlillah2.github.io/Bio/assets/img/og-writeup-fox-asset-project-management.png",
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html" },
    "about": ["Backend engineering", "Project management software", "Django REST Framework"],
    "keywords": "Django REST Framework, Kanban, timeline, S-Curve, project management, multi-tenant SaaS"
  }
  <\/script>`;

  onMount(() => enhance());
</script>

<svelte:head>
  <title>Building the Project Management backend for FOX Asset — Fadhlillah</title>
  <meta name="description" content="Building the FOX Asset Project Management backend: 21 REST endpoints, 10 models, Kanban and timeline support, and S-Curve planned-vs-actual analytics.">
  <link rel="canonical" href="https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Fadhlillah — Bio">
  <meta property="og:title" content="Building the Project Management backend for FOX Asset">
  <meta property="og:description" content="Module-level backend ownership: project workflows, planned-vs-actual analytics, access controls, and 196 unit tests.">
  <meta property="og:url" content="https://fadhlillah2.github.io/Bio/writeups/fox-asset-project-management.html">
  <meta property="og:image" content="https://fadhlillah2.github.io/Bio/assets/img/og-writeup-fox-asset-project-management.png">
  <meta property="og:image:alt" content="Building the Project Management backend for FOX Asset — Fadhlillah">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Building the Project Management backend for FOX Asset">
  <meta name="twitter:description" content="A commercial backend delivery supporting project workflows, Kanban and timeline views, and planned-vs-actual reporting.">
  <meta name="twitter:image" content="https://fadhlillah2.github.io/Bio/assets/img/og-writeup-fox-asset-project-management.png">

  {@html jsonLd}
</svelte:head>

<a href="#main" class="skip-link">Skip to content</a>
<IconSprite />
<header class="topbar is-stuck" id="topbar">
  <div class="topbar-inner">
    <a class="brand" href="{base}/">
      <span class="brand-mark" aria-hidden="true">F</span>
      <span class="brand-text"><span class="brand-name">Fadhlillah</span><span class="brand-role">Backend &middot; AI Native</span></span>
    </a>
    <div class="topbar-actions">
      <a href="{base}/#portfolio" class="btn btn-quiet btn-sm">Back to work</a>
    </div>
  </div>
</header>

<main id="main" tabindex="-1">
  <article class="article">
    <div class="wrap article-wrap">
      <header class="article-head" data-reveal>
        <p class="section-index">Commercial Delivery &mdash; Backend</p>
        <h1>Building the Project Management backend for FOX Asset</h1>
        <p class="article-deck">Project workflows and planned-vs-actual reporting inside a multi-tenant asset management and maintenance SaaS.</p>
        <p class="article-meta"><time datetime="2026-09-16">September 2026</time><span aria-hidden="true">&middot;</span>Module-level delivery account</p>
      </header>

      <h2>Context and My Scope</h2>
      <p>FOX Asset, developed by Infinity Wave Sdn Bhd, is a multi-tenant asset management and maintenance (CMMS) SaaS built on Django REST Framework. I work remotely as a freelance backend software engineer. Within that product, I solely built the <strong>Project Management module backend</strong>.</p>

      <h2>What I Delivered</h2>
      <p>The module comprises <strong>21 REST endpoints and 10 models</strong>. Its backend supports Kanban and timeline views, weightage distribution, and S-Curve planned-vs-actual analytics with adaptive daily, weekly, and monthly bucketing.</p>
      <p>These capabilities support organizing project work through Kanban and timeline views, distributing weightage, and comparing planned versus actual progress at different time intervals.</p>

      <h2>Access Controls and Tests</h2>
      <p>I wrote <strong>196 unit tests for Project Management</strong>. My broader FOX Asset work also includes role-based access control, field-level write restrictions, and cross-company data isolation.</p>

      <h2>Published Experience</h2>
      <p>This module-level account draws on my published <a href="{base}/#resume">FOX Asset experience</a> and <a href="{base}/cv/resume-v8.10.pdf" download="Fadhlillah - Backend Software Engineer - CV (full).pdf">full CV</a>; client source code and internal materials are not reproduced here.</p>
      <p>More engineering work: the <a href="{base}/writeups/hybrid-retrieval">contract retrieval writeup</a> and <a href="https://github.com/fadhlillah2/rate-limiter-project-go" target="_blank" rel="noopener">Go rate limiter source</a>.</p>

      <h2>Work with Me</h2>
      <p><strong>Hiring a backend engineer?</strong> Review my production experience and share the role, stack, and working arrangement. <strong>Planning a project?</strong> Share the workflow you need to support, the current system, and your target delivery date.</p>
      <nav class="article-nav" aria-label="Next steps">
        <a href="{base}/#resume" class="btn btn-ghost btn-sm">Review experience &amp; CV</a>
        <a href="{base}/#services" class="btn btn-ghost btn-sm">Explore services</a>
        <a href="{base}/#contact" class="btn btn-solid btn-sm">Discuss your role or project</a>
      </nav>
    </div>
  </article>
</main>

<SiteFooter />
<LookSwitch />
