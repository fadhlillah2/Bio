import { createWorld, TILE, VIEW_WIDTH, VIEW_HEIGHT } from "./world.js";
import { LEVEL_IDS, getLevel } from "./levels.js";
import { createEnemy, enemyBounds, moveActor, updateProjectiles, enemyPoints, walker, canStomp, fireImmune, starImmune, shellImmune, random } from "./enemies.js";
export { TILE, VIEW_WIDTH, VIEW_HEIGHT };

const WALK = 1.5, RUN = 2.5;
const SCORES = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];
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
    stompChain:0,skidding:false,posePower:"small",palette:0,climbing:false,swimming:false
  };
}

export function createGame(levelId = "1-1") {
  const level = getLevel(levelId);
  const world = createWorld(levelId,level.startAreaId);
  const entry = world.entries.start;
  const player = playerAt(entry.x,entry.y);
  player.grounded = entry.transition === "none";
  player.swimming = world.physics === "water";
  return {
    levelId,level,areaId:world.areaId,status:"ready",area:world.theme,frame:0,time:level.timer,score:0,coins:0,lives:3,cameraX:entry.cameraX,
    player,world,enemies:[],items:world.items,fireballs:[],projectiles:[],vines:[],effects:[],events:[],
    areaCache:new Map(),frenzy:freshFrenzy(),seed:0x534d42,clearTicks:0,spring:null,loopState:{},cameraRegion:cameraRegion(world,entry.cameraX),
    previousJump:false,previousRun:false,previousUp:false,timerTicks:0,activeTicks:0,
    intervalTimer:0,stompTimer:0,brickCoinTimer:0,brickCoinStarted:false,transform:null,
    checkpoint:false,hiddenOneupAvailable:true,transition:level.startAreaId!==level.mainAreaId?{phase:"intro",ticks:0}:entryTransition(entry,player),finish:null,deathTicks:0,
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
  g.transition = null; g.transform = null; g.fireballs = []; g.projectiles = []; g.player.climbing = false;
  event(g,"death");
}

function respawn(g) {
  g.lives--;
  if (g.lives <= 0) {
    g.lives = 0; g.status = "gameover"; return;
  }
  const world = createWorld(g.levelId,g.level.mainAreaId,g.hiddenOneupAvailable);
  const entry = g.checkpoint && world.checkpoint ? world.checkpoint : world.entries.start;
  g.world = world; g.areaId = world.areaId; g.area = world.theme;
  g.enemies = []; g.items = world.items; g.fireballs = []; g.projectiles = []; g.vines = []; g.effects = [];
  g.areaCache.clear(); g.loopState={}; g.cameraRegion=cameraRegion(world,entry.cameraX); g.savedOverworld = null; g.finish = null; g.transform = null; g.spring = null;
  g.stompTimer = 0; g.brickCoinTimer = 0; g.brickCoinStarted = false;
  g.cameraX = entry.cameraX; g.player = playerAt(entry.x,entry.y);
  g.player.swimming = world.physics === "water"; g.transition = entryTransition(entry,g.player);
  g.time = g.level.timer; g.timerTicks = 0; g.hurry = false; g.status = "playing";
  resetFrenzy(g);
  for (const s of g.world.spawns) if (s.x < g.cameraX) s.spawned = true;
}

function resizePlayer(g,down) {
  const p = g.player;
  if (p.power === "small") return;
  const feet = p.y+p.h;
  const standing = {...p,y:feet-32,h:32};
  const blocked = g.world.tiles.some(t=>solid(t)&&!t.oneWay&&overlap(standing,t));
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
  for(const e of g.enemies) if(e.type==="hammerbro") e.walkingTimer??=g.level.secondaryHard?80:128;
  if (--g.intervalTimer>=0) return;
  g.intervalTimer = 20;
  g.player.invincible = Math.max(0,g.player.invincible-1);
  g.player.hurtTimer = Math.max(0,g.player.hurtTimer-1);
  g.brickCoinTimer = Math.max(0,g.brickCoinTimer-1);
  for (const e of g.enemies) {
    if (e.revive>0) e.revive--;
    if (e.type==="hammerbro" && e.walkingTimer>0) e.walkingTimer--;
  }
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
    if (e.alive && !shellImmune(e) && e.x+e.w>t.x && e.x<t.x+t.w && Math.abs(e.y+e.h-t.y)<5) killEnemy(g,e);
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
    } else if (content === "vine") {
      const exit = g.world.exits.find(e=>e.trigger==="vine" && (t.exitId?e.id===t.exitId:e.blockId===t.sourceId));
      g.vines.push({x:t.x+4,y:t.y,w:8,h:0,growing:true,exitId:t.exitId??exit?.id,baseY:t.y});
      t.kind="used"; t.used=true; t.content=undefined;
      event(g,"spawn",t,{item:"vine"});
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
  const hits = g.world.tiles.filter(t=>solid(t)&&!t.oneWay&&overlap(b,t));
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
    if (t.oneWay && (dy<0 || oldY+b.h>t.y+0.01)) return false;
    if (t.hidden && !(isPlayer && dy < 0 && oldY >= t.y+t.h)) return false;
    return overlap(b,t);
  });
  if (isPlayer && dy>=0) {
    for (const platform of g.world.platforms) {
      if (!platform.wrapped && oldY+b.h<=Math.max(platform.y,platform.y-(platform.dy??0))+0.01 && b.y+b.h>=platform.y && b.x<platform.x+platform.w && b.x+b.w>platform.x) hits.push(platform);
    }
  }
  if (!hits.length) return false;
  if (dy >= 0) {
    b.y = Math.min(...hits.map(t=>t.y-b.h)); b.vy = 0; b.grounded = true;
    if (isPlayer) {
      b.stompChain = 0;
      const support=hits.find(t=>t.y===b.y+b.h);
      b.supportId=g.world.platforms.includes(support)?support.id:null;
      if (support?.kind==="spring" && !g.spring) g.spring={tile:support,ticks:0,force:-7,baseY:support.y};
    }
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
    if(s.type==="piranha"&&g.frenzy.warpActive) continue;
    if(s.type==="lakitu"&&(g.frenzy.stopped||g.enemies.some(e=>e.alive&&e.type==="lakitu"))) continue;
    for (let i=0;i<(s.count??1);i++) {
      g.enemies.push(createEnemy(s,s.count>1?edge+i*24:s.x));
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
    if (!moveActor(g,e,{moveX,moveY,solid,fallSpeed})) {
      if (moveX(g,e,e.vx)) {
        e.vx = -e.vx;
        if (e.type === "shell") event(g,"bump",e);
      }
      e.grounded = false;
      moveY(g,e,e.vy || 0);
      e.vy = e.grounded ? 0 : fallSpeed(e.vy||0,61/256);
    }
    if ((e.y>272 && e.type!=="podoboo") || e.x+e.w<g.cameraX-32) { e.alive = false; continue; }
    if (e.type==="shell" && e.vx) {
      for (const target of g.enemies) {
        if (target!==e && target.alive && !shellImmune(target) && overlap(e,enemyBounds(target))) {
          killEnemy(g,target,0); chainPoints(g,Math.min(3+(e.combo||0),SCORES.length),target);
          e.combo = (e.combo||0)+1; event(g,"kick",target);
        }
      }
    }
    const bounds=enemyBounds(e);
    if (!overlap(p,bounds)) continue;
    if (p.invincible && !starImmune(e)) {
      killEnemy(g,e,enemyPoints(e)); continue;
    }
    if (canStomp(e,p.swimming) && (p.vy > 0 || g.stompTimer>0) && oldFeet <= bounds.y+7) {
      if (e.type === "goomba") killEnemy(g,e,0,false);
      else if (e.type === "koopa" && e.winged) {
        e.winged=false; e.motion="walk"; e.variant=e.variant?.toLowerCase().includes("red")?"red":"green"; e.vy=0;
      } else if (e.type === "koopa" || e.type === "beetle") {
        e.shellType=e.type; e.type = "shell"; e.y += e.h-16; e.h = 16; e.vx = 0; e.revive = 16;
      } else if (e.type==="shell" && e.vx) { e.vx = 0; e.revive = 16; e.combo = 0; }
      else if (e.type==="shell") kick(g,e);
      else killEnemy(g,e,0);
      const special=["hammerbro","lakitu","blooper","cheepcheep","bulletbill"].includes(e.type);
      p.y = bounds.y-p.h; p.vy = special?-3:-4; p.grounded = false;
      if(special) points(g,({hammerbro:1000,lakitu:800,blooper:1000}[e.type]??200),e);
      else { p.stompChain++; chainPoints(g,p.stompChain+g.stompTimer-1,e); g.stompTimer++; }
      event(g,"stomp",e);
    } else if (e.type === "shell" && e.vx === 0) kick(g,e);
    else if (!e.kickGrace) hurt(g);
    if (g.transform || g.status!=="playing") break;
  }
  if (g.transform || g.status!=="playing") return;
  for (let i=0;i<g.enemies.length;i++) for (let j=i+1;j<g.enemies.length;j++) {
    const a = g.enemies[i], b = g.enemies[j];
    if (!a.alive || !b.alive || !walker(a) || !walker(b) || a.winged || b.winged || !overlap(a,b)) continue;
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
    const height=e.shellType==="beetle"?16:24;
    const standing = {...e,y:e.y+e.h-height,h:height};
    if (g.world.tiles.some(t=>solid(t)&&!t.oneWay&&overlap(standing,t))) continue;
    e.type = e.shellType??"koopa"; e.y += e.h-height; e.h = height; e.vx = g.frame%2?-0.5:0.5; e.shaking = false;
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
        if (e.alive && overlap(b,enemyBounds(e))) {
          if (!fireImmune(e)) {
            if (e.type==="bowser") { e.hp=(e.hp??5)-1; if(e.hp<=0) killEnemy(g,e,5000); }
            else killEnemy(g,e,enemyPoints(e));
          }
          b.alive = false; break;
        }
      }
    }
    if (!b.alive) g.effects.push({type:"explosion",x:b.x,y:b.y,w:16,h:16,life:10});
    if (b.y>256 || b.life<=0 || b.x<g.cameraX-16 || b.x>g.cameraX+VIEW_WIDTH+32) b.alive = false;
  }
  g.fireballs = g.fireballs.filter(b=>b.alive);
}

