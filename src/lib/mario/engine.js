import { createWorld, TILE, VIEW_WIDTH, VIEW_HEIGHT } from "./world.js";
export { TILE, VIEW_WIDTH, VIEW_HEIGHT };

const WALK = 1.5, RUN = 2.5;
const SCORES = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];
const enemyPoints = e => e.type === "goomba" ? 100 : 200;
const fallSpeed = (vy,gravity,cap = 3) => {
  const next = vy+gravity;
  return Math.floor(next)>=cap && next-Math.floor(next)>=0.5 ? cap : next;
};
const overlap = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
const solid = t => !t.hidden && t.kind !== "flagpole" && t.kind !== "castle";
const sign = n => n < 0 ? -1 : 1;
const event = (g,type,at = g.player,extra = {}) => g.events.push({type,x:at.x,y:at.y,...extra});

function playerAt(x = 40, y = 192) {
  return {
    x,y,w:12,h:16,vx:0,vy:0,grounded:true,facing:1,power:"small",
    invincible:0,hurtTimer:0,crouching:false,runningTimer:0,runningSpeed:false,
    jumpHeldGravity:0.125,jumpFallGravity:0.4375,jumpOrigin:y,jumpReleased:true,
    stompChain:0,skidding:false,posePower:"small",palette:0
  };
}

export function createGame() {
  const world = createWorld();
  return {
    status:"ready",area:"overworld",frame:0,time:400,score:0,coins:0,lives:3,cameraX:0,
    player:playerAt(),world,enemies:[],items:world.items,fireballs:[],effects:[],events:[],
    previousJump:false,previousRun:false,timerTicks:0,activeTicks:0,
    intervalTimer:0,stompTimer:0,brickCoinTimer:0,brickCoinStarted:false,transform:null,
    checkpoint:false,hiddenOneupAvailable:true,transition:null,finish:null,deathTicks:0,
    savedOverworld:null,hurry:false
  };
}

export function startGame(game) {
  if (game.status === "ready") game.status = "playing";
}

export function restartGame(game) {
  Object.assign(game,createGame());
  startGame(game);
}

function addLife(g,at = g.player) {
  g.lives++;
  event(g,"oneup",at);
}

function points(g,amount,at) {
  g.score += amount;
  if (at) g.effects.push({type:"score",x:at.x,y:at.y,w:0,h:0,value:amount,life:45,vy:-0.5});
}

function chainPoints(g,index,at) {
  if (index >= SCORES.length) addLife(g,at);
  else points(g,SCORES[index],at);
}

function coin(g,at) {
  points(g,200,at);
  g.coins++;
  if (g.coins >= 100) { g.coins -= 100; addLife(g,at); }
  event(g,"coin",at);
}

function killEnemy(g,e,award = 100,launch = true) {
  if (!e.alive) return;
  e.alive = false;
  if (award) points(g,award,e);
  g.effects.push({
    type:e.type,x:e.x,y:e.y,w:e.w,h:e.h,vx:launch?sign(e.x-g.player.x)*1.5:0,
    vy:launch?-3:0,life:launch?45:20,flattened:!launch,flipped:launch
  });
}

function hurt(g) {
  const p = g.player;
  if (p.invincible || p.hurtTimer || g.status !== "playing") return;
  if (p.power !== "small") {
    beginTransform(g,"hurt","small");
    p.y += p.h-16; p.h = 16;
    p.hurtTimer = 8; p.crouching = false;
    event(g,"hurt");
  } else die(g);
}

function die(g) {
  if (g.status !== "playing") return;
  g.status = "dying";
  g.deathTicks = 0; g.player.vx = 0; g.player.vy = 0;
  g.transition = null; g.transform = null; g.fireballs = [];
  event(g,"death");
}

