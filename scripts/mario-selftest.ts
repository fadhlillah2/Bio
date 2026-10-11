// Run: bun scripts/mario-selftest.ts
import assert from "node:assert/strict";

assert.ok(await Bun.file(new URL("../src/lib/mario/engine.js", import.meta.url)).exists(),
  "CORE engine must exist and implement create/start/restart/step");
const { createGame, startGame, restartGame, stepGame, TILE, VIEW_WIDTH, VIEW_HEIGHT } =
  await import("../src/lib/mario/engine.js");
const idle = { left: false, right: false, down: false, jump: false, run: false };
let passed = 0, failed = 0;
function test(name: string, fn: () => void) {
  try { fn(); console.log("OK  " + name); passed++; }
  catch (error) { failed++; console.error("FAIL "+name, error); }
}
function tick(g: any, n = 1, input: Partial<typeof idle> = {}) {
  for (let i = 0; i < n; i++) stepGame(g, { ...idle, ...input });
}
function fresh() { const g = createGame(); startGame(g); return g; }
function arena() {
  const g = fresh();
  g.world.spawns = [];
  g.world.tiles = [{ x: 0, y: 208, w: 3584, h: 32, kind: "ground" }];
  g.enemies = []; g.items = [];
  return g;
}
function block(g: any, kind: string, content?: string, hidden = false) {
  const t = { x: 160, y: 144, w: 16, h: 16, kind, content, hidden, bump: 0 };
  g.world.tiles.push(t);
  Object.assign(g.player, { x: 162, y: 161, vx: 0, vy: -4, grounded: false });
  return t;
}
function enemy(g: any, type = "goomba", x = 128, y = 192) {
  const e = { type, x, y, w: 16, h: 16, vx: -0.5, vy: 0, alive: true };
  g.enemies.push(e);
  return e;
}
function item(g: any, type: string) {
  g.items.push({ type, x: g.player.x, y: g.player.y, w: 16, h: 16, vx: 0, vy: 0, alive: true });
}
function noOverlap(g: any) {
  const p = g.player;
  for (const t of g.world.tiles) {
    if (t.hidden || t.kind === "flagpole" || t.kind === "castle") continue;
    assert.ok(!(p.x < t.x+t.w-0.001 && p.x+p.w > t.x+0.001 &&
      p.y < t.y+t.h-0.001 && p.y+p.h > t.y+0.001), "player overlaps " + JSON.stringify(t));
  }
}