function entryTransition(entry,p) {
  if(entry.climbing) return {phase:"vine-entry",ticks:0,targetY:185-p.h,targetX:entry.x+16};
  if (!entry.transition || entry.transition==="none") return null;
  p.grounded=false;
  if (entry.transition==="pipe-up") {
    const targetY=p.y; p.y+=p.h;
    return {phase:"up",ticks:0,targetY};
  }
  if (entry.transition==="pipe-right") return {phase:"emerge-right",ticks:0,targetX:p.x+24};
  return {phase:"drop",ticks:0};
}

function saveArea(g) {
  const items=[...new Set([...g.world.items,...g.items])].filter(i=>i.alive);
  g.areaCache.set(g.areaId,{world:g.world,enemies:g.enemies,items,vines:g.vines,cameraX:g.cameraX,frenzy:{...g.frenzy}});
}

function cameraRegion(world,cameraX) {
  return world.cameraLock?.regions?.find(r=>r.entryPage===Math.floor(cameraX/256))??world.cameraLock;
}
function visibleItems(world,items,cameraX) {
  const region=cameraRegion(world,cameraX);
  return region&&region.min===region.max?items.filter(i=>i.x>=region.min&&i.x<region.max+VIEW_WIDTH):items;
}

function enterArea(g,target) {
  const changesLevel=target.levelId!==g.levelId;
  if(changesLevel) {
    g.levelId=target.levelId; g.level=getLevel(g.levelId);
    g.areaCache.clear(); g.checkpoint=false; g.time=g.level.timer; g.hurry=false; g.timerTicks=0;
  } else saveArea(g);
  const fresh=createWorld(g.levelId,target.areaId,g.hiddenOneupAvailable);
  const saved=g.areaCache.get(fresh.areaId);
  g.world=saved?.world??fresh; g.areaId=g.world.areaId; g.area=g.world.theme;
  g.frenzy=saved?.frenzy??freshFrenzy();
  g.enemies=saved?.enemies??[]; g.items=saved?.items??g.world.items; g.vines=saved?.vines??[];
  const entry=g.world.entries[target.entryId];
  if(!entry) throw new RangeError("Unknown area entry: "+target.entryId);
  const p=g.player;
  p.x=entry.x; p.y=entry.y-(p.h-16); p.vx=0; p.vy=0; p.grounded=entry.transition==="none";
  p.climbing=false; p.swimming=g.world.physics==="water"; p.hidden=false;
  if(entry.climbing) {
    const vine={x:p.x+p.w/2,y:144,w:8,h:96,baseY:240,growing:false};
    g.vines.push(vine); p.climbing=true; p.vine=vine;
  }
  p.runningTimer=0; p.runningSpeed=false; p.supportId=null;
  g.cameraX=entry.cameraX; g.cameraRegion=cameraRegion(g.world,g.cameraX);
  g.items=visibleItems(g.world,g.items,g.cameraX);
  g.fireballs=[]; g.projectiles=[]; g.effects=[]; g.spring=null;
  g.transition=entryTransition(entry,p);
  for(const s of g.world.spawns) if(s.x<g.cameraX) s.spawned=true;
  g.enemies=g.enemies.filter(e=>e.x+e.w>=g.cameraX);
  resetFrenzy(g,!!saved);
  g.loopState={};
  for(const gate of g.world.loops) gate.checked=gate.x<p.x;
  updateCheckpoint(g);
}