function respawn(g) {
  g.lives--;
  if (g.lives <= 0) {
    g.lives = 0; g.status = "gameover"; return;
  }
  g.area = "overworld";
  g.world = createWorld("overworld",g.hiddenOneupAvailable);
  g.enemies = []; g.items = g.world.items; g.fireballs = []; g.effects = [];
  g.savedOverworld = null; g.transition = null; g.finish = null; g.transform = null;
  g.stompTimer = 0; g.brickCoinTimer = 0; g.brickCoinStarted = false;
  g.cameraX = g.checkpoint ? 1280 : 0;
  g.player = playerAt(g.cameraX+40);
  g.time = 400; g.timerTicks = 0; g.hurry = false; g.status = "playing";
  for (const s of g.world.spawns) if (s.x < g.cameraX) s.spawned = true;
}

function resizePlayer(g,down) {
  const p = g.player;
  if (p.power === "small") return;
  const feet = p.y+p.h;
  const standing = {...p,y:feet-32,h:32};
  const blocked = g.world.tiles.some(t=>solid(t)&&overlap(standing,t));
  const crouch = (down && (p.grounded || p.crouching)) || blocked;
  p.h = crouch ? 16 : 32;
  p.y = feet-p.h; p.crouching = crouch;
}

function beginTransform(g,kind,toPower) {
  const p = g.player;
  g.transform = {kind,fromPower:p.power,toPower,ticks:0,duration:{grow:59,fire:63,hurt:55}[kind]};
  p.posePower = p.power; p.palette = 0; p.power = toPower;
}

function updateTransform(g) {
  const t = g.transform, p = g.player;
  t.ticks++;
  if (t.kind==="fire") p.palette = (g.frame>>2)&3;
  else {
    p.posePower = t.ticks<7 ? t.fromPower : ((Math.floor((t.ticks-7)/4)%2)?t.toPower:t.fromPower);
    if (t.kind==="grow" && t.ticks===7) resizePlayer(g,false);
  }
  if (t.ticks>=t.duration) {
    p.posePower = p.power; p.palette = 0; g.transform = null;
    resizePlayer(g,false);
    return false;
  }
  return t.kind==="hurt" && t.ticks>15;
}

function advanceTimers(g) {
  g.stompTimer = Math.max(0,g.stompTimer-1);
  if (--g.intervalTimer>=0) return;
  g.intervalTimer = 20;
  g.player.invincible = Math.max(0,g.player.invincible-1);
  g.player.hurtTimer = Math.max(0,g.player.hurtTimer-1);
  g.brickCoinTimer = Math.max(0,g.brickCoinTimer-1);
  for (const e of g.enemies) if (e.revive>0) e.revive--;
}

function collect(g,i) {
  const p = g.player;
  i.alive = false;
  if (i.type === "coin") { coin(g,i); return; }
  if (i.type === "oneup") { addLife(g,i); return; }
  points(g,1000,i);
  if (i.type === "star") p.invincible = 35;
  else if (p.power === "small") beginTransform(g,"grow","big");
  else if (p.power === "big") beginTransform(g,"fire","fire");
  event(g,"powerup",i,{power:p.power,item:i.type});
}

