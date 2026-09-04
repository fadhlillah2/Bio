<script>
  import { onMount } from "svelte";
  import { enhance } from "$lib/enhance.js";
  import HomeHead from "$lib/components/HomeHead.svelte";
  import IconSprite from "$lib/components/IconSprite.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import Hero from "$lib/components/Hero.svelte";
  import Facts from "$lib/components/Facts.svelte";
  import About from "$lib/components/About.svelte";
  import Portfolio from "$lib/components/Portfolio.svelte";
  import Resume from "$lib/components/Resume.svelte";
  import Skills from "$lib/components/Skills.svelte";
  import Services from "$lib/components/Services.svelte";
  import Testimonials from "$lib/components/Testimonials.svelte";
  import Contact from "$lib/components/Contact.svelte";
  import SiteFooter from "$lib/components/SiteFooter.svelte";

  // enhance() returns its own cleanup; Svelte runs it on teardown.
  onMount(() => enhance());
</script>

<HomeHead />

<a href="#main" class="skip-link">Skip to content</a>

<!-- Icon set: drawn here as line primitives so the page ships no icon font -->
<IconSprite />

<Topbar />

<main id="main" tabindex="-1">
  <Hero />
  <Facts />
  <About />
  <Portfolio />
  <Resume />
  <Skills />
  <Services />
  <Testimonials />
  <Contact />
</main><!-- End #main -->

<SiteFooter />