function startPipe(g,exit) {
  const p=g.player;
  g.transition={phase:exit.direction,ticks:0,target:exit.target};
  p.vx=0; p.vy=0; p.runningTimer=0; p.runningSpeed=false; p.climbing=false;
  g.fireballs=[]; g.projectiles=[];
  if(exit.direction==="down") p.x=exit.x+(exit.w-p.w)/2;
  event(g,"pipe",p,{direction:exit.direction});
}

function tryExit(g,input) {
  const p=g.player,feet=p.y+p.h;
  for(const e of g.world.exits) {
    if(e.trigger==="pipe") {
      if(e.direction==="down" && input.down && p.grounded && p.x>=e.x+2 && p.x+p.w<=e.x+e.w-2 && Math.abs(feet-e.y)<2) {
        startPipe(g,e); return true;
      }
      if(e.direction==="right" && input.right && p.x+p.w>=e.x-1 && p.x<e.x+e.w && feet>e.y && p.y<e.y+e.h) {
        startPipe(g,e); return true;
      }
      if(e.direction==="up" && input.up && overlap(p,e)) { startPipe(g,e); return true; }
    } else if(e.trigger==="vine" && p.climbing && p.vine?.exitId===e.id && p.y+p.h<=(e.triggerFeetY??e.y+e.h)) {
      enterArea(g,e.target); return true;
    } else if(e.trigger==="edge" && overlap(p,e)) {
      enterArea(g,e.target); return true;
    }
  }
  return false;
}