function bump(g,t) {
  const p = g.player;
  if (t.bump > 0 || g.transform) return false;
  if (t.kind !== "brick" && t.kind !== "question") { event(g,"bump",t); return false; }
  t.bump = 12;
  event(g,"bump",t);
  if (t.hidden) {
    t.hidden = false;
    if (t.content === "oneup") g.hiddenOneupAvailable = false;
  }
  for (const e of g.enemies) {
    if (e.alive && e.x+e.w>t.x && e.x<t.x+t.w && Math.abs(e.y+e.h-t.y)<5) killEnemy(g,e);
  }
  for (const i of g.items) {
    if (!i.alive || i.emerge>0 || i.x+i.w<=t.x || i.x>=t.x+t.w || Math.abs(i.y+i.h-t.y)>=5) continue;
    if (i.type==="coin") collect(g,i);
    else if (i.type==="mushroom" || i.type==="oneup") {
      i.y -= 2; i.vy = -3; i.vx = i.x>=p.x?1:-1;
    }
  }
  if (t.content) {
    const content = t.content;
    if (content === "coin" || content === "multicoin") {
      coin(g,t);
      g.effects.push({type:"coin",x:t.x+4,y:t.y-8,w:8,h:16,vy:-3,life:28});
      if (content === "multicoin" && !g.brickCoinStarted) {
        g.brickCoinTimer = 11; g.brickCoinStarted = true;
      }
      if (content !== "multicoin" || !g.brickCoinTimer) {
        t.kind = "used"; t.used = true; t.content = undefined;
      }
    } else {
      const type = content === "powerup" ? (p.power === "small" ? "mushroom" : "flower") : content;
      g.items.push({
        type,x:t.x,y:t.y,w:16,h:16,vx:type==="flower"?0:1,vy:0,
        alive:true,emerge:17,emergeState:1,originY:t.y
      });
      t.kind = "used"; t.used = true; t.content = undefined;
      event(g,"spawn",t,{item:type});
    }
  } else if (t.kind === "brick" && p.power !== "small") {
    g.world.tiles.splice(g.world.tiles.indexOf(t),1);
    points(g,50,t);
    for (const [vx,vy] of [[-1.5,-4],[1.5,-4],[-1.5,-2],[1.5,-2]]) {
      g.effects.push({type:"brick",x:t.x+8,y:t.y,w:8,h:8,vx,vy,life:45});
    }
    event(g,"break",t);
    return true;
  }
  return false;
}

function moveX(g,b,dx) {
  b.x += dx;
  const hits = g.world.tiles.filter(t=>solid(t)&&overlap(b,t));
  if (!hits.length) return false;
  if (dx > 0) b.x = Math.min(...hits.map(t=>t.x-b.w));
  else if (dx < 0) b.x = Math.max(...hits.map(t=>t.x+t.w));
  return true;
}

function moveY(g,b,dy,isPlayer = false) {
  const oldY = b.y;
  b.y += dy;
  const hits = g.world.tiles.filter(t=>{
    if (t.kind === "flagpole" || t.kind === "castle") return false;
    if (t.hidden && !(isPlayer && dy < 0 && oldY >= t.y+t.h)) return false;
    return overlap(b,t);
  });
  if (!hits.length) return false;
  if (dy >= 0) {
    b.y = Math.min(...hits.map(t=>t.y-b.h)); b.vy = 0; b.grounded = true;
    if (isPlayer) b.stompChain = 0;
  } else {
    const bottom = Math.max(...hits.map(t=>t.y+t.h));
    const headHits = hits.filter(t=>t.y+t.h===bottom);
    const hit = headHits.sort((a,c)=>Math.abs(a.x+a.w/2-b.x-b.w/2)-Math.abs(c.x+c.w/2-b.x-b.w/2))[0];
    const broken = isPlayer && bump(g,hit);
    b.y = bottom;
    b.vy = broken ? -2 : 0;
  }
  return true;
}

function horizontal(g,input) {
  const p = g.player;
  const direction = Number(input.right)-Number(input.left);
  const moving = sign(p.vx);
  if (direction) p.facing = direction;
  if (p.grounded && input.run && direction === moving) p.runningTimer = 10;
  else if (!g.transform) p.runningTimer = Math.max(0,p.runningTimer-1);
  if (Math.abs(p.vx) >= 1.75) p.runningSpeed = true;
  else if (direction === moving) p.runningSpeed = false;
  let accel = 0.0556640625;
  if (p.grounded ? !(direction===moving && (input.run||p.runningTimer)) : Math.abs(p.vx)<1.5625) {
    accel = p.runningSpeed ? 0.05078125 : 0.037109375;
  }
  if (p.facing !== moving) accel *= 2;
  p.skidding = !!direction && p.vx*direction<0 && Math.abs(p.vx)>0.5 && p.grounded;
  if (direction && !(input.down && p.grounded && p.power !== "small")) {
    const cap = p.runningTimer || (!p.grounded && Math.abs(p.vx)>=1.5625) ? RUN : WALK;
    const next = p.vx+direction*accel;
    p.vx = direction>0 ? Math.min(next,cap) : Math.max(next,-cap);
  } else if (p.grounded) {
    p.vx = Math.abs(p.vx)<=accel ? 0 : p.vx-sign(p.vx)*accel;
  }
  if (moveX(g,p,p.vx)) p.vx = 0;
  if (p.x < g.cameraX) { p.x = g.cameraX; p.vx = Math.max(0,p.vx); }
  p.x = Math.min(p.x,g.world.width-p.w);
}

