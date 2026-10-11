// Actor movement uses visual pixels; constants follow smb1 prg.asm movement routines.
const sign = n => n < 0 ? -1 : 1;
export const enemyPoints = e => ({goomba:100,hammerbro:1000,lakitu:200,blooper:200,bowser:5000}[e.type] ?? 200);
export const walker = e => ["goomba","koopa","beetle","spiny","shell","hammerbro"].includes(e.type);
export const canStomp = (e,water) => !["spiny","piranha","bowser","podoboo"].includes(e.type) && !(water && ["blooper","cheepcheep"].includes(e.type));
export const fireImmune = e => ["beetle","bulletbill","podoboo"].includes(e.type) || e.shellType==="beetle";
export const starImmune = e => e.type==="podoboo";
export const enemyBounds = e => e.type==="lakitu"?{x:e.x+2,y:e.y+9,w:12,h:12}:e;
export const shellImmune = e => ["podoboo","bowser"].includes(e.type);

export function random(g) {
  g.seed = (Math.imul(g.seed,1664525)+1013904223)>>>0;
  return g.seed>>>24;
}

export function createEnemy(s,x=s.x) {
  const h = s.type==="bowser"?32:["koopa","hammerbro","piranha","blooper","lakitu"].includes(s.type)?24:16;
  return {...s,x,y:s.y,w:s.type==="bowser"?32:16,h:s.h??h,
    vx:s.vx??-0.5,vy:0,alive:true,grounded:false,revive:0,kickGrace:0,combo:0,
    originX:x,originY:s.y,age:0,winged:s.winged??(/paratroopa/i.test(s.variant??"")),
    motion:s.motion??({greenParatroopaJump:"bounce",greenParatroopaFly:"horizontal",redParatroopa:"vertical"}[s.variant]),
    hp:s.type==="bowser"?5:undefined};
}

function projectile(g,e,type,vx,vy) {
  const w=type==="flame"?24:16,h=type==="flame"?8:16;
  g.projectiles.push({type,x:e.x,y:e.y+8,w,h,vx,vy,angle:0,alive:true});
}