function updateTransition(g) {
  const t=g.transition,p=g.player;
  t.ticks++;
  if(t.phase==="intro") {
    if(tryExit(g,{right:true})) return;
    moveX(g,p,0.75); p.grounded=false; moveY(g,p,Math.min(4,p.vy+0.25)); p.vy=p.grounded?0:Math.min(4,p.vy+0.25);
  } else if(t.phase==="vine-entry") {
    if(p.y>t.targetY) { p.y=Math.max(t.targetY,p.y-1); p.climbing=true; }
    else {
      p.climbing=false; p.x=Math.min(t.targetX,p.x+1);
      if(p.x>=t.targetX) { p.vine=null; p.grounded=false; g.transition=null; }
    }
  } else if(t.target) {
    if(t.phase==="right") p.x+=0.5;
    else p.y+=t.phase==="down"?0.5:-0.5;
    if(t.ticks>=(t.phase==="right"?48:p.h*2)) enterArea(g,t.target);
  } else if(t.phase==="drop") {
    p.vy=Math.min(p.vy+0.15625,4); moveY(g,p,p.vy);
    if(p.grounded || p.swimming || p.y>VIEW_HEIGHT) g.transition=null;
  } else if(t.phase==="emerge-right") {
    p.x=Math.min(t.targetX,p.x+0.5);
    if(p.x>=t.targetX) { g.transition=null; p.grounded=false; }
  } else {
    p.y=Math.max(t.targetY,p.y-0.5);
    if(p.y<=t.targetY) { g.transition=null; p.grounded=true; }
  }
  updateCheckpoint(g);
}

function updateCheckpoint(g) {
  const checkpoint=g.world.checkpoint;
  if(g.areaId===g.level.mainAreaId&&checkpoint&&g.cameraX>=checkpoint.cameraX) g.checkpoint=true;
}

function clearLevel(g) {
  g.status="clear"; g.clearTicks=0; g.fireballs=[]; g.projectiles=[]; event(g,"levelclear");
}

function nextLevel(g) {
  const next=LEVEL_IDS[LEVEL_IDS.indexOf(g.levelId)+1];
  const fresh=createGame(next),power=g.player.power;
  Object.assign(fresh,{score:g.score,coins:g.coins,lives:g.lives,frame:g.frame,seed:g.seed,
    previousJump:g.previousJump,previousRun:g.previousRun,previousUp:g.previousUp,status:"playing"});
  fresh.player.power=power; fresh.player.posePower=power;
  if(power!=="small") { fresh.player.h=32; fresh.player.y-=16; if(fresh.transition?.targetY!=null) fresh.transition.targetY-=16; }
  Object.assign(g,fresh);
}

function startFlag(g) {
  const p=g.player,goal=g.world.goal;
  g.status="flag"; p.vx=0; p.vy=0; p.x=goal.x-p.w+6; p.facing=1;
  const index=[34,80,104,144].findIndex(y=>p.y<y);
  points(g,[5000,2000,800,400,100][index<0?4:index],p);
  const digit=g.time%10;
  g.finish={kind:"flag",phase:"slide",ticks:0,flagY:goal.y+16,fireworks:[1,3,6].includes(digit)?digit:0};
  g.fireballs=[]; g.projectiles=[]; event(g,"flag");
}

function startCastle(g) {
  const p=g.player,goal=g.world.goal;
  g.status="flag"; p.vx=0; p.vy=0; p.facing=1; p.climbing=false;
  g.finish={kind:goal.kind==="ending"?"ending":"castle",phase:"bridge",ticks:0,bridgeIndex:0,
    message:goal.kind==="ending"?["THANK YOU MARIO!","YOUR QUEST IS OVER."]:["THANK YOU MARIO!","BUT OUR PRINCESS IS IN","ANOTHER CASTLE!"]};
  g.fireballs=[]; g.projectiles=[]; event(g,"axe");
}

function updateFinish(g) {
  const f=g.finish,p=g.player,goal=g.world.goal;
  if(!f) return;
  f.ticks++;
  const floorY=goal.floorY??208,castleX=goal.castleX??goal.x+96;
  if(f.phase==="slide") {
    const base=goal.y+goal.h;
    p.y=Math.min(base-p.h,p.y+2); f.flagY=Math.min(base-16,f.flagY+2);
    if(p.y===base-p.h&&f.flagY===base-16) {
      f.phase="walk"; f.ticks=0; p.x=goal.x+16; p.grounded=false;
    }
  } else if(f.phase==="bridge") {
    const ids=goal.bridgeIds??[];
    if(f.ticks%4===0 && f.bridgeIndex<ids.length) {
      const id=ids[ids.length-1-f.bridgeIndex++];
      g.world.tiles=g.world.tiles.filter(t=>t.id!==id); event(g,"bridge");
    }
    if(f.bridgeIndex>=ids.length) {
      for(const e of g.enemies) if(e.type==="bowser"&&e.alive) { e.y+=3; if(e.y>272) e.alive=false; }
      if(f.ticks>=Math.max(60,ids.length*4+32)) { f.phase="walk"; f.ticks=0; event(g,"castleclear"); }
    }
  } else if(f.phase==="walk") {
    const target=f.kind==="flag"?castleX:(goal.npcX??castleX)-24;
    p.x=Math.min(target,p.x+1);
    if(f.kind==="flag") {
      moveY(g,p,Math.min(p.vy+0.25,4)); p.vy=Math.min(p.vy+0.25,4);
    } else { p.y=Math.min(floorY-p.h,p.y+2); }
    if(p.x>=target) {
      if(f.kind==="flag") p.hidden=true;
      f.phase=f.kind==="flag"?"count":"message"; f.ticks=0;
    }
  } else if(f.phase==="message") {
    if(f.ticks>=180) {
      if(f.kind==="ending") { f.phase="ending"; f.ticks=0; event(g,"ending"); }
      else clearLevel(g);
    }
  } else if(f.phase==="ending") {
    if(f.ticks>=240) { g.status="won"; event(g,"win"); }
  } else if(f.phase==="count") {
    if(g.time>0) { g.time--; points(g,50); }
    else { f.phase="fireworks"; f.ticks=0; }
  } else {
    if(f.fireworks>0&&f.ticks%30===0) {
      const offsets=[[-32,-96],[24,-128],[-8,-112]],offset=offsets[(f.fireworks-1)%offsets.length];
      const at={x:castleX+offset[0],y:floorY+offset[1]};
      g.effects.push({type:"firework",...at,w:24,h:24,life:24});
      points(g,500); event(g,"firework",at); f.fireworks--;
    }
    if(f.fireworks===0&&f.ticks%30===29) clearLevel(g);
  }
  if(f.kind!=="flag"&&["walk","message","ending"].includes(f.phase)) updateCamera(g);
}