function beginJump(g) {
  const p = g.player, speed = Math.abs(p.vx)*16;
  const row = speed < 16 ? [-4,0.125,0.4375] : speed < 25 ? [-4,0.1171875,0.375] : [-5,0.15625,0.5625];
  p.vy = row[0]; p.jumpHeldGravity = row[1]; p.jumpFallGravity = row[2];
  p.jumpOrigin = p.y; p.jumpReleased = false; p.grounded = false;
  event(g,"jump");
}

function spawnEnemies(g) {
  const edge = g.cameraX+VIEW_WIDTH;
  for (const s of g.world.spawns) {
    if (s.spawned || s.x > edge+48) continue;
    s.spawned = true;
    if (s.x < g.cameraX-16) continue;
    for (let i=0;i<s.count;i++) {
      g.enemies.push({
        type:s.type,x:s.count>1?edge+i*24:s.x,y:s.y,w:16,h:s.type==="koopa"?24:16,
        vx:-0.5,vy:0,alive:true,group:s.group,grounded:false,revive:0,kickGrace:0,combo:0
      });
    }
  }
}

function updateEnemies(g,oldFeet) {
  const p = g.player;
  for (const e of g.enemies) {
    if (!e.alive) continue;
    e.kickGrace = Math.max(0,(e.kickGrace||0)-1);
    if (e.type === "shell" && !e.vx) {
      e.revive ??= 16;
      e.shaking = e.revive<3;
    }
    if (moveX(g,e,e.vx)) {
      e.vx = -e.vx;
      if (e.type === "shell") event(g,"bump",e);
    }
    e.grounded = false;
    moveY(g,e,e.vy || 0);
    e.vy = e.grounded ? 0 : fallSpeed(e.vy||0,61/256);
    if (e.y>256 || e.x+e.w<g.cameraX-32) { e.alive = false; continue; }
    if (e.type==="shell" && e.vx) {
      for (const target of g.enemies) {
        if (target!==e && target.alive && overlap(e,target)) {
          killEnemy(g,target,0); chainPoints(g,Math.min(3+(e.combo||0),SCORES.length),target);
          e.combo = (e.combo||0)+1; event(g,"kick",target);
        }
      }
    }
    if (!overlap(p,e)) continue;
    if (p.invincible) {
      killEnemy(g,e,enemyPoints(e)); continue;
    }
    if ((p.vy > 0 || g.stompTimer>0) && oldFeet <= e.y+7) {
      if (e.type === "goomba") killEnemy(g,e,0,false);
      else if (e.type === "koopa") {
        e.type = "shell"; e.y += e.h-16; e.h = 16; e.vx = 0; e.revive = 16;
      } else if (e.vx) { e.vx = 0; e.revive = 16; e.combo = 0; }
      else { kick(g,e); }
      p.y = e.y-p.h; p.vy = -4; p.grounded = false;
      p.stompChain++;
      chainPoints(g,p.stompChain+g.stompTimer-1,e); g.stompTimer++;
      event(g,"stomp",e);
    } else if (e.type === "shell" && e.vx === 0) kick(g,e);
    else if (!e.kickGrace) hurt(g);
    if (g.transform || g.status!=="playing") break;
  }
  if (g.transform || g.status!=="playing") return;
  for (let i=0;i<g.enemies.length;i++) for (let j=i+1;j<g.enemies.length;j++) {
    const a = g.enemies[i], b = g.enemies[j];
    if (!a.alive || !b.alive || !overlap(a,b)) continue;
    if ((a.type==="shell" && a.vx) || (b.type==="shell" && b.vx)) continue;
    const left = a.x<b.x?a:b, right = left===a?b:a;
    const distance = left.x+left.w-right.x;
    if (left.vx) moveX(g,left,-distance/2);
    moveX(g,right,Math.max(0,left.x+left.w-right.x));
    if (left.x+left.w>right.x) moveX(g,left,-(left.x+left.w-right.x));
    left.vx = -Math.abs(left.vx); right.vx = Math.abs(right.vx);
  }
  for (const e of g.enemies) {
    if (!e.alive || e.type!=="shell" || e.vx || e.revive>0) continue;
    const standing = {...e,y:e.y-8,h:24};
    if (g.world.tiles.some(t=>solid(t)&&overlap(standing,t))) continue;
    e.type = "koopa"; e.y -= 8; e.h = 24; e.vx = g.frame%2?-0.5:0.5; e.shaking = false;
  }
  g.enemies = g.enemies.filter(e=>e.alive);
}