test("CORE lifecycle, constants, fixed tick and fresh events in every state", () => {
  const g = createGame();
  assert.deepEqual([TILE, VIEW_WIDTH, VIEW_HEIGHT], [16, 256, 240]);
  assert.equal(g.status, "ready");
  assert.deepEqual([g.time,g.score,g.coins,g.lives,g.area], [400,0,0,3,"overworld"]);
  for (const status of ["ready","playing","dying","gameover","flag","won"]) {
    const h = createGame(); startGame(h); h.status = status;
    h.events.push({type:"old"});
    const old = h.events; tick(h);
    assert.notEqual(h.events, old);
    assert.ok(!h.events.some((e: any) => e.type === "old"));
  }
  startGame(g); const f = g.frame; tick(g);
  assert.equal(g.frame, f+1); assert.equal(g.status, "playing");
  g.score = 99; startGame(g); assert.equal(g.score,99);
  restartGame(g);
  assert.deepEqual([g.status,g.score,g.coins,g.lives,g.time],["playing",0,0,3,400]);
});
test("world geometry, three pits, exact blocks, stairs and 19 underground coins", () => {
  const g = fresh();
  const at = (x: number,y: number) => g.world.tiles.find((t: any) =>
    t.x <= x*16 && t.x+t.w > x*16 && t.y <= y*16 && t.y+t.h > y*16);
  assert.equal(g.world.width, 224*16);
  for (let x=0; x<224; x++) assert.equal(!!at(x,13), ![69,70,86,87,88,153,154].includes(x));
  assert.equal(at(57,9)?.kind,"pipe");
  assert.equal(at(64,8)?.hidden,true);
  assert.equal(at(94,9)?.content,"multicoin");
  assert.equal(at(101,9)?.content,"star");
  assert.equal(at(109,5)?.content,"powerup");
  assert.equal(at(189,5)?.kind,"stone");
  assert.equal(at(198,3)?.kind,"flagpole");
  const other = createGame();
  g.world.tiles[0].kind = "used";
  assert.equal(other.world.tiles[0].kind,"ground");
});
test("walk/run accelerate to reference caps and opposite input skids", () => {
  const walk = arena(), run = arena();
  tick(walk,20,{right:true}); assert.ok(walk.player.vx > 0 && walk.player.vx < 1.5);
  tick(walk,40,{right:true}); tick(run,70,{right:true,run:true});
  assert.equal(walk.player.vx,1.5); assert.equal(run.player.vx,2.5);
  const old = run.player.x; tick(run,1,{left:true});
  assert.ok(run.player.vx>0 && run.player.vx<2.5 && run.player.x>old);
  tick(run,50,{left:true}); assert.ok(run.player.vx<0);
});
test("releasing run returns grounded forward movement to walking cap", () => {
  const g=arena(); tick(g,70,{right:true,run:true}); assert.equal(g.player.vx,2.5);
  tick(g,20,{right:true}); assert.equal(g.player.vx,1.5);
});
test("variable jump, edge latch, air coasting and no double jump", () => {
  const held = arena(), tap = arena();
  tick(held,1,{jump:true}); tick(tap,1,{jump:true});
  tick(held,18,{jump:true}); tick(tap,18);
  assert.ok(held.player.y < tap.player.y-15);
  tick(held,100,{jump:true}); assert.equal(held.player.grounded,true);
  tick(held,1); tick(held,1,{jump:true}); assert.ok(held.player.vy<0);
  const air = arena(); tick(air,70,{right:true,run:true}); tick(air,1,{right:true,run:true,jump:true});
  const vx=air.player.vx; tick(air,3,{jump:true}); assert.equal(air.player.vx,vx);
  const vy=air.player.vy; tick(air); tick(air,1,{jump:true}); assert.ok(air.player.vy>vy);
});
test("left/right walls and corners never embed player", () => {
  const g=arena();
  g.world.tiles.push({x:160,y:144,w:16,h:64,kind:"stone"});
  Object.assign(g.player,{x:146,y:192,vx:2.5});
  tick(g,20,{right:true,run:true}); assert.equal(g.player.x,160-g.player.w); noOverlap(g);
  Object.assign(g.player,{x:177,y:192,vx:-2.5}); tick(g,10,{left:true,run:true});
  assert.equal(g.player.x,176); noOverlap(g);
  Object.assign(g.player,{x:147,y:127,vx:2.5,vy:3,grounded:false});
  tick(g,5,{right:true,run:true}); noOverlap(g);
});
test("crouch and growth under ceiling retain feet and cannot stand through tiles", () => {
  const g=arena();
  g.world.tiles.push({x:16,y:176,w:112,h:16,kind:"brick"});
  item(g,"mushroom"); tick(g);
  assert.equal(g.player.power,"big"); assert.equal(g.player.h,16); noOverlap(g);
  tick(g,59); assert.equal(g.transform,null);
  tick(g,80,{right:true,run:true}); assert.equal(g.player.h,32); noOverlap(g);
  const feet=g.player.y+g.player.h; tick(g,1,{down:true});
  assert.equal(g.player.h,16); assert.equal(g.player.y+g.player.h,feet);
  tick(g); assert.equal(g.player.h,32); noOverlap(g);
});
test("question coin turns solid used, bump event occurs once", () => {
  const g=arena(); const t=block(g,"question","coin");
  tick(g); assert.equal(t.kind,"used"); assert.equal(g.coins,1); assert.equal(g.score,200);
  assert.ok(g.events.some((e: any)=>e.type==="coin"));
  tick(g); assert.ok(!g.events.some((e: any)=>e.type==="coin"));
  Object.assign(g.player,{x:162,y:128,vy:2,grounded:false});
  tick(g); assert.equal(g.player.grounded,true); assert.equal(g.player.y,128);
});
test("small bumps brick, big breaks brick for 50", () => {
  const a=arena(); const b=block(a,"brick"); tick(a);
  assert.ok(a.world.tiles.includes(b)); assert.equal(a.score,0);
  const g=arena(); g.player.power="big"; const t=block(g,"brick");
  tick(g); assert.ok(!g.world.tiles.includes(t)); assert.equal(g.score,50);
  assert.ok(g.events.some((e: any)=>e.type==="break"));
});
test("hidden block intangible sideways, bumps from below and cannot farm across lives", () => {
  const g=arena(); const t=block(g,"question","oneup",true);
  Object.assign(g.player,{x:145,y:144,vx:2.5,vy:0}); tick(g,5,{right:true,run:true});
  assert.ok(g.player.x>148); assert.equal(t.hidden,true);
  Object.assign(g.player,{x:162,y:161,vx:0,vy:-4}); tick(g);
  assert.equal(t.hidden,false); assert.equal(t.kind,"used");
  assert.ok(g.items.some((i: any)=>i.type==="oneup"));
  g.player.y=270; tick(g); tick(g,180);
  assert.ok(!g.world.tiles.some((t: any)=>t.hidden&&t.content==="oneup"));
  restartGame(g); assert.ok(g.world.tiles.some((t: any)=>t.hidden&&t.content==="oneup"));
});
test("multicoin block is timed, not fixed stock; star contents", () => {
  const g=arena(); const t=block(g,"brick","multicoin"); tick(g);
  assert.equal(g.coins,1); assert.equal(t.kind,"brick");
  tick(g,20); Object.assign(g.player,{x:162,y:161,vx:0,vy:-4}); tick(g);
  assert.equal(g.coins,2);
  tick(g,240); Object.assign(g.player,{x:162,y:161,vx:0,vy:-4}); tick(g);
  assert.equal(t.kind,"used");
  const h=arena(); block(h,"brick","star"); tick(h);
  assert.ok(h.items.some((i: any)=>i.type==="star"));
});
test("power blocks select mushroom or flower; emergence does not collect instantly", () => {
  for (const [power,type] of [["small","mushroom"],["big","flower"],["fire","flower"]]) {
    const g=arena(); g.player.power=power; block(g,"question","powerup"); tick(g);
    assert.equal(g.items[0].type,type); assert.equal(g.score,0);
  }
});
test("mushroom/flower/star/oneup pickups and 100-coin rollover", () => {
  const g=arena();
  item(g,"mushroom"); tick(g); assert.equal(g.player.power,"big"); assert.equal(g.score,1000);
  tick(g,59); assert.equal(g.transform,null);
  item(g,"flower"); tick(g); assert.equal(g.player.power,"fire"); assert.equal(g.score,2000);
  tick(g,63); assert.equal(g.transform,null);
  item(g,"star"); tick(g); assert.ok(g.player.invincible>0); assert.equal(g.score,3000);
  item(g,"oneup"); tick(g); assert.equal(g.lives,4);
  g.coins=99; item(g,"coin"); tick(g);
  assert.equal(g.coins,0); assert.equal(g.lives,5); assert.equal(g.score,3200);
});
test("Goomba stomp bounces, Koopa becomes shell, kick and combo kills", () => {
  const g=arena(); const e=enemy(g);
  Object.assign(g.player,{x:130,y:173,vy:4,grounded:false}); tick(g);
  assert.equal(e.alive,false); assert.ok(g.player.vy<0); assert.equal(g.score,100);
  const h=arena(); const k=enemy(h,"koopa");
  Object.assign(h.player,{x:130,y:173,vy:4,grounded:false}); tick(h);
  assert.equal(k.type,"shell"); assert.equal(k.vx,0);
  Object.assign(h.player,{x:116,y:192,vy:0,grounded:true}); tick(h,1,{right:true});
  assert.ok(k.vx>0); assert.ok(h.events.some((e: any)=>e.type==="kick"));
  const a=enemy(h,"goomba",165),b=enemy(h,"goomba",190);
  tick(h,15); assert.equal(a.alive,false); assert.equal(b.alive,false); assert.equal(h.score,1800);
});
test("shell revives; moving shell can be stopped with a stomp", () => {
  const g=arena(); const e=enemy(g,"shell",200); Object.assign(e,{vx:0,revive:2});
  g.intervalTimer=0;
  tick(g,21); assert.equal(e.type,"shell"); tick(g); assert.equal(e.type,"koopa");
  Object.assign(e,{type:"shell",x:128,y:192,h:16,vx:3,vy:0,revive:0});
  Object.assign(g.player,{x:133,y:173,vy:4,grounded:false}); tick(g);
  assert.equal(e.vx,0); assert.ok(g.player.vy<0);
});
test("side damage shrinks, gives immunity, then small dies; star defeats enemy", () => {
  const g=arena(); g.player.power="fire"; g.player.h=32; g.player.y=176;
  const e=enemy(g,"goomba",g.player.x);
  tick(g); assert.equal(g.player.power,"small"); assert.ok(g.player.hurtTimer>0);
  assert.equal(g.status,"playing"); tick(g,55); assert.equal(g.transform,null);
  g.player.hurtTimer=0; e.x=g.player.x; e.y=g.player.y; tick(g);
  assert.equal(g.status,"dying"); assert.ok(g.events.some((e: any)=>e.type==="death"));
  const s=arena(); s.player.invincible=50; const se=enemy(s,"goomba",s.player.x);
  tick(s); assert.equal(se.alive,false); assert.equal(s.status,"playing");
});
test("fire uses run edge, caps two, bounces and kills enemy", () => {
  const g=arena(); g.player.power="fire"; g.player.h=32; g.player.y=176;
  tick(g,1,{run:true}); assert.equal(g.fireballs.length,1);
  tick(g,4,{run:true}); assert.equal(g.fireballs.length,1);
  tick(g); tick(g,1,{run:true}); assert.equal(g.fireballs.length,2);
  tick(g); tick(g,1,{run:true}); assert.equal(g.fireballs.length,2);
  const ball=g.fireballs[0]; const e=enemy(g,"goomba",ball.x+8,192);
  ball.y=194; ball.vy=1; tick(g,4); assert.equal(e.alive,false);
});
test("camera never scrolls back; checkpoint uses camera not player position", () => {
  const g=arena(); g.player.x=1280; tick(g); assert.ok(g.cameraX<1280);
  g.player.y=270; tick(g); tick(g,180); assert.ok(g.player.x<100);
  const h=arena(); h.player.x=1430; tick(h); const cam=h.cameraX; assert.ok(cam>=1280);
  h.player.vx=-2.5; tick(h,20,{left:true}); assert.equal(h.cameraX,cam);
  h.player.y=270; tick(h); tick(h,180); assert.ok(h.cameraX>=1280); assert.ok(h.player.x>=1280);
});
test("timer interval, hurry, timeout, death reset, gameover and restart", () => {
  const g=arena(); tick(g,23); assert.equal(g.time,400); tick(g); assert.equal(g.time,399);
  g.time=101; tick(g,24); assert.equal(g.time,100);
  assert.ok(g.events.some((e: any)=>e.type==="hurry"));
  g.time=1; g.score=1234; g.player.invincible=10; tick(g,24);
  assert.equal(g.status,"dying");
  for (let i=0;i<240 && g.status==="dying";i++) tick(g);
  assert.equal(g.status,"playing"); assert.equal(g.lives,2); assert.equal(g.time,400); assert.equal(g.score,1234);
  assert.equal(g.player.invincible,0); assert.equal(g.player.power,"small");
  g.lives=1; g.player.y=270; tick(g); tick(g,180); assert.equal(g.status,"gameover");
  restartGame(g); assert.equal(g.lives,3); assert.equal(g.score,0);
});
test("pipe transitions take time; underground has 19 coins and returns through x163", () => {
  const g=fresh(); Object.assign(g.player,{x:57*16+10,y:9*16-16,vx:0,vy:0,grounded:true});
  tick(g,1,{down:true}); assert.equal(g.area,"overworld");
  assert.ok(g.events.some((e: any)=>e.type==="pipe"));
  const time=g.time; tick(g,100); assert.equal(g.area,"underground"); assert.equal(g.time,time);
  assert.equal(g.items.filter((i: any)=>i.type==="coin").length,19);
  Object.assign(g.player,{x:13*16-g.player.w,y:192,vx:0,vy:0,grounded:true});
  tick(g,1,{right:true}); assert.equal(g.area,"underground");
  tick(g,100); assert.equal(g.area,"overworld");
  assert.ok(g.player.x>=163*16 && g.player.x<165*16);
  noOverlap(g);
});
test("flag height points, slide, castle walk, time bonus and fireworks precede won", () => {
  const g=arena(); g.time=103;
  Object.assign(g.player,{x:198*16,y:30,vx:0,vy:1,grounded:false});
  tick(g); assert.equal(g.status,"flag"); assert.equal(g.score,5000);
  assert.ok(g.events.some((e: any)=>e.type==="flag"));
  let winEvents=0;
  for(let i=0;i<1500&&g.status!=="won";i++) {
    tick(g); winEvents+=g.events.filter((e: any)=>e.type==="win").length;
  }
  assert.equal(g.status,"won"); assert.equal(g.time,0); assert.equal(g.score,5000+103*50+3*500);
  assert.equal(winEvents,1); tick(g); assert.equal(g.events.length,0);
});
test("group spawns follow actual camera edge; no Piranha Plant", () => {
  const g=fresh();
  g.player.x=728; tick(g);
  const right=g.cameraX+256;
  const group=g.enemies.filter((e: any)=>e.group===54);
  assert.equal(group.length,2); assert.ok(Math.abs(group[0].x-right)<=1);
  assert.equal(group[1].x-group[0].x,24);
  assert.ok(g.enemies.every((e: any)=>["goomba","koopa","shell"].includes(e.type)));
});
test("deterministic input replay matches complete mutable simulation", () => {
  const a=fresh(),b=fresh();
  for(let i=0;i<900;i++) {
    const input={...idle,right:true,run:i%120<100,jump:i%73<27};
    stepGame(a,input); stepGame(b,input);
  }
  assert.deepEqual(a,b);
});
test("star hitting a ceiling falls away instead of bouncing upward forever", () => {
  const g=arena();
  g.world.tiles.push({x:128,y:144,w:64,h:16,kind:"stone"});
  const star={type:"star",x:144,y:161,w:16,h:16,vx:0,vy:-3,alive:true};
  g.items.push(star); tick(g,5);
  assert.ok(star.vy>0 && star.y>160);
});
test("walking enemies reverse on contact without passing through each other", () => {
  const g=arena(); const a=enemy(g,"goomba",160),b=enemy(g,"goomba",177);
  a.vx=0.5; b.vx=-0.5; tick(g,5);
  assert.ok(a.vx<0 && b.vx>0); assert.ok(a.x+a.w<=b.x);
});
test("crouch jump keeps its short collision box while down is held", () => {
  const g=arena(); g.player.power="big"; g.player.h=32; g.player.y=176;
  tick(g,1,{down:true}); tick(g,1,{down:true,jump:true}); tick(g,5,{down:true,jump:true});
  assert.equal(g.player.h,16); assert.equal(g.player.crouching,true);
  tick(g); assert.equal(g.player.h,32);
});