function updatePlatforms(g) {
  const p=g.player,platforms=g.world.platforms;
  const ridden=platforms.find(t=>p.grounded&&p.x<t.x+t.w&&p.x+p.w>t.x&&Math.abs(p.y+p.h-t.y)<1);
  const before=new Map(platforms.map(t=>[t.id,{x:t.x,y:t.y}]));
  const handled=new Set();
  for(const t of platforms) t.wrapped=false;
  for(const t of platforms) {
    if(handled.has(t.id)) continue;
    if(t.triggerX!=null && t.triggerX>g.cameraX+VIEW_WIDTH+48) continue;
    t.originX??=t.x; t.originY??=t.y; t.direction??=-1; t.vy??=0;
    const range=Array.isArray(t.range)?{min:t.range[0],max:t.range[1]}:t.range;
    if(t.motion==="horizontal") {
      if(t.variant==="cloudRiderPlatform") {
        if(t===ridden) t.started=true;
        if(t.started) t.x+=t.speed;
      } else if(t.counterMax!=null) {
        t.counter??=0; t.counterDirection??=1; t.counterClock=(t.counterClock??0)+1;
        if(t.counterClock>=t.counterTicks) {
          t.counterClock=0; t.counter+=t.counterDirection;
          if(t.counter>=t.counterMax) { t.counter=t.counterMax; t.counterDirection=-1; }
          else if(t.counter<=0) { t.counter=0; t.counterDirection=1; t.direction*=-1; }
        }
        t.x+=t.direction*t.counter/16;
      } else {
        t.direction=t.direction<0&&t.x<=range.min?1:t.direction;
        t.x+=t.speed*t.direction;
        if(t.x>=range.max) { t.x=range.max; t.direction=-1; }
        if(t.x<=range.min) { t.x=range.min; t.direction=1; }
      }
    } else if(t.motion==="vertical") {
      if(range.center!=null) {
        if(!t.vy&&t.y<range.min) { if(g.frame%8===0) t.y++; }
        else {
          t.vy=Math.max(-t.maxSpeed,Math.min(t.maxSpeed,t.vy+(t.y<range.center?t.acceleration:-t.upAcceleration)));
          t.y+=t.vy;
        }
      } else {
        t.y+=t.speed*t.direction;
        if(t.y>=range.max) { t.y=range.max; t.direction=-1; }
        if(t.y<=range.min) { t.y=range.min; t.direction=1; }
      }
    } else if(t.motion==="lift") {
      t.y+=t.speed;
      if(t.y>range.max) { t.y=range.min; t.wrapped=true; }
      else if(t.y<range.min) { t.y=range.max; t.wrapped=true; }
    } else if(t.motion==="fall") {
      if(t===ridden) { t.vy=Math.min(t.maxSpeed??2,t.vy+(t.acceleration??127/256)); t.y+=t.vy; }
    } else if(t.motion==="balance") {
      const pair=platforms.find(other=>other.id===t.pairId);
      if(pair) handled.add(pair.id);
      if(t.falling||pair?.falling) {
        for(const part of pair?[t,pair]:[t]) { part.falling=true; part.vy=Math.min(3,(part.vy??0)+(part.fallAcceleration??32/256)); part.y+=part.vy; }
      } else {
        const loaded=t===ridden?1:pair===ridden?-1:0;
        if(loaded) t.vy=Math.max(-3,Math.min(3,t.vy+(loaded>0?(t.acceleration??5/256):-(t.upAcceleration??10/256))));
        else t.vy=Math.abs(t.vy)<0.04?0:t.vy-sign(t.vy)*0.04;
        t.y+=t.vy; if(pair) pair.y-=t.vy;
        if(loaded && (t.y<range.min||pair&&pair.y<range.min)) {
          t.falling=true; if(pair) pair.falling=true; points(g,1000,t);
        }
      }
    }
  }
  for(const t of platforms) { const old=before.get(t.id); t.dx=t.x-old.x; t.dy=t.wrapped?0:t.y-old.y; }
  if(!ridden) return;
  if(ridden.wrapped) { p.grounded=false; p.supportId=null; return; }
  moveX(g,p,ridden.dx);
  const oldY=p.y,hit=moveY(g,p,ridden.dy);
  if(ridden.dy<0 && p.y>oldY+ridden.dy+0.01) { die(g); return; }
  if(ridden.dy>0 && hit && p.y<oldY+ridden.dy-0.01) { p.supportId=null; return; }
  if(p.x<ridden.x+ridden.w&&p.x+p.w>ridden.x) { p.y=ridden.y-p.h; p.grounded=true; p.supportId=ridden.id; }
  else { p.grounded=false; p.supportId=null; }
}