function kick(g,e) {
  e.vx = (g.player.x+g.player.w/2 < e.x+e.w/2 ? 1 : -1)*3;
  e.kickGrace = 10; e.combo = 0;
  const index = e.revive<3 ? [9,5,3][e.revive] : g.player.stompChain+2;
  chainPoints(g,index,e); event(g,"kick",e);
}

function updateItems(g) {
  for (const i of g.items) {
    if (!i.alive) continue;
    if (i.emerge > 0) {
      if (g.frame%4===0) { i.y--; i.emergeState++; i.emerge = Math.max(0,18-i.emergeState); }
      if (i.emergeState>=6 && overlap(g.player,i)) collect(g,i);
      if (g.transform) break;
      continue;
    }
    if (i.type !== "coin" && i.type !== "flower") {
      if (moveX(g,i,i.vx||0)) i.vx = -i.vx;
      i.grounded = false;
      const falling = (i.vy||0)>=0;
      const collided = moveY(g,i,i.vy||0);
      if (collided && falling && i.type==="star") i.vy = -3;
      else i.vy = i.grounded ? 0 : fallSpeed(i.vy||0,i.type==="star"?28/256:61/256);
    }
    if (overlap(g.player,i)) collect(g,i);
    if (g.transform) break;
    if (i.y>256 || i.x+i.w<g.cameraX-32) i.alive = false;
  }
  g.items = g.items.filter(i=>i.alive);
}

function fire(g) {
  const p = g.player;
  if (p.power !== "fire" || p.crouching || g.fireballs.length>=2) return;
  g.fireballs.push({
    type:"fireball",x:p.x+(p.facing>0?p.w:-8),y:p.y+Math.min(12,p.h-8),w:8,h:8,
    vx:p.facing*4,vy:4,alive:true,life:150
  });
  event(g,"fire");
}

function updateFireballs(g) {
  for (const b of g.fireballs) {
    b.life--;
    if (moveX(g,b,b.vx)) b.alive = false;
    if (b.alive) {
      const down = b.vy>=0;
      const collided = moveY(g,b,b.vy);
      b.vy = fallSpeed(b.vy,80/256);
      if (collided) {
        if (down) b.vy = -3;
        else b.alive = false;
      }
      for (const e of g.enemies) {
        if (e.alive && overlap(b,e)) { killEnemy(g,e,enemyPoints(e)); b.alive = false; break; }
      }
    }
    if (!b.alive) g.effects.push({type:"explosion",x:b.x,y:b.y,w:16,h:16,life:10});
    if (b.y>256 || b.life<=0 || b.x<g.cameraX-16 || b.x>g.cameraX+VIEW_WIDTH+32) b.alive = false;
  }
  g.fireballs = g.fireballs.filter(b=>b.alive);
}

