<!-- Ask-the-CV widget. Unlike the rest of the page, behaviour lives here rather than in
     enhance.js: the markup must not exist at all unless a chat backend answered the probe, and
     the published build has no backend. During prerender `endpoint` is null, so the static HTML
     ships zero chat markup and the live site makes no request. -->
<script>
  import { onMount, tick } from "svelte";
  import { resolveEndpoint, probe, ask } from "$lib/chat.js";

  let endpoint = $state(null);
  let model = $state("");
  let open = $state(false);
  let busy = $state(false);
  let draft = $state("");
  let error = $state("");
  let messages = $state([]);

  let logEl;
  let inputEl;
  let launcherEl;

  onMount(async () => {
    const url = resolveEndpoint();
    if (!url) return;
    const found = await probe(url);
    if (found === null) return;
    model = found;
    endpoint = url;
  });

  async function toggle() {
    open = !open;
    if (!open) return;
    await tick();
    inputEl?.focus();
  }

  function onKeydown(event) {
    if (event.key === "Escape" && open) {
      open = false;
      launcherEl?.focus();
    }
  }

  async function submit() {
    const question = draft.trim();
    if (!question || busy) return;
    draft = "";
    error = "";
    messages.push({ role: "user", content: question });
    busy = true;
    await scrollLog();
    try {
      const reply = await ask(endpoint, $state.snapshot(messages));
      messages.push({ role: "assistant", content: reply });
    } catch (e) {
      error = e.name === "AbortError" ? "The answer took too long." : e.message;
    } finally {
      busy = false;
      await scrollLog();
      inputEl?.focus();
    }
  }

  async function scrollLog() {
    await tick();
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if endpoint}
  <button
    type="button"
    class="chat-fab"
    class:is-open={open}
    aria-expanded={open}
    aria-controls="chat-panel"
    aria-label={open ? "Close the CV assistant" : "Ask about Fadhlillah's work"}
    bind:this={launcherEl}
    onclick={toggle}
  >
    <svg class="ico" aria-hidden="true"><use href="#i-cpu" /></svg>
  </button>

  {#if open}
    <div id="chat-panel" class="chat-panel" role="dialog" aria-label="Ask about Fadhlillah's work">
      <header class="chat-bar">
        <span class="chat-dot" aria-hidden="true"></span>
        <span class="chat-title">ask the CV</span>
        <span class="chat-model">{model}</span>
      </header>

      <ol class="chat-log" bind:this={logEl} aria-live="polite" aria-busy={busy}>
        {#if messages.length === 0}
          <li class="chat-msg chat-msg-note">
            Answers come from the CV on this site — experience, stack, scale, availability. Anything
            it cannot source, it says so instead of guessing.
          </li>
        {/if}
        {#each messages as message, i (i)}
          <li class="chat-msg chat-msg-{message.role}">
            <span class="chat-who">{message.role === "user" ? "you" : "reply"}</span>
            <p>{message.content}</p>
          </li>
        {/each}
        {#if busy}
          <li class="chat-msg chat-msg-assistant chat-msg-wait">
            <span class="chat-who">reply</span>
            <p>thinking…</p>
          </li>
        {/if}
        {#if error}
          <li class="chat-msg chat-msg-error" role="alert">{error}</li>
        {/if}
      </ol>

      <form class="chat-form" onsubmit={(event) => { event.preventDefault(); submit(); }}>
        <input
          id="chat-input"
          type="text"
          aria-label="Your question"
          autocomplete="off"
          maxlength="2000"
          placeholder="What is your Java experience?"
          bind:value={draft}
          bind:this={inputEl}
          disabled={busy}
        />
        <button type="submit" class="chat-send" disabled={busy || !draft.trim()}>Ask</button>
      </form>
    </div>
  {/if}
{/if}