function updateVines(g,input,jumpEdge) {
  const p=g.player;
  for(const v of g.vines) {
    if(v.growing && (g.frame&2)) { v.h=Math.min(96,v.h+1); v.y=v.baseY-v.h; if(v.h===96) v.growing=false; }
  }
  if(!p.climbing && input.up) {
    const vine=g.vines.find(v=>overlap(p,{...v,x:v.x-4,w:v.w+8}));
    if(vine) { p.climbing=true; p.vine=vine; p.vx=0; p.vy=0; p.x=vine.x-p.w/2; p.grounded=false; }
  }
  if(!p.climbing) return false;
  if(jumpEdge) {
    p.climbing=false; p.vine=null; p.vx=(input.left?-1:1)*1.5; beginJump(g); return false;
  }
  const v=p.vine;
  p.vx=0; p.vy=0;
  const exit=g.world.exits.find(e=>e.id===v.exitId);
  const auto=exit&&p.y+p.h<=exit.autoClimbFeetY;
  p.y+=auto?-1.5:Number(input.down)*1.5-Number(input.up)*1.5;
  if(!auto) p.y=Math.max(v.y-p.h,Math.min(v.baseY-p.h,p.y));
  return true;
}

function updateSpring(g,jumpEdge) {
  if(!g.spring) return false;
  const s=g.spring,p=g.player,t=s.tile;
  s.ticks++;
  if(s.ticks>=8 && jumpEdge) s.force=-12;
  const compression=[8,16,8,0][Math.min(3,Math.floor(s.ticks/4))];
  t.compression=compression; p.y=s.baseY+compression-p.h;
  p.vx=0; p.vy=0; p.grounded=true;
  if(s.ticks>=16) {
    p.vy=s.force; p.grounded=false; p.jumpReleased=false; p.jumpOrigin=p.y;
    g.spring=null; t.compression=0; event(g,"jump");
  }
  return true;
}

function moveWater(g,input,jumpEdge) {
  const p=g.player;
  const direction=Number(input.right)-Number(input.left);
  if(direction) p.facing=direction;
  const cap=p.grounded?1:1.5;
  p.vx=direction?Math.max(-cap,Math.min(cap,p.vx+direction*0.037109375)):p.vx*0.96;
  if(moveX(g,p,p.vx)) p.vx=0;
  p.x=Math.max(g.cameraX,Math.min(g.world.width-p.w,p.x));
  const whirl=(g.world.whirlpools??[]).find(w=>overlap(p,w));
  if(jumpEdge && p.y<224) { p.vy=whirl?-1:-1.5; p.swimTimer=32; event(g,"jump"); }
  p.swimTimer=Math.max(0,(p.swimTimer||0)-1);
  if(whirl) {
    if(g.frame%2===1) moveX(g,p,sign(whirl.x+whirl.w/2-p.x-p.w/2));
    p.vy=Math.min(1,p.vy+16/256);
  }
  p.grounded=false; moveY(g,p,p.vy||0.001,true);
  const gravity=whirl?(input.jump?4:9)/256:(input.jump?13:10)/256;
  p.vy=p.grounded?0:Math.min(2,p.vy+gravity);
  if(p.y<32) { p.y=32; p.vy=Math.max(0,p.vy); }
}

function freshFrenzy() {
  return {cursor:0,type:null,variant:null,timer:96,warpActive:false,stopped:false,flameCounter:0,bossSeen:false,lakituAbsentChecks:0};
}

function updateFrenzyCommands(g) {
  const f=g.frenzy,commands=g.world.frenzyCommands;
  while(f.cursor<commands.length&&commands[f.cursor].activationX<=g.cameraX) {
    const command=commands[f.cursor++];
    if(command.action==="warp") {
      f.warpActive=true;
      g.enemies=g.enemies.filter(e=>e.type!=="piranha");
    } else if(command.action==="stop") {
      f.type=null; f.variant=null; f.stopped=true; f.lakituAbsentChecks=0;
      for(const e of g.enemies) if(e.type==="lakitu") e.retiring=true;
    } else {
      if(f.type!==command.type||f.variant!==command.variant) {
        f.type=command.type; f.variant=command.variant; f.lakituAbsentChecks=0;
      }
      f.stopped=false;
    }
  }
}