function startPipe(g,direction) {
  const p = g.player;
  g.transition = {phase:direction,ticks:0};
  p.vx = 0; p.vy = 0; p.runningTimer = 0; p.runningSpeed = false;
  g.fireballs = [];
  if (direction === "down") p.x = 57*TILE+10;
  event(g,"pipe",p,{direction});
}

function tryPipe(g,input) {
  const p = g.player;
  if (!p.grounded) return false;
  if (g.area==="overworld") {
    const t = g.world.tiles.find(t=>t.kind==="pipe"&&t.enter);
    if (t && input.down && p.x>=t.x+2 && p.x+p.w<=t.x+t.w-2 && Math.abs(p.y+p.h-t.y)<1) {
      startPipe(g,"down"); return true;
    }
  } else if (input.right && p.x+p.w>=13*TILE-1 && p.x<13*TILE && p.y+p.h>11*TILE+8) {
    startPipe(g,"right"); return true;
  }
  return false;
}

function updateTransition(g) {
  const t = g.transition, p = g.player;
  t.ticks++;
  if (t.phase==="down") {
    p.y += 0.5;
    if (t.ticks>=p.h*2) {
      g.savedOverworld = {world:g.world,enemies:g.enemies,items:g.items,cameraX:g.cameraX};
      g.area = "underground"; g.world = createWorld("underground"); g.enemies = [];
      g.items = g.world.items; g.effects = []; g.cameraX = 0;
      p.x = 32; p.y = 32; p.vy = 0; p.grounded = false;
      t.phase = "drop"; t.ticks = 0;
    }
  } else if (t.phase==="drop") {
    p.vy = Math.min(p.vy+0.15625,4);
    moveY(g,p,p.vy);
    if (p.grounded) g.transition = null;
  } else if (t.phase==="right") {
    p.x += 0.5;
    if (t.ticks>=48) {
      const saved = g.savedOverworld;
      g.area = "overworld"; g.world = saved.world; g.enemies = saved.enemies; g.items = saved.items;
      g.cameraX = Math.max(saved.cameraX,153*TILE); g.effects = [];
      p.x = 163*TILE+10; p.y = 11*TILE; p.vy = 0; p.grounded = false;
      t.phase = "up"; t.ticks = 0;
      for (const s of g.world.spawns) if (s.x<g.cameraX) s.spawned = true;
      g.enemies = g.enemies.filter(e=>e.x+e.w>=g.cameraX);
    }
  } else {
    p.y -= 0.5;
    if (t.ticks>=p.h*2) {
      p.y = 11*TILE-p.h; p.grounded = true; g.transition = null; g.savedOverworld = null;
    }
  }
  if (g.area === "overworld" && g.cameraX>=1280) g.checkpoint = true;
}

function startFlag(g) {
  const p = g.player;
  g.status = "flag"; p.vx = 0; p.vy = 0; p.x = 198*TILE-p.w+6; p.facing = 1;
  const index = [34,80,104,144].findIndex(y=>p.y<y);
  points(g,[5000,2000,800,400,100][index<0?4:index],p);
  const digit = g.time%10;
  g.finish = {phase:"slide",ticks:0,flagY:48,fireworks:[1,3,6].includes(digit)?digit:0};
  g.fireballs = []; event(g,"flag");
}