// Source regression contract: prg 122–139, 4548–4618, 6090–6137, 10411–10863.
test("enemy separation never pushes a stationary shell into the first pipe", () => {
  const g=fresh(); g.world.spawns=[]; g.enemies=[];
  const shell=enemy(g,"shell",480); Object.assign(shell,{vx:0,revive:16});
  const walker=enemy(g,"goomba",496);
  for(let i=0;i<60;i++) {
    tick(g);
    assert.equal(shell.y,192);
    assert.ok(shell.x>=480);
    for(const e of [shell,walker]) {
      noOverlap({...g,player:e});
    }
  }
  assert.ok(walker.vx>0);
});
test("star, injury, shell and multicoin share a 21-frame interval phase", () => {
  const g=arena(); g.intervalTimer=7; item(g,"star"); tick(g);
  assert.equal(g.player.invincible,35);
  const shell=enemy(g,"shell",600); Object.assign(shell,{vx:0,revive:16});
  g.player.hurtTimer=8;
  const t=block(g,"brick","multicoin"); tick(g);
  assert.equal(g.brickCoinTimer,11);
  const until=g.intervalTimer;
  tick(g,until);
  assert.deepEqual([g.player.invincible,g.player.hurtTimer,shell.revive,g.brickCoinTimer],[35,8,16,11]);
  tick(g);
  assert.deepEqual([g.player.invincible,g.player.hurtTimer,shell.revive,g.brickCoinTimer],[34,7,15,10]);
  tick(g,20); assert.equal(g.player.invincible,34);
  tick(g); assert.equal(g.player.invincible,33);
  assert.equal(t.kind,"brick");
});
test("interval expiry depends on shared phase rather than pickup-relative deadlines", () => {
  for(const initialPhase of [0,1,20]) {
    const g=arena(); g.intervalTimer=initialPhase; item(g,"star"); tick(g);
    const duration=g.intervalTimer+1+34*21;
    tick(g,duration-1); assert.equal(g.player.invincible,1);
    tick(g); assert.equal(g.player.invincible,0);
  }
  const h=arena(); h.intervalTimer=12; const t=block(h,"brick","multicoin"); tick(h);
  const duration=h.intervalTimer+1+10*21;
  tick(h,duration-1); assert.equal(h.brickCoinTimer,1);
  tick(h); assert.equal(h.brickCoinTimer,0);
  Object.assign(h.player,{x:162,y:161,vx:0,vy:-4,grounded:false}); tick(h);
  assert.equal(t.kind,"used"); assert.equal(h.coins,2);
});
test("growth freezes simulation 59 ticks and safely resizes at tick7 under ceiling", () => {
  const g=arena(); g.intervalTimer=9;
  g.world.tiles.push({x:16,y:176,w:112,h:16,kind:"brick",bump:8});
  const e=enemy(g,"goomba",600);
  const shell=enemy(g,"shell",650); Object.assign(shell,{vx:0,revive:16});
  g.brickCoinTimer=11; g.brickCoinStarted=true;
  g.player.invincible=35; g.player.hurtTimer=8;
  item(g,"mushroom"); tick(g);
  assert.deepEqual([g.transform.kind,g.transform.ticks,g.transform.duration],["grow",0,59]);
  const x=g.player.x, feet=g.player.y+g.player.h;
  const frozen=JSON.stringify({tiles:g.world.tiles,enemies:g.enemies,time:g.time,timer:g.timerTicks,phase:g.intervalTimer});
  for(let i=1;i<=58;i++) {
    tick(g,1,{right:true,run:true,jump:true});
    assert.equal(g.player.x,x); assert.equal(g.player.y+g.player.h,feet);
    assert.equal(g.player.h,16); noOverlap(g);
    assert.deepEqual([g.player.invincible,g.player.hurtTimer,shell.revive,g.brickCoinTimer],[35,8,16,11]);
    assert.equal(JSON.stringify({tiles:g.world.tiles,enemies:g.enemies,time:g.time,timer:g.timerTicks,phase:g.intervalTimer}),frozen);
  }
  assert.ok(g.transform); tick(g); assert.equal(g.transform,null);
  tick(g,100,{right:true,run:true}); assert.equal(g.player.h,32); noOverlap(g);
  assert.ok(e.x<600);
  const open=arena(); item(open,"mushroom"); tick(open);
  tick(open,6); assert.equal(open.player.h,16);
  tick(open); assert.equal(open.player.h,32); assert.equal(open.player.y+open.player.h,208);
});
test("flower transformation freezes 63 ticks and cycles palette every four frames", () => {
  const g=arena(); g.player.power="big"; g.player.h=32; g.player.y=176;
  item(g,"flower"); tick(g);
  assert.equal(g.transform.kind,"fire"); assert.equal(g.transform.duration,63);
  const phase=g.intervalTimer,x=g.player.x;
  for(let i=1;i<63;i++) {
    tick(g,1,{right:true});
    assert.equal(g.player.x,x); assert.equal(g.intervalTimer,phase);
    assert.equal(g.player.palette,(g.frame>>2)&3);
  }
  tick(g); assert.equal(g.transform,null); assert.equal(g.player.palette,0);
});
test("injury freezes timers55 ticks and permits player-only movement after15", () => {
  const g=arena(); g.player.power="big"; g.player.h=32; g.player.y=176;
  const e=enemy(g,"goomba",40); tick(g);
  assert.equal(g.player.hurtTimer,8); assert.equal(g.transform.kind,"hurt");
  const x=g.player.x,ex=e.x,phase=g.intervalTimer,time=g.timerTicks;
  tick(g,15,{right:true}); assert.equal(g.player.x,x); assert.equal(e.x,ex);
  tick(g,1,{right:true}); assert.ok(g.player.x>x); assert.equal(e.x,ex);
  tick(g,38,{right:true}); assert.equal(g.transform.ticks,54);
  assert.deepEqual([g.player.hurtTimer,g.intervalTimer,g.timerTicks],[8,phase,time]);
  tick(g); assert.equal(g.transform,null); assert.equal(g.player.power,"small");
  assert.equal(g.player.h,16); noOverlap(g);
});
test("injury player control does not decrement the frozen running timer", () => {
  const g=arena(); g.player.power="big"; g.player.h=32; g.player.y=176; g.player.runningTimer=10;
  enemy(g,"goomba",40); tick(g);
  const timer=g.player.runningTimer;
  tick(g,54,{right:true});
  assert.equal(g.player.runningTimer,timer);
  tick(g); assert.equal(g.transform,null);
  tick(g,1,{right:true}); assert.equal(g.player.runningTimer,timer-1);
});
test("Goomba Koopa and moving shell stomps bounce at minus4", () => {
  for(const type of ["goomba","koopa","shell"]) {
    const g=arena(); const e=enemy(g,type); if(type==="shell") e.vx=3;
    Object.assign(g.player,{x:133,y:173,vy:4,grounded:false});
    tick(g); assert.equal(g.player.vy,-4); assert.equal(g.score,100);
    if(type!=="goomba") assert.equal(e.revive,16);
  }
});
test("star and fireball awards are enemy-specific rather than star combo", () => {
  for(const method of ["star","fireball"]) {
    const g=arena(); g.player.invincible=method==="star"?35:0;
    for(const [type,award] of [["goomba",100],["goomba",100],["koopa",200]] as const) {
      const score=g.score;
      const e=enemy(g,type,method==="star"?g.player.x:120);
      if(method==="fireball") g.fireballs.push({x:116,y:192,w:8,h:8,vx:4,vy:0,life:100,alive:true});
      tick(g); assert.equal(e.alive,false); assert.equal(g.score-score,award);
    }
  }
});
test("shell reward sequence includes5000 before8000 then life; kick uses revival stage", () => {
  const g=arena(); const shell=enemy(g,"shell",100); Object.assign(shell,{vx:3,combo:0,revive:16});
  for(const reward of [500,800,1000,2000,4000,5000,8000]) {
    const score=g.score; enemy(g,"goomba",shell.x+16); tick(g);
    assert.equal(g.score-score,reward);
  }
  enemy(g,"goomba",shell.x+16); tick(g); assert.equal(g.lives,4);
  for(const [revive,chain,reward] of [[16,0,400],[16,2,800],[2,0,500],[1,0,1000],[0,0,8000]]) {
    const h=arena(); h.intervalTimer=20; h.player.stompChain=chain;
    Object.assign(h.player,{y:191,vy:0,grounded:false});
    const e=enemy(h,"shell",51); Object.assign(e,{vx:0,revive});
    tick(h); assert.equal(h.score,reward);
  }
});
test("stomp timer adds adjacent-frame combo points and decays per active frame", () => {
  const g=arena(); g.player.stompChain=7; g.stompTimer=1;
  enemy(g,"goomba",128); Object.assign(g.player,{x:130,y:173,vy:4,grounded:false});
  tick(g); assert.equal(g.score,4000); assert.equal(g.stompTimer,1);
  const h=arena(); enemy(h,"goomba",128); enemy(h,"goomba",129,191);
  Object.assign(h.player,{x:130,y:173,vy:4,grounded:false}); tick(h);
  assert.equal(h.score,500); assert.equal(h.player.stompChain,2); assert.equal(h.stompTimer,2);
});
test("star, enemy, mushroom and fireball use reference gravity and nominal caps", () => {
  const g=arena();
  const s={type:"star",x:160,y:192,w:16,h:16,vx:0,vy:1,alive:true};
  const m={type:"mushroom",x:200,y:100,w:16,h:16,vx:0,vy:0,alive:true};
  g.items.push(s,m); const e=enemy(g,"goomba",230,100); e.vy=0;
  tick(g); assert.equal(s.vy,-3); assert.equal(m.vy,61/256); assert.equal(e.vy,61/256);
  tick(g); assert.equal(s.vy,-3+28/256); assert.equal(s.y,189);
  const h=arena(); h.player.power="fire"; h.player.h=32; h.player.y=80; h.player.grounded=false;
  tick(h,1,{run:true}); const b=h.fireballs[0];
  assert.equal(b.y,h.player.y+12+4); assert.equal(b.vy,4+80/256);
  tick(h); assert.equal(b.vy,3);
  b.x=200; b.y=198; b.vy=3; tick(h); assert.equal(b.vy,-3);
});
test("all powerups emerge in visual coordinates with17px rise and state6 pickup", () => {
  for (const type of ["mushroom","flower","star","oneup"]) {
    const g=arena(); const t=block(g,"question",type); tick(g);
    const m=g.items[0]; assert.equal(m.type,type); assert.equal(m.emergeState,1);
    // SetupPowerUp -8 and DrawPowerUp +8 cancel in our visual coordinate contract.
    assert.equal(m.y,t.y);
    let rises=0;
    for(let n=0;n<67;n++) {
      const before=m.y; tick(g);
      if(g.frame%4===0) rises++;
      assert.equal(m.y,before-(g.frame%4===0?1:0));
      assert.equal(m.emergeState,Math.min(18,1+rises));
    }
    assert.equal(m.emerge,0); assert.equal(m.y,127); assert.equal(m.y+m.h,143);
    if(type==="flower") {
      tick(g,20); assert.equal(m.y,127); assert.equal(m.y+m.h,143);
    }
    const h=arena(); block(h,"question",type); tick(h);
    const emerging=h.items[0]; tick(h,15); assert.equal(emerging.emergeState,5);
    Object.assign(h.player,{x:150,y:125,vy:0,grounded:false});
    tick(h); assert.equal(emerging.alive,true); assert.equal(h.score,0);
    tick(h,2); assert.equal(emerging.emergeState,5); assert.equal(emerging.alive,true);
    Object.assign(h.player,{x:150,y:125,vy:0,grounded:false});
    tick(h); assert.equal(emerging.emergeState,6); assert.equal(emerging.alive,false);
    assert.equal(h.items.includes(emerging),false);
    if(type==="oneup") assert.equal(h.lives,4);
    else if(type==="star") assert.equal(h.player.invincible,35);
    else assert.equal(h.player.power,"big");
  }
});
test("visual emergence offset does not change loose coins or active mushroom coordinates", () => {
  const g=arena();
  const coin={type:"coin",x:240,y:100,w:8,h:16,alive:true};
  const mushroom={type:"mushroom",x:200,y:100,w:16,h:16,vx:1,vy:0,alive:true};
  g.items.push(coin,mushroom); tick(g);
  assert.deepEqual([coin.x,coin.y],[240,100]);
  assert.deepEqual([mushroom.x,mushroom.y,mushroom.vy],[201,100,61/256]);
});
test("previously emerged mushroom promotes current big player to fire", () => {
  const g=arena(); block(g,"question","powerup"); tick(g); const m=g.items[0];
  tick(g,70); assert.equal(m.type,"mushroom");
  Object.assign(g.player,{power:"big",h:32,x:m.x,y:m.y-16,vy:0,grounded:false});
  tick(g); assert.equal(g.player.power,"fire"); assert.equal(g.transform.kind,"fire");
});
test("bumping actual brick22,9 launches mushroom and oneup away from player", () => {
  for(const type of ["mushroom","oneup"]) {
    const g=fresh(); g.world.spawns=[]; g.enemies=[];
    const m={type,x:22*16,y:128,w:16,h:16,vx:1,vy:0,alive:true};
    g.items.push(m);
    Object.assign(g.player,{x:22*16+3,y:161,vy:-4,grounded:false});
    tick(g);
    assert.equal(m.vx,-1); assert.equal(m.y,123); assert.equal(m.vy,-3+61/256);
    assert.equal(g.score,0); assert.equal(m.alive,true);
  }
});
test("shell revival uses interval expiry and current frame parity", () => {
  for(const frame of [0,1]) {
    const g=arena(); g.frame=frame; g.intervalTimer=0;
    const e=enemy(g,"shell",200); Object.assign(e,{vx:0,revive:1});
    tick(g); assert.equal(e.type,"koopa"); assert.equal(e.vx,g.frame%2?-0.5:0.5);
    assert.equal(e.y,184);
  }
});