function resetFrenzy(g,preserveTimer=false) {
  const previous=g.frenzy;
  g.frenzy=freshFrenzy(); updateFrenzyCommands(g);
  if(preserveTimer) {
    g.frenzy.bossSeen=previous.bossSeen;
    if(previous.type===g.frenzy.type) {
      g.frenzy.timer=previous.timer; g.frenzy.flameCounter=previous.flameCounter;
      g.frenzy.lakituAbsentChecks=previous.lakituAbsentChecks;
    }
  }
}

function updateFrenzy(g) {
  const f=g.frenzy,hard=g.level.secondaryHard;
  const boss=g.enemies.find(e=>e.alive&&e.type==="bowser");
  const lakitu=g.enemies.find(e=>e.alive&&e.type==="lakitu"&&!e.retiring);
  const breath=boss&&(g.level.worldNumber<=5||g.level.worldNumber===8);
  if(boss) f.bossSeen=true;
  else if(f.bossSeen&&f.type==="bowser-flame") f.type=null;
  if(breath&&f.type!=="bowser-flame") { f.type="bowser-flame"; f.timer=boss.fireTimer??223; }
  else if(lakitu&&!f.type&&!f.stopped) { f.type="lakitu"; f.timer=lakitu.throwTimer??128; }
  if(f.timer>0) f.timer--;
  if(!f.type||f.timer>0) return;
  if(f.type==="bowser-flame") {
    if(boss&&!breath) return;
    const y=[144,128,112,144][random(g)&3];
    g.projectiles.push({type:"flame",x:boss?boss.x-14:g.cameraX+VIEW_WIDTH+32,y:boss?boss.y+8:y,
      w:24,h:8,vx:hard?-1.375:-1.25,vy:0,targetY:y,alive:true});
    f.timer=[191,64,191,191,191,64,64,191][f.flameCounter++%8]+(boss?0:32)-(hard?16:0);
  } else if(f.type==="lakitu") {
    f.timer=128;
    if(!lakitu) {
      if(++f.lakituAbsentChecks>=7) {
        g.enemies.push(createEnemy({type:"lakitu",x:g.cameraX+VIEW_WIDTH+32,y:32}));
        f.lakituAbsentChecks=0;
      }
      return;
    }
    f.lakituAbsentChecks=0;
    if(g.player.y+g.player.h-32<44) return;
    g.projectiles.push({type:"spiny-egg",x:lakitu.x,y:lakitu.y,w:16,h:16,vx:0,vy:-3,angle:0,alive:true});
  } else if(f.type==="bullet-spawner") {
    g.enemies.push(createEnemy({type:"bulletbill",x:g.cameraX+VIEW_WIDTH+16,y:80+(random(g)%8)*16,vx:-1.5}));
    f.timer=hard?96:128; event(g,"blast",g.enemies.at(-1));
  } else if(f.type==="fish-spawner") {
    const flying=f.variant==="flying";
    g.enemies.push(createEnemy({type:"cheepcheep",variant:flying?"flying":"grayCheep",motion:flying?"flying":"swim",
      x:flying?g.cameraX+32+random(g)%224:g.cameraX+VIEW_WIDTH+16,y:flying?248:64+(random(g)%8)*16,
      vx:flying?1.5+(random(g)&3)/2:-0.25}));
    f.timer=hard?96:128;
  }
}

function updateHazards(g) {
  for(const h of g.world.hazards) {
    if(h.type==="lava") { if(overlap(g.player,h)) die(g); continue; }
    if(h.type==="firebar") {
      h.angle=(h.angle??0)+(h.angularSpeed??h.speed??(40/256/32*Math.PI*2));
      for(let i=0;i<(h.length??6);i++) {
        const ball={x:h.x+Math.cos(h.angle)*(h.spacing??8)*i-4,y:h.y+Math.sin(h.angle)*(h.spacing??8)*i-4,w:8,h:8};
        if(overlap(g.player,ball)) hurt(g);
      }
      continue;
    }
    if(h.x>g.cameraX+VIEW_WIDTH+32 || h.x+h.w<g.cameraX) continue;
    h.timer??=h.interval??96;
    if(--h.timer>0) continue;
    h.timer=h.interval??(g.level.secondaryHard?96:128);
    if(h.type==="cannon") {
      if(Math.abs(g.player.x-h.x)<40) continue;
      g.enemies.push(createEnemy({type:"bulletbill",x:h.x,y:h.y,vx:sign(g.player.x-h.x)*1.5}));
      event(g,"blast",h);
    }
  }
}

function updateLoops(g) {
  const p=g.player;
  for(const gate of g.world.loops) {
    if(gate.checked || p.x<gate.x) continue;
    gate.checked=true;
    g.loopState??={};
    const state=g.loopState[gate.group]??={count:0,correct:0};
    const correct=Math.abs(p.y+p.h-gate.requiredFeetY)<0.01&&(!gate.requiresGrounded||p.grounded);
    state.count++;
    if(correct) state.correct++;
    if(gate.sequence+1<gate.groupLength) continue;
    if(state.count===gate.groupLength&&state.correct===gate.groupLength) continue;
    const checkpoint=gate.resetCheckpoint;
    p.x=checkpoint.x; p.y=checkpoint.feetY-p.h; g.cameraX=checkpoint.cameraX;
    p.vx=0; p.vy=0; p.grounded=true; p.supportId=null; p.climbing=false; p.vine=null;
    p.runningTimer=0; p.runningSpeed=false; p.stompChain=0;
    g.enemies=[]; g.fireballs=[]; g.projectiles=[]; g.effects=[]; g.spring=null; g.transition=null;
    delete g.loopState[gate.group];
    for(const loop of g.world.loops) if(loop.group===gate.group) loop.checked=false;
    g.cameraRegion=cameraRegion(g.world,g.cameraX);
    resetFrenzy(g);
    for(const spawn of g.world.spawns) spawn.spawned=spawn.x<g.cameraX;
    return true;
  }
  return false;
}