function updateFinish(g) {
  const f = g.finish, p = g.player;
  if (!f) return;
  f.ticks++;
  if (f.phase === "slide") {
    p.y = Math.min(192-p.h,p.y+2); f.flagY = Math.min(176,f.flagY+2);
    if (p.y===192-p.h && f.flagY===176) {
      f.phase = "walk"; f.ticks = 0; p.x = 199*TILE; p.grounded = false;
    }
  } else if (f.phase === "walk") {
    p.x = Math.min(g.world.castleX,p.x+1);
    moveY(g,p,Math.min(p.vy+0.25,4));
    p.vy = Math.min(p.vy+0.25,4);
    if (p.x>=g.world.castleX) { p.hidden = true; f.phase = "count"; f.ticks = 0; }
  } else if (f.phase === "count") {
    if (g.time>0) { g.time--; points(g,50); }
    else { f.phase = "fireworks"; f.ticks = 0; }
  } else {
    if (f.fireworks>0 && f.ticks%30===0) {
      const offsets = [[-32,-96],[24,-128],[-8,-112]];
      const offset = offsets[(f.fireworks-1)%offsets.length];
      const at = {x:g.world.castleX+offset[0],y:208+offset[1]};
      g.effects.push({type:"firework",...at,w:24,h:24,life:24});
      points(g,500); event(g,"firework",at); f.fireworks--;
    }
    if (f.fireworks===0 && f.ticks%30===29) { g.status = "won"; event(g,"win"); }
  }
}

function visuals(g) {
  for (const t of g.world.tiles) if (t.bump>0) t.bump--;
  for (const e of g.effects) {
    e.life--; e.x += e.vx||0; e.y += e.vy||0;
    if (e.type==="brick" || e.flipped || e.type==="coin") e.vy = (e.vy||0)+0.2;
  }
  g.effects = g.effects.filter(e=>e.life>0);
}

export function stepGame(g,input) {
  g.events = [];
  g.frame++;
  const jumpEdge = input.jump && !g.previousJump;
  const runEdge = input.run && !g.previousRun;
  g.previousJump = input.jump; g.previousRun = input.run;
  if (g.status==="ready" || g.status==="gameover" || g.status==="won") return;
  if (!g.transform) visuals(g);
  if (g.status==="dying") {
    g.deathTicks++;
    if (g.deathTicks===30) g.player.vy = -4;
    if (g.deathTicks>=30) { g.player.y += g.player.vy; g.player.vy += 0.15625; }
    if (g.deathTicks>=120) respawn(g);
    return;
  }
  if (g.status==="flag") { updateFinish(g); return; }
  if (g.transition) { updateTransition(g); return; }
  const transforming = !!g.transform;
  if (transforming && !updateTransform(g)) return;
  if (!transforming) { g.activeTicks++; advanceTimers(g); }
  const p = g.player;
  resizePlayer(g,input.down);
  if (!transforming && tryPipe(g,input)) return;
  if (jumpEdge && p.grounded) beginJump(g);
  horizontal(g,input);
  const oldFeet = p.y+p.h;
  p.grounded = false;
  moveY(g,p,p.vy || 0.001,true);
  if (!p.grounded) {
    if ((!input.jump && p.jumpOrigin-p.y>=1) || p.vy>=0) p.jumpReleased = true;
    p.vy = Math.min(p.vy+(p.jumpReleased?p.jumpFallGravity:p.jumpHeldGravity),4);
  }
  if (p.y>VIEW_HEIGHT+16) { die(g); return; }
  if (transforming) return;
  if (g.area==="overworld") {
    g.cameraX = Math.max(g.cameraX,Math.min(g.world.width-VIEW_WIDTH,p.x-112));
    if (g.cameraX>=1280) g.checkpoint = true;
    if (p.x+p.w>=g.world.flagX && p.x<g.world.flagX+16 && p.y+p.h>32 && p.y<192) {
      startFlag(g); return;
    }
  }
  spawnEnemies(g);
  updateEnemies(g,oldFeet);
  if (g.status!=="playing" || g.transform) return;
  updateItems(g);
  if (g.transform) return;
  if (runEdge) fire(g);
  updateFireballs(g);
  g.timerTicks++;
  if (g.timerTicks>=24) {
    g.timerTicks = 0; g.time = Math.max(0,g.time-1);
    if (g.time===100 && !g.hurry) { g.hurry = true; event(g,"hurry"); }
    if (g.time===0) die(g);
  }
}
