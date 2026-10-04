<script>
  import LookButtons from "./LookButtons.svelte";
</script>

<!-- Time-of-day switch. The look itself is picked by the inline boot script in app.html;
     enhance.js only wires these buttons and remembers the choice. On narrow screens this pill
     is hidden and the same buttons live in the menu drawer (Topbar.svelte), and on the home page
     at 921-1439px it stays hidden until the visitor scrolls, so nothing floats over the hero
     buttons. An <aside> keeps the control inside a landmark. -->
<aside class="look-switch" aria-label="Time of day">
  <LookButtons />
</aside>