function updateCamera(g) {
  const lock=g.cameraRegion??g.world.cameraLock;
  if(lock===true) return;
  const min=typeof lock==="object"&&lock?lock.min??0:0;
  const max=typeof lock==="object"&&lock?lock.max??g.world.width-VIEW_WIDTH:g.world.width-VIEW_WIDTH;
  g.cameraX=Math.max(g.cameraX,min,Math.min(max,g.player.x-112));
  updateCheckpoint(g);
}

function visuals(g) {
  for (const t of g.world.tiles) if (t.bump>0) t.bump--;
  for (const e of g.effects) {
    e.life--; e.x += e.vx||0; e.y += e.vy||0;
    if (e.type==="brick" || e.flipped || e.type==="coin") e.vy = (e.vy||0)+0.2;
  }
  g.effects = g.effects.filter(e=>e.life>0);
}

export function stepGame(g,input = {}) {
  input={left:false,right:false,down:false,up:false,jump:false,run:false,...input};
  g.events=[];
  g.frame++;
  const jumpEdge=input.jump&&!g.previousJump,runEdge=input.run&&!g.previousRun,upEdge=input.up&&!g.previousUp;
  g.previousJump=input.jump; g.previousRun=input.run; g.previousUp=input.up;
  if(g.status==="ready"||g.status==="gameover"||g.status==="won") return;
  if(!g.transform) visuals(g);
  if(g.status==="clear") {
    if(++g.clearTicks>=90) nextLevel(g);
    return;
  }
  if(g.status==="dying") {
    g.deathTicks++;
    if(g.deathTicks===30) g.player.vy=-4;
    if(g.deathTicks>=30) { g.player.y+=g.player.vy; g.player.vy+=0.15625; }
    if(g.deathTicks>=120) respawn(g);
    return;
  }
  if(g.status==="flag") { updateFinish(g); return; }
  if(g.transition) { updateTransition(g); return; }
  const transforming=!!g.transform;
  if(transforming&&!updateTransform(g)) return;
  if(!transforming) { g.activeTicks++; advanceTimers(g); updatePlatforms(g); }
  if(g.status!=="playing") return;
  const p=g.player;
  p.swimming=g.world.physics==="water";
  resizePlayer(g,input.down&&!p.swimming);
  if(!transforming&&tryExit(g,input)) return;
  const oldFeet=p.y+p.h;
  if(!transforming&&updateSpring(g,jumpEdge)) {
    updateCamera(g);
  } else if(!transforming&&updateVines(g,input,jumpEdge)) {
    if(tryExit(g,input)) return;
    updateCamera(g);
  } else if(p.swimming) {
    moveWater(g,input,jumpEdge||upEdge);
  } else {
    if(jumpEdge&&p.grounded) beginJump(g);
    horizontal(g,input);
    p.grounded=false;
    moveY(g,p,p.vy||0.001,true);
    if(!p.grounded) {
      if((!input.jump&&p.jumpOrigin-p.y>=1)||p.vy>=0) p.jumpReleased=true;
      p.vy=Math.min(p.vy+(p.jumpReleased?p.jumpFallGravity:p.jumpHeldGravity),4);
    }
    // Falling edge exits (cloud returns) must resolve before the death boundary.
    if(p.y>VIEW_HEIGHT&&tryExit(g,input)) return;
  }
  if(p.y>VIEW_HEIGHT+16) { die(g); return; }
  if(transforming) return;
  updateCamera(g);
  if(updateLoops(g)) return;
  const goal=g.world.goal;
  if(goal&&overlap(p,goal)) {
    if(goal.kind==="flag") startFlag(g);
    else if(goal.kind==="axe"||goal.kind==="ending") startCastle(g);
    else if(goal.kind==="exit"&&goal.target) enterArea(g,goal.target);
    return;
  }
  updateFrenzyCommands(g);
  spawnEnemies(g); updateEnemies(g,oldFeet);
  if(g.status!=="playing"||g.transform) return;
  updateHazards(g);
  if(g.status!=="playing"||g.transform) return;
  updateFrenzy(g);
  updateProjectiles(g,{moveY,hurt,overlap});
  if(g.status!=="playing"||g.transform) return;
  updateItems(g);
  if(g.transform) return;
  if(runEdge) fire(g);
  updateFireballs(g);
  g.timerTicks++;
  if(g.timerTicks>=24) {
    g.timerTicks=0; g.time=Math.max(0,g.time-1);
    if(g.time===100&&!g.hurry) { g.hurry=true; event(g,"hurry"); }
    if(g.time===0) die(g);
  }
}
