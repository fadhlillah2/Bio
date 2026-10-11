<script>
  import { onMount } from "svelte";
  import { base } from "$app/paths";

  let root;
  let error = "";
  let state = { status: "ready", paused: false, muted: false, score: 0, coins: 0, lives: 3, time: 400 };
  onMount(() => {
    let disposed = false, game;
    import("$lib/mario/runtime.js").then(({ mountMario }) => {
      if (!disposed) game = mountMario(root, { onState: next => { state = next; } });
    }).catch(cause => {
      if (!disposed) error = "Mario could not start. Reload this page to try again. " + cause.message;
    });
    return () => { disposed = true; game?.destroy(); };
  });
</script>

<svelte:head>
  <title>Super Mario Bros. — World 1-1 | Fadhlillah</title>
  <meta name="description" content="Play World 1-1 with keyboard or touch controls." />
</svelte:head>

<main class="mario-page">
  <header>
    <a href={base + "/#portfolio"}>Back to Bio</a>
    <h1>Super Mario Bros. <span>World 1-1</span></h1>
  </header>
  <section bind:this={root} data-mario aria-label="Super Mario Bros. game" aria-describedby="mario-instructions">
    <div class="game-stage">
      <canvas width="256" height="240" tabindex="0" aria-label="World 1-1 game screen" aria-describedby="mario-instructions">
        Mario needs JavaScript and a browser with Canvas support.
      </canvas>
      <div class="game-overlay" data-overlay>
        <strong data-overlay-title>Ready for World 1-1</strong>
        <button type="button" data-action="start">Start game</button>
      </div>
    </div>
    <div class="game-panel">
      <div class="game-actions" aria-label="Game actions">
        <button type="button" data-action="pause" disabled>Pause</button>
        <button type="button" data-action="mute" aria-pressed="false">Mute</button>
        <button type="button" data-action="restart">Restart</button>
      </div>
      <div class="touch-controls" aria-label="Touch controls">
        <div class="directions">
          <button type="button" data-control="left" aria-label="Move left">←</button>
          <button type="button" data-control="down" aria-label="Crouch or enter pipe">↓</button>
          <button type="button" data-control="right" aria-label="Move right">→</button>
        </div>
        <div class="abilities">
          <button type="button" data-control="run">Run / fire</button>
          <button type="button" data-control="jump">Jump</button>
        </div>
      </div>
      <p id="mario-instructions">
        ← → or A/D move · ↓ or S crouch/pipe · Space/Z jump · Shift/X run/fire.
        Enter starts/resumes · Esc/P pauses · M mutes.
      </p>
      <p class="game-score" aria-live="off">
        Score <span data-score>{state.score}</span> · Coins <span data-coins>{state.coins}</span> ·
        Lives <span data-lives>{state.lives}</span> · Time <span data-time>{state.time}</span>
      </p>
      <p class="game-status" data-announcement role="status" aria-live="polite" aria-atomic="true"></p>
    </div>
  </section>
  {#if error}<p class="game-error" role="alert">{error}</p>{/if}
  <noscript>Enable JavaScript to play Mario. The controls above describe how to play.</noscript>
</main>

<style>
  .mario-page { max-width: 1080px; margin: auto; padding: 18px 24px; }
  header { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 14px; }
  header a { white-space: nowrap; }
  h1 { margin: 0; font: 600 22px/1.2 var(--sans); text-align: right; }
  h1 span { display: block; font-size: 14px; font-weight: 400; color: var(--text); margin-top: 4px; }
  section { display: grid; gap: 14px; padding: 0; }
  .game-stage { height: min(65dvh, 720px); min-height: 240px; position: relative; display: grid; place-items: center; background: #000; }
  canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; max-width: 100%; }
  .game-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 18px; align-items: center; justify-content: center; background: #0009; color: #fff; }
  .game-stage :global(.game-overlay[hidden]) { display: none; }
  .game-overlay strong { font-size: 22px; text-shadow: 0 2px #000; }
  button { min-height: 44px; min-width: 44px; padding: 8px 14px; border: 1px solid var(--text); border-radius: 6px; color: var(--head); background: var(--ink-1); font: 600 14px var(--sans); cursor: pointer; }
  .game-overlay button { background: var(--accent); color: var(--ink-0); border-color: var(--accent); }
  button:disabled { opacity: .5; cursor: default; }
  .touch-controls :global(button[data-held]), button:active { background: var(--accent); color: var(--ink-0); }
  button:focus-visible, a:focus-visible, canvas:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
  .game-actions { display: flex; justify-content: center; gap: 10px; }
  .touch-controls { display: flex; justify-content: space-between; gap: 12px; margin: 12px auto; max-width: 640px; }
  .directions, .abilities { display: flex; gap: 6px; }
  .touch-controls button { touch-action: none; user-select: none; -webkit-user-select: none; }
  .directions button { font-size: 22px; }
  p { margin: 8px 0 0; }
  #mario-instructions { max-width: 680px; margin: 10px auto 0; font-size: 13px; color: var(--text); text-align: center; line-height: 1.6; }
  .game-score, .game-status { text-align: center; font-size: 13px; }
  .game-status { min-height: 20px; color: var(--accent); }
  .game-error { border: 1px solid var(--accent); padding: 16px; }
  @media (max-width: 600px) {
    .mario-page { padding: 12px; }
    header { margin-bottom: 10px; }
    h1 { font-size: 18px; }
    .game-stage { height: min(52dvh, 480px); }
    .touch-controls { gap: 6px; }
    button { padding: 8px 10px; }
  }
  @media (max-height: 500px) and (min-width: 600px) {
    .mario-page { padding: 8px 16px; }
    header { margin-bottom: 8px; }
    h1 { font-size: 18px; }
    h1 span { display: inline; margin-left: 8px; }
    section { grid-template-columns: minmax(256px, 1fr) minmax(280px, 1fr); align-items: center; }
    .game-stage { height: calc(100dvh - 65px); min-height: 0; }
    .touch-controls { flex-wrap: wrap; justify-content: center; }
  }
</style>