// Return true when this family already performed its movement.
export function moveActor(g,e,{moveX,moveY,solid,fallSpeed}) {
  const p=g.player, hard=g.level.secondaryHard;
  e.age=(e.age||0)+1; e.originX??=e.x; e.originY??=e.y;
  e.facing=sign(p.x-e.x);
  if(e.type==="piranha") {
    e.phase??="rest"; e.rest??=64;
    if(e.phase==="rest") {
      if(e.rest>0) e.rest--;
      else if(Math.abs(p.x+p.w/2-e.x-e.w/2)>=33) e.phase="rise";
    } else if(e.phase==="rise") {
      if(g.frame%2===0) e.y=Math.max(e.range?.min??e.originY-24,e.y-1);
      if(e.y<=e.originY-24) { e.phase="top"; e.rest=64; }
    } else if(e.phase==="top") {
      if(--e.rest<=0) e.phase="sink";
    } else {
      if(g.frame%2===0) e.y=Math.min(e.range?.max??e.originY,e.y+1);
      if(e.y>=e.originY) { e.phase="rest"; e.rest=64; }
    }
    e.vx=0; e.vy=0; return true;
  }
  if(e.type==="bulletbill") {
    e.vx=e.vx===0||Math.abs(e.vx)===0.5?-1.5:e.vx;
    e.x+=e.vx; e.facing=sign(e.vx); return true;
  }
  if(e.type==="podoboo") {
    e.rest??=32;
    if(e.rest>0) { e.rest--; return true; }
    if(!e.phase||e.phase==="rest") { e.vy=-7; e.phase="jump"; }
    e.y+=e.vy; e.vy+=28/256;
    if(e.y>=e.originY&&e.vy>0) { e.y=e.originY; e.phase="rest"; e.rest=(random(g)&15|6)*21; }
    return true;
  }
  if(e.type==="cheepcheep") {
    if(e.motion==="flying"||e.variant==="flying") {
      if(e.age===1&&e.vy===0) e.vy=-5;
      e.x+=e.vx; e.y+=e.vy; e.vy+=5/256;
    } else {
      e.vx=["red","redCheep"].includes(e.variant)?-0.5:-0.25; e.x+=e.vx;
      e.vy??=-0.125; if(!e.vy) e.vy=-0.125;
      e.y+=e.vy;
      if(Math.abs(e.y-e.originY)>=15) e.vy=-e.vy;
    }
    e.facing=sign(e.vx); return true;
  }
  if(e.type==="blooper") {
    e.phase??="accelerate"; e.swimSpeed??=0;
    if(e.phase==="float") {
      e.rest=(e.rest??42)-1;
      if(g.frame%2===0) e.y+=1;
      if(e.rest<=0&&e.y+16>=p.y) e.phase="accelerate";
    } else {
      if(g.frame%8===0) {
        e.swimSpeed+=e.phase==="accelerate"?1:-1;
        if(e.swimSpeed>=2) e.phase="slow";
        else if(e.swimSpeed<=0) { e.phase="float"; e.rest=42; }
      }
      e.y=Math.max(40,e.y-e.swimSpeed);
      e.x+=e.facing*e.swimSpeed;
    }
    return true;
  }
  if(e.type==="lakitu") {
    if(e.retiring) {
      e.vx=-1; e.x+=e.vx; e.facing=-1;
      if(e.x+e.w<g.cameraX-32) e.alive=false;
      return true;
    }
    e.lakituDirection??=-1; e.lakituSpeed??=0;
    const distance=Math.abs(p.x-e.x), toward=p.x>=e.x?1:-1;
    let braking=false;
    if(distance>=60 && e.lakituDirection!==toward) {
      if(e.lakituDirection>0 && e.lakituSpeed>1/16) {
        e.lakituSpeed-=1/16; braking=true;
      } else e.lakituDirection=toward;
    }
    // At fixed Lakitu altitude, source Enemy_Y_Speed=0 selects the $15 speed table entry.
    if(!braking) e.lakituSpeed=(20-Math.floor(Math.min(60,distance)/4))/16;
    e.vx=e.lakituDirection*e.lakituSpeed; e.facing=e.lakituDirection;
    e.x+=e.vx; e.y=e.originY;
    return true;
  }
  if(e.type==="hammerbro") {
    e.walkingTimer??=hard?80:128;
    e.vx=e.walkingTimer===0&&p.x<=e.x?-0.5:(g.frame&64?-0.25:0.25);
    e.throwTimer??=hard?28:48; e.jumpTimer??=192;
    if(--e.throwTimer<=0) { projectile(g,e,"hammer",e.facing,-2); e.throwTimer=hard?28:48; }
    if(--e.jumpTimer<=0&&(e.grounded||e.y+e.h>=208)) {
      e.vy=e.y>=128?-6:-3; e.grounded=false; e.jumpTimer=192+(random(g)&63); e.jumpPassTicks=32;
    }
    moveX(g,e,e.vx); e.grounded=false;
    if(e.jumpPassTicks>0) { e.jumpPassTicks--; e.y+=e.vy; }
    else moveY(g,e,e.vy);
    e.vy=e.grounded?0:fallSpeed(e.vy,61/256); return true;
  }
  if(e.type==="bowser") {
    e.hp??=5; e.fireTimer??=223; e.throwTimer??=48; e.jumpTimer??=128;
    e.vx=(Math.floor(e.age/64)%2?1:-1)*0.25;
    if(Math.abs(e.x-e.originX)>32) e.vx=sign(e.originX-e.x)*0.25;
    moveX(g,e,e.vx);
    if(--e.jumpTimer<=0&&(e.grounded||e.y+e.h>=208)) { e.vy=-2; e.jumpTimer=96+(random(g)&63); }
    e.grounded=false; moveY(g,e,e.vy); e.vy=e.grounded?0:Math.min(2,e.vy+15/256);
    if(g.level.worldNumber>=6&&--e.throwTimer<=0) {
      projectile(g,e,"hammer",e.facing,-2); e.throwTimer=hard?28:48;
    }
    return true;
  }
  if(e.type==="koopa"&&e.winged) {
    if(e.motion==="vertical") {
      e.centerY??=e.originY+(e.originY-8<128?48:-32);
      if(!e.vy&&e.y<e.originY) { if(g.frame%8===0) e.y++; }
      else { e.vy=Math.max(-2,Math.min(2,e.vy+(e.y<e.centerY?3/256:-6/256))); e.y+=e.vy; }
      return true;
    }
    if(e.motion==="horizontal") {
      e.counter??=0; e.counterPhase??=0;
      if(g.frame%4===0) {
        if(e.counterPhase%2===0) { if(e.counter===19) e.counterPhase++; else e.counter++; }
        else if(e.counter===0) e.counterPhase++; else e.counter--;
      }
      e.vx=(e.counterPhase&2?1:-1)*e.counter/16; e.x+=e.vx;
      if(g.frame%4===0) e.y+=g.frame&64?1:-1;
      return true;
    }
    if(moveX(g,e,e.vx)) e.vx=-e.vx;
    e.grounded=false; moveY(g,e,e.vy);
    e.vy=e.grounded?-3:fallSpeed(e.vy,28/256); return true;
  }
  if(e.type==="koopa"&&["red","redKoopa"].includes(e.variant)&&e.grounded) {
    const front=e.vx<0?e.x-1:e.x+e.w+1,feet=e.y+e.h;
    if(!g.world.tiles.some(t=>solid(t)&&t.x<=front&&t.x+t.w>front&&Math.abs(t.y-feet)<3)) e.vx=-e.vx;
  }
  return false;
}

export function updateProjectiles(g,{moveY,hurt,overlap}) {
  for(const b of g.projectiles) {
    if(b.alive===false) continue;
    b.x+=b.vx; b.angle=(b.angle||0)+0.2;
    if(b.type==="spiny-egg") {
      b.grounded=false; moveY(g,b,b.vy);
      if(b.grounded) {
        g.enemies.push(createEnemy({type:"spiny",x:b.x,y:b.y,vx:sign(g.player.x-b.x)*0.5}));
        b.alive=false;
      } else b.vy=Math.min(3,b.vy+61/256);
    } else {
      b.y+=b.vy;
      if(b.type==="hammer") b.vy=Math.min(4,b.vy+16/256);
      else if(b.type==="flame"&&b.targetY!=null) b.y+=Math.max(-0.25,Math.min(0.25,b.targetY-b.y));
    }
    if(b.alive!==false&&overlap(g.player,b)) hurt(g);
    if(b.y>272||b.x<g.cameraX-64||b.x>g.cameraX+384) b.alive=false;
  }
  g.projectiles=g.projectiles.filter(b=>b.alive!==false);
}
