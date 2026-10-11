import { createGame, startGame, restartGame, stepGame, VIEW_WIDTH, VIEW_HEIGHT } from "./engine.js";
import { renderGame } from "./graphics.js";
import { createAudio } from "./audio.js";

const keys = { ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowDown: "down", KeyS: "down", Space: "jump", KeyZ: "jump",
  ShiftLeft: "run", ShiftRight: "run", KeyX: "run" };
const tick = 1000 / 60;

export function mountMario(root, { onState = () => {} } = {}) {
  const canvas = root.querySelector("canvas");
  const ctx = canvas?.getContext("2d");
  if (!ctx) throw new Error("This browser cannot create the Mario 2D canvas.");
  canvas.width = VIEW_WIDTH; canvas.height = VIEW_HEIGHT;
  const game = createGame(), audio = createAudio();
  const keyboard = new Set(), buttonKeys = new Map(), pointers = new Map(), removers = [];
  let paused = false, muted = false, destroyed = false, raf = 0;
  let previous = null, accumulator = 0, lastState = "", lastAnnouncement = "";
  const running = () => !paused && !["ready", "won", "gameover"].includes(game.status);
  const listen = (target, name, fn) => {
    target.addEventListener(name, fn);
    removers.push(() => target.removeEventListener(name, fn));
  };
  function clearHeld() {
    keyboard.clear(); buttonKeys.clear();
    for (const [id, { button }] of pointers) {
      if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
    }
    pointers.clear();
    for (const button of root.querySelectorAll("[data-control]")) button.removeAttribute("data-held");
  }
  function paint() {
    renderGame(ctx, game);
    const state = { status: game.status, paused, muted, score: game.score, coins: game.coins,
      lives: game.lives, time: Math.ceil(game.time) };
    const serialized = JSON.stringify(state);
    if (serialized !== lastState) { lastState = serialized; onState(state); }
    root.dataset.status = game.status;
    root.dataset.paused = String(paused);
    const ended = game.status === "won" || game.status === "gameover";
    const message = paused ? "Paused" : ({ ready: "Ready for World 1-1", playing: "World 1-1",
      dying: "Try again", flag: "Course clear!", won: "World 1-1 complete!", gameover: "Game over" })[game.status];
    const overlay = root.querySelector("[data-overlay]");
    if (overlay) overlay.hidden = !(paused || ended || game.status === "ready");
    const title = root.querySelector("[data-overlay-title]");
    if (title) title.textContent = message;
    for (const button of root.querySelectorAll("[data-action=start]"))
      button.textContent = paused ? "Resume" : ended ? "Play again" : "Start game";
    for (const button of root.querySelectorAll("[data-action=pause]")) {
      button.textContent = paused ? "Resume" : "Pause";
      button.disabled = game.status === "ready" || ended;
      button.setAttribute("aria-pressed", String(paused));
    }
    for (const button of root.querySelectorAll("[data-action=mute]")) {
      button.textContent = muted ? "Unmute" : "Mute";
      button.setAttribute("aria-pressed", String(muted));
    }
    if (message !== lastAnnouncement) {
      lastAnnouncement = message;
      const live = root.querySelector("[data-announcement]");
      if (live) live.textContent = message;
    }
  }
  function resetClock() { previous = null; accumulator = 0; }
  function start() {
    if (destroyed || document.hidden) return;
    clearHeld(); resetClock();
    if (game.status === "won" || game.status === "gameover") { audio.stop(); restartGame(game); }
    else startGame(game);
    paused = false; canvas.focus({ preventScroll: true }); paint();
  }
  function restart() {
    if (destroyed || document.hidden) return;
    clearHeld(); audio.stop(); restartGame(game); paused = false; resetClock();
    canvas.focus({ preventScroll: true }); paint();
  }
  function pause() {
    clearHeld(); resetClock(); audio.stop();
    if (!running()) return;
    paused = true; paint();
  }
  function togglePause() {
    if (destroyed) return;
    if (paused) start(); else pause();
  }
  function toggleMute() {
    if (destroyed) return;
    muted = !muted; audio.setMuted(muted); paint();
  }
  function unlock() { void audio.unlock(); }
  function keydown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing
      || event.target.closest("input,textarea,select,[contenteditable]")) return;
    if (event.target.closest("button,a") && ["Space", "Enter"].includes(event.code)) {
      const button = event.target.closest("[data-control]");
      if (button) {
        event.preventDefault();
        if (!event.repeat) { unlock(); if (running()) buttonKeys.set(event.code, button.dataset.control); }
      }
      return;
    }
    const control = keys[event.code];
    const action = { Enter: start, Escape: togglePause, KeyP: togglePause, KeyM: toggleMute }[event.code];
    if (!control && !action) return;
    event.preventDefault();
    if (event.repeat) return;
    unlock();
    if (action) action();
    else if (running()) keyboard.add(event.code);
  }
  listen(root, "keydown", keydown);
  listen(root, "keyup", event => { keyboard.delete(event.code); buttonKeys.delete(event.code); });
  listen(root, "focusout", event => { if (!root.contains(event.relatedTarget)) pause(); });
  listen(window, "blur", pause);
  listen(document, "visibilitychange", () => { if (document.hidden) pause(); });
  for (const button of root.querySelectorAll("[data-control]")) {
    listen(button, "pointerdown", event => {
      if (event.button !== 0 || destroyed) return;
      event.preventDefault(); canvas.focus({ preventScroll: true }); unlock();
      if (!running()) return;
      button.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { control: button.dataset.control, button });
      button.setAttribute("data-held", "");
    });
    const release = event => {
      pointers.delete(event.pointerId);
      if (![...pointers.values()].some(p => p.button === button)) button.removeAttribute("data-held");
    };
    listen(button, "pointerup", release); listen(button, "pointercancel", release);
    listen(button, "lostpointercapture", release);
  }
  const actions = { start, pause: togglePause, restart, mute: toggleMute };
  for (const button of root.querySelectorAll("[data-action]")) {
    const action = actions[button.dataset.action];
    if (action) listen(button, "click", () => { unlock(); action(); });
  }
  function resize() {
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    const scale = Math.min(width / VIEW_WIDTH, height / VIEW_HEIGHT);
    canvas.style.width = VIEW_WIDTH * scale + "px";
    canvas.style.height = VIEW_HEIGHT * scale + "px";
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas.parentElement);
  function frame(now) {
    if (destroyed) return;
    if (running() && !document.hidden) {
      if (previous !== null) accumulator += Math.min(Math.max(0, now - previous), tick * 5);
      previous = now;
      let count = 0;
      while (accumulator + 1e-7 >= tick && count < 5 && running()) {
        const held = new Set([...keyboard].map(code => keys[code]));
        for (const control of buttonKeys.values()) held.add(control);
        for (const pointer of pointers.values()) held.add(pointer.control);
        stepGame(game, { left: held.has("left"), right: held.has("right"), down: held.has("down"),
          jump: held.has("jump"), run: held.has("run") });
        audio.sync(game); accumulator -= tick; count++;
      }
      if (count === 5) accumulator = 0;
      paint();
    } else resetClock();
    raf = requestAnimationFrame(frame);
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true; cancelAnimationFrame(raf); clearHeld();
    observer.disconnect(); for (const remove of removers) remove();
    audio.destroy();
  }
  try { paint(); resize(); raf = requestAnimationFrame(frame); }
  catch (error) { destroy(); throw error; }
  return { start, restart, togglePause, toggleMute, destroy };
}
