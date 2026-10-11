import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createGame, startGame, stepGame } from "../src/lib/mario/engine.js";
import { LEVEL_IDS } from "../src/lib/mario/levels.js";

type Boundary = { tick: number; level: string; area: string; score: number; lives: number; digest: string };
type Recording = {
  seed: number;
  hashes: Record<string, string>;
  steps: [number, number][];
  boundaries: Boundary[];
};
const sources = ["engine.js", "enemies.js", "world.js", "levels.js", "level-data.js"];
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const filename = process.argv[2] ?? fileURLToPath(new URL("./fixtures/mario-campaign-inputs.json", import.meta.url));
const recording: Recording = JSON.parse(readFileSync(filename, "utf8"));
const hashes = Object.fromEntries(sources.map(name => [
  name, createHash("sha256").update(readFileSync(new URL("../src/lib/mario/" + name, import.meta.url))).digest("hex")
]));
assert.deepEqual(recording.hashes, hashes, "Recording must match the current simulation sources");
const game = createGame();
assert.equal(game.levelId, "1-1");
assert.equal(game.lives, 3);
assert.equal(recording.seed, game.seed);
startGame(game);
const visited = [game.levelId];
const clears: string[] = [];
const portals: { tick: number; from: string; to: string; trigger: string }[] = [];
const deaths: { tick: number; level: string; area: string }[] = [];
const boundaries: Boundary[] = [];
let tick = 0, ending = false, win = false, message = false;
const boundary = () => {
  const state = { tick, level: game.levelId, area: game.areaId, score: game.score, lives: game.lives };
  boundaries.push({ ...state, digest: digest({
    ...state, player: game.player, time: game.time, seed: game.seed,
    status: game.status, world: game.world, enemies: game.enemies, loopState: game.loopState
  }) });
};
boundary();
for (const [ticks, bits] of recording.steps) {
  assert.ok(Number.isSafeInteger(ticks) && ticks > 0 && ticks <= 100000, "Invalid RLE duration");
  assert.ok(Number.isSafeInteger(bits) && bits >= 0 && bits < 64, "Invalid controller bits");
  const input = { left: !!(bits & 1), right: !!(bits & 2), down: !!(bits & 4),
    jump: !!(bits & 8), run: !!(bits & 16), up: !!(bits & 32) };
  for (let i = 0; i < ticks; i++) {
    assert.notEqual(game.status, "won", "Recording contains inputs after the ending");
    const previousLevel = game.levelId, previousArea = game.areaId;
    stepGame(game, input);
    tick++;
    assert.ok(tick <= 1000000, "Campaign recording exceeds the bounded replay duration");
    assert.notEqual(game.status, "gameover", "Ordinary campaign exhausted its lives");
    for (const event of game.events) {
      if (event.type === "death") deaths.push({ tick, level: game.levelId, area: game.areaId });
      if (event.type === "levelclear") clears.push(game.levelId);
      if (event.type === "ending") ending = true;
      if (event.type === "win") win = true;
      if (event.type === "pipe" && game.transition?.target) {
        const target = game.transition.target;
        portals.push({ tick, from: game.levelId + "/" + game.areaId,
          to: target.levelId + "/" + target.areaId + "/" + target.entryId, trigger: "pipe" });
      }
    }
    if (game.levelId === "8-4" && game.finish?.phase === "message") message = true;
    if (game.areaId !== previousArea) portals.push({
      tick, from: previousLevel + "/" + previousArea, to: game.levelId + "/" + game.areaId, trigger: "area-change"
    });
    if (game.levelId !== previousLevel) {
      assert.equal(clears.at(-1), previousLevel, "Stage change occurred without its normal clear");
      assert.equal(game.levelId, LEVEL_IDS[visited.length], "Warp or out-of-order stage transition");
      visited.push(game.levelId);
      boundary();
    }
  }
}
assert.deepEqual(visited, [...LEVEL_IDS], "Recording did not visit all 32 stages in order");
assert.deepEqual(clears, LEVEL_IDS.slice(0, -1), "Every nonfinal stage must clear exactly once");
assert.equal(game.status, "won", "Recording must reach the terminal princess ending");
assert.equal(game.levelId, "8-4");
assert.equal(game.finish?.kind, "ending");
assert.ok(message && ending && win, "Missing princess message, scenic ending, or win event");
assert.ok(game.finish?.message?.includes("YOUR QUEST IS OVER."), "Princess ending text absent");
boundary();
assert.deepEqual(boundaries, recording.boundaries, "Stage boundary state differs from the recorded proof");
console.log(JSON.stringify({ kind: "ordinary-control full campaign", seed: recording.seed, hashes,
  ticks: tick, visited, clears, portals, deaths, boundaries, final: {
    level: game.levelId, status: game.status, score: game.score, lives: game.lives
  }
}, null, 2));