function playRoute(route: "main" | "pipe") {
  const g=fresh();
  let jumping=false,lastJump=false,visited=false,returned=false;
  let target: any=null;
  let bonusCoins=0;
  function steer(targetX: number) {
    const desired=Math.max(-1.5,Math.min(1.5,(targetX-g.player.x)*0.13));
    return {left:g.player.vx>desired+0.02,right:g.player.vx<desired-0.02};
  }
  for(let f=0;f<10000&&g.status!=="won";f++) {
    const p=g.player,feet=p.y+p.h,front=p.x+p.w;
    const walls=g.world.tiles.some((t: any)=>!t.hidden&&!["flagpole","castle"].includes(t.kind)&&
      t.x>front-1&&t.x<front+28&&t.y<feet&&t.y+t.h>p.y);
    const enemyNear=g.enemies.some((e: any)=>e.alive&&e.x>p.x-4&&e.x<front+45&&e.y+e.h>p.y&&e.y<feet+8);
    const gap=!g.world.tiles.some((t: any)=>t.kind==="ground"&&t.x<=front+28&&t.x+t.w>front+28);
    if(p.grounded) jumping=!lastJump&&(walls||enemyNear||gap);
    const input={left:false,right:true,down:false,jump:jumping,run:true};
    if(route==="pipe"&&!visited&&p.x>870) {
      Object.assign(input,steer(922),{run:false});
      if(p.grounded&&feet===144&&p.x>=914&&p.x<=930) input.down=true;
    }
    if(g.area==="underground") {
      visited=true;
      const coins=g.items.filter((i: any)=>i.type==="coin"&&i.alive);
      if(!coins.includes(target)) target=coins.sort((a: any,b: any)=>
        Math.abs(a.x-p.x)+Math.abs(a.y-p.y)*0.3-Math.abs(b.x-p.x)-Math.abs(b.y-p.y)*0.3)[0];
      if(target) {
        Object.assign(input,steer(target.x+target.w/2-p.w/2),{run:false});
        if(p.grounded) jumping=!lastJump&&(target.y+target.h<=p.y+1||walls);
        input.jump=jumping;
      } else {
        input.left=false; input.right=true; input.run=false; input.jump=false; jumping=false;
      }
    } else if(visited) returned=true;
    stepGame(g,input); lastJump=input.jump;
    if(g.area==="underground") bonusCoins+=g.events.filter((e: any)=>e.type==="coin").length;
    assert.notEqual(g.status,"dying","input-only route died at "+g.player.x);
    assert.equal(g.lives,3);
    if(g.status==="playing"&&!g.transition) noOverlap(g);
  }
  assert.equal(g.status,"won"); assert.equal(g.time,0);
  if(route==="pipe") { assert.equal(visited,true); assert.equal(returned,true); assert.equal(bonusCoins,19); }
  else assert.equal(visited,false);
  return {frame:g.frame,score:g.score,coins:g.coins,lives:g.lives,bonusCoins};
}
test("continuous main route reaches castle using only ordinary controls", () => {
  console.log("MAIN",JSON.stringify(playRoute("main")));
});
test("continuous pipe route collects all 19 coins, exits and reaches castle", () => {
  console.log("PIPE",JSON.stringify(playRoute("pipe")));
});
console.log(`Mario selftest: ${passed} passed, ${failed} failed`);
if (failed) process.exitCode = 1;
