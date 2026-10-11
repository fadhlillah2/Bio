// Run: bun scripts/mario-campaign-selftest.ts — labelled fixtures are not a full-play proof.
import assert from "node:assert/strict";
import {createEnemy,moveActor} from "../src/lib/mario/enemies.js";
import {createWorld} from "../src/lib/mario/world.js";
import {getLevel} from "../src/lib/mario/levels.js";
import { createGame, startGame, restartGame, stepGame } from "../src/lib/mario/engine.js";
const idle = {left:false,right:false,down:false,up:false,jump:false,run:false};
const ids = Array.from({length:32},(_,i)=>`${Math.floor(i/4)+1}-${i%4+1}`);
let passed=0, failed=0;
function test(name:string, fn:()=>void) {
  try { fn(); passed++; console.log("OK "+name); }
  catch(error) { failed++; console.error("FAIL "+name,error); }
}
function tick(g:any,n=1,input:Partial<typeof idle>={}) {
  for(let i=0;i<n;i++) stepGame(g,{...idle,...input});
}
function fresh(id="1-1") { const g=createGame(id); startGame(g); return g; }
function arena(id="1-1") {
  const g:any=fresh(id);
  g.transition=null; g.world.tiles=[{id:"floor",kind:"ground",x:0,y:208,w:4096,h:32}];
  Object.assign(g.world,{spawns:[],platforms:[],hazards:[],loops:[],exits:[],frenzyCommands:[],goal:null,width:4096,physics:"land",cameraLock:null});
  g.enemies=[]; g.items=[]; g.projectiles??=[]; g.vines??=[];
  Object.assign(g.player,{x:40,y:192,w:12,h:16,vx:0,vy:0,grounded:true});
  return g;
}
function enemy(g:any,type:string,extra:any={}) {
  const e={type,x:128,y:192,w:16,h:16,vx:0,vy:0,alive:true,...extra};
  g.enemies.push(e); return e;
}
function stomp(g:any,e:any) { Object.assign(g.player,{x:e.x+2,y:e.y-19,vy:4,grounded:false}); tick(g); }
function shot(g:any,e:any) {
  g.fireballs.push({type:"fireball",x:e.x-4,y:e.y+(e.type==="lakitu"?9:0),w:8,h:8,vx:4,vy:0,life:100,alive:true}); tick(g);
}
function finish(g:any,kind="flag") {
  g.world.goal={kind,x:160,y:32,w:16,h:160,castleX:208,floorY:208,npcX:240,bridgeIds:[]};
  Object.assign(g.player,{x:158,y:120,vy:1,vx:0,grounded:false}); g.time=0; tick(g);
  for(let i=0;i<1500&&!["clear","won"].includes(g.status);i++) tick(g);
}
test("manifest IDs, canonical starts, intro areas, invalid IDs",()=>{
  for(const id of ids) {
    const g:any=createGame(id); assert.equal(g.levelId,id); assert.equal(g.area,g.world.theme);
    assert.equal(g.status,"ready"); assert.equal(g.areaId,g.world.areaId);
    if(["1-2","2-2","4-2","7-2"].includes(id)) assert.equal(g.areaId,"29");
  }
  assert.throws(()=>createGame("9-1"),RangeError);
});
test("fixture clear/levelclear, 90 frozen ticks, stats and frame survive next level",()=>{
  const g=arena(); Object.assign(g,{score:123,coins:7,lives:5}); g.player.power="fire";
  finish(g); assert.equal(g.status,"clear"); assert.ok(g.events.some((e:any)=>e.type==="levelclear"));
  const score=g.score, frame=g.frame, x=g.player.x;
  tick(g,89,{right:true,jump:true}); assert.equal(g.status,"clear"); assert.equal(g.player.x,x);
  tick(g,1,{right:true,jump:true});
  assert.equal(g.levelId,"1-2"); assert.equal(g.status,"playing"); assert.equal(g.frame,frame+90);
  assert.deepEqual([g.score,g.coins,g.lives,g.player.power],[score,7,5,"fire"]);
  assert.equal(g.previousJump,true); assert.equal(g.projectiles.length,0); assert.equal(g.fireballs.length,0);
});
test("fixture all 31 stage clears are sequential; final scenic ending and restart",()=>{
  const g=arena(); const seen=[g.levelId]; let frame=g.frame;
  for(let i=0;i<32;i++) {
    Object.assign(g.world,{tiles:[{id:"floor",kind:"ground",x:0,y:208,w:4096,h:32}],spawns:[],hazards:[],platforms:[],loops:[],exits:[],width:4096});
    g.enemies=[]; g.transition=null; g.cameraX=0;
    finish(g,i%4===3?(i===31?"ending":"axe"):"flag");
    assert.ok(g.frame>frame); frame=g.frame;
    if(i<31) {
      assert.equal(g.status,"clear"); tick(g,90); assert.equal(g.levelId,ids[i+1]); seen.push(g.levelId);
    } else {
      assert.equal(g.status,"won"); assert.equal(g.finish.kind,"ending");
      assert.equal(g.finish.phase,"ending"); assert.ok(g.events.some((e:any)=>e.type==="win"));
    }
  }
  assert.deepEqual(seen,ids); restartGame(g);
  assert.deepEqual([g.levelId,g.status,g.score,g.coins,g.lives],["1-1","playing",0,0,3]);
});
test("fixture death stays in current level, clears temporary objects and loses power",()=>{
  const g=arena("3-1"); g.player.power="fire"; g.projectiles.push({type:"hammer",x:0,y:0});
  g.player.y=280; tick(g); assert.equal(g.status,"dying"); tick(g,120);
  assert.equal(g.levelId,"3-1"); assert.equal(g.player.power,"small"); assert.equal(g.lives,2);
  assert.equal(g.projectiles.length,0); assert.equal(g.area,g.world.theme);
});
test("fixture water strokes, top bound, slower cap, and land cannot double jump",()=>{
  const g=arena(); g.world.physics="water"; g.world.theme="underwater"; g.world.tiles=[];
  Object.assign(g.player,{y:100,grounded:false});
  tick(g,1,{jump:true,right:true,run:true}); assert.equal(g.player.swimming,true); assert.ok(g.player.vy<0);
  tick(g,60,{up:true,right:true,run:true,jump:true});
  assert.ok(g.player.y>=32); assert.ok(g.player.vx<=1.5); assert.ok(g.player.vy>=0);
  g.world.physics="land"; g.player.y=100; g.player.vy=1; tick(g); tick(g,1,{jump:true});
  assert.equal(g.player.swimming,false); assert.ok(g.player.vy>0);
});
test("fixture one-way horizontal platform carries without wall embedding",()=>{
  const g=arena(); g.world.tiles=[];
  const p={id:"ride",x:32,y:160,w:64,h:8,motion:"horizontal",range:[32,96],speed:1};
  g.world.platforms=[p]; Object.assign(g.player,{x:48,y:144,grounded:true});
  tick(g,10); assert.equal(g.player.y+p.h,152); assert.ok(g.player.x>48);
  assert.equal(g.player.y+g.player.h,p.y);
  g.world.tiles=[{id:"wall",kind:"stone",x:80,y:100,w:16,h:108}];
  tick(g,30); assert.ok(g.player.x+g.player.w<=80||g.player.x>=96);
});
test("fixture rising platform crushes against ceiling, jump from below passes through",()=>{
  const g=arena(); g.world.tiles=[{id:"roof",kind:"stone",x:0,y:80,w:256,h:16}];
  g.world.platforms=[{id:"rise",x:32,y:120,w:64,h:8,motion:"lift",range:[0,256],speed:-0.9375}];
  Object.assign(g.player,{x:48,y:104,grounded:true}); tick(g,30); assert.equal(g.status,"dying");
  const h=arena(); h.world.tiles=[];
  h.world.platforms=[{id:"oneway",x:32,y:140,w:64,h:8,motion:"horizontal",range:[32,32],speed:0}];
  Object.assign(h.player,{x:48,y:150,vy:-4,grounded:false}); tick(h,8,{jump:true});
  assert.ok(h.player.y<140);
});
test("fixture falling and paired balance platforms respond to rider",()=>{
  const g=arena(); g.world.tiles=[];
  g.world.platforms=[{id:"fall",x:32,y:160,w:64,h:8,motion:"fall",range:[160,272],speed:0}];
  Object.assign(g.player,{x:48,y:144}); tick(g,15); assert.ok(g.world.platforms[0].y>160);
});
test("fixture vine block grows, up attaches and jump detaches",()=>{
  const g=arena();
  g.world.tiles.push({id:"vine-block",x:160,y:144,w:16,h:16,kind:"brick",content:"vine",exitId:"cloud",bump:0});
  Object.assign(g.player,{x:162,y:161,vy:-4,grounded:false}); tick(g);
  assert.equal(g.vines.length,1); tick(g,80); const v=g.vines[0]; assert.ok(v.h>16);
  Object.assign(g.player,{x:v.x,y:v.y+20,vy:0,grounded:false}); tick(g,1,{up:true});
  assert.equal(g.player.climbing,true); const y=g.player.y; tick(g,4,{up:true}); assert.ok(g.player.y<y);
  tick(g,1,{jump:true,right:true}); assert.equal(g.player.climbing,false); assert.ok(g.player.vy<0);
});
test("fixture spring compresses then launches; late jump increases launch",()=>{
  function bounce(boost:boolean) {
    const g=arena(); g.world.tiles.push({id:"spring",kind:"spring",x:96,y:176,w:16,h:32});
    Object.assign(g.player,{x:98,y:157,vy:4,grounded:false}); tick(g);
    let min=0;
    for(let i=0;i<25;i++) { tick(g,1,{jump:boost&&i>=8}); min=Math.min(min,g.player.vy); }
    return min;
  }
  assert.ok(bounce(false)<=-7); assert.ok(bounce(true)<=-12);
});
test("fixture paratroopa loses wings before becoming shell; red koopa turns at ledge",()=>{
  const g=arena(); const e=enemy(g,"koopa",{variant:"paratroopa",motion:"bounce",winged:true});
  stomp(g,e); assert.equal(e.type,"koopa"); assert.equal(e.winged,false); assert.notEqual(e.motion,"bounce");
  stomp(g,e); assert.equal(e.type,"shell");
  const h=arena(); h.world.tiles=[{id:"ledge",kind:"ground",x:0,y:208,w:144,h:32}];
  const red=enemy(h,"koopa",{variant:"red",vx:0.5,grounded:true}); tick(h,6); assert.ok(red.vx<0);
});
test("fixture beetle shell retains fire immunity and revival identity",()=>{
  const g=arena(); const e=enemy(g,"beetle"); shot(g,e); assert.equal(e.alive,true);
  stomp(g,e); assert.equal(e.type,"shell"); shot(g,e); assert.equal(e.alive,true);
  e.vx=0; e.revive=1; g.intervalTimer=0; g.player.x=40; tick(g); assert.equal(e.type,"beetle");
});
test("fixture spiny, piranha, Bowser and Podoboo cannot be stomped",()=>{
  for(const type of ["spiny","piranha","bowser","podoboo"]) {
    const g=arena(); const e=enemy(g,type,{phase:"rest",rest:999,hp:5}); stomp(g,e);
    assert.equal(e.alive,true,type); assert.equal(g.status,"dying",type);
  }
});
test("fixture fire vulnerabilities differ for bullet, fire, plants and fish",()=>{
  for(const [type,immune] of [["bulletbill",true],["podoboo",true],["piranha",false],["spiny",false],["blooper",false],["cheepcheep",false]] as const) {
    const g=arena(); const e=enemy(g,type,{phase:"rest",rest:999}); shot(g,e); assert.equal(e.alive,immune,type);
  }
});
test("fixture piranha waits while Mario is close then rises",()=>{
  const g=arena(); const e=enemy(g,"piranha",{x:112,y:184,originY:184,phase:"rest",rest:0});
  g.player.x=96; tick(g,80); assert.equal(e.y,184);
  g.player.x=40; tick(g,50); assert.ok(e.y<184);
});
test("fixture Hammer Bro throws rotating hostile hammer and jumps",()=>{
  const g=arena(); const e=enemy(g,"hammerbro",{x:180,throwTimer:0,jumpTimer:0});
  tick(g); assert.ok(g.projectiles.some((p:any)=>p.type==="hammer")); assert.ok(e.vy<0);
  const hammer=g.projectiles[0], angle=hammer.angle; tick(g); assert.notEqual(hammer.angle,angle);
  assert.equal(g.fireballs.length,0);
});
test("fixture Lakitu drops egg, egg lands as Spiny",()=>{
  const g=arena(); enemy(g,"lakitu",{x:170,y:64,throwTimer:0});
  tick(g); assert.ok(g.projectiles.some((p:any)=>p.type==="spiny-egg"));
  tick(g,120); assert.ok(g.enemies.some((e:any)=>e.type==="spiny"));
});
test("fixture swimming/flying fish, Blooper, Bullet and Podoboo have distinct motion",()=>{
  const g=arena(); g.world.physics="water";
  const fish=enemy(g,"cheepcheep",{x:200,y:100,variant:"red",motion:"swim"});
  const blooper=enemy(g,"blooper",{x:220,y:130}); tick(g,24);
  assert.ok(fish.x<200); assert.ok(Math.abs(fish.y-100)<=16); assert.ok(blooper.y<130);
  const h=arena(); const bill=enemy(h,"bulletbill",{x:200,y:100,vx:-1.5}); tick(h,8);
  assert.equal(bill.y,100); assert.ok(bill.x<200);
  const lava=enemy(h,"podoboo",{x:220,y:240,originY:240,rest:0}); tick(h,8); assert.ok(lava.y<220);
});
test("fixture cannons, fish and bullet zones produce their actor families",()=>{
  for(const [type,family] of [["cannon","bulletbill"],["fish-spawner","cheepcheep"],["bullet-spawner","bulletbill"]]) {
    const g=arena();
    if(type==="cannon") g.world.hazards=[{id:type,type,x:176,y:160,w:32,h:48,timer:0,interval:60}];
    else { g.world.frenzyCommands=[{id:type,sourceX:384,activationX:0,action:"start",type,variant:"normal"}]; g.frenzy.timer=0; }
    tick(g,2); assert.ok(g.enemies.some((e:any)=>e.type===family),type);
  }
});
test("fixture firebar exact rendered ball centers collide and lava kills through star",()=>{
  const g=arena(); g.world.hazards=[{id:"bar",type:"firebar",x:80,y:180,w:8,h:8,length:6,spacing:8,angle:0,speed:0}];
  Object.assign(g.player,{x:112,y:176,vy:0,grounded:false}); tick(g); assert.equal(g.status,"dying");
  const h=arena(); h.player.invincible=35; h.world.hazards=[{id:"lava",type:"lava",x:0,y:204,w:128,h:32}];
  tick(h); assert.equal(h.status,"dying");
});
test("fixture Bowser takes five fire hits, awards 5000 only at defeat",()=>{
  const g=arena(); const b=enemy(g,"bowser",{x:180,y:176,h:32,w:32,hp:5,fireTimer:999,jumpTimer:999});
  for(let i=0;i<5;i++) {
    shot(g,b); assert.equal(b.hp,4-i); assert.equal(b.alive,i<4);
    assert.equal(g.score,i<4?0:5000);
  }
});
test("fixture Bowser world-dependent fire and hammers",()=>{
  for(const [id,flame,hammer] of [["1-4",true,false],["6-4",false,true],["8-4",true,true]] as const) {
    const g=arena(id); enemy(g,"bowser",{x:180,y:176,w:32,h:32,hp:5,fireTimer:0,throwTimer:0,jumpTimer:999});
    tick(g); assert.equal(g.projectiles.some((p:any)=>p.type==="flame"),flame);
    assert.equal(g.projectiles.some((p:any)=>p.type==="hammer"),hammer);
  }
});
test("fixture axe removes only named bridge, then NPC message before clear",()=>{
  const g=arena("1-4");
  g.world.tiles.push({id:"bridge",kind:"bridge",x:160,y:176,w:64,h:8});
  g.world.goal={kind:"axe",x:224,y:128,w:16,h:64,floorY:208,npcX:300,bridgeIds:["bridge"]};
  Object.assign(g.player,{x:220,y:160,vy:0,grounded:false}); tick(g);
  assert.equal(g.finish.phase,"bridge"); tick(g,100);
  assert.ok(!g.world.tiles.some((t:any)=>t.id==="bridge")); assert.ok(g.world.tiles.some((t:any)=>t.id==="floor"));
  for(let i=0;i<600&&g.status!=="clear";i++) tick(g);
  assert.equal(g.status,"clear"); assert.equal(g.finish.kind,"castle");
});
test("fixture same-level bonus returns cached blocks; warp clears caches and preserves stats",()=>{
  const g=arena();
  const original=g.world,block={id:"used-fixture",kind:"used",x:400,y:144,w:16,h:16};
  original.tiles.push(block); g.score=4321; g.coins=9; g.player.power="big";
  original.exits=[{id:"bonus-fixture",x:32,y:192,w:32,h:48,trigger:"edge",direction:"right",
    target:{levelId:"1-1",areaId:"42",entryId:"page-0-drop"}}];
  tick(g); assert.equal(g.areaId,"42");
  tick(g,180); const frame=g.frame;
  g.world.exits=[{id:"return-fixture",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",
    target:{levelId:"1-1",areaId:"25",entryId:"start"}}];
  tick(g); assert.equal(g.world,original); assert.ok(g.world.tiles.includes(block));
  assert.ok(g.frame>frame); assert.equal(g.player.power,"big");
  original.exits=[{id:"warp-fixture",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",
    target:{levelId:"4-1",areaId:"main",entryId:"start"}}];
  tick(g); assert.equal(g.levelId,"4-1"); assert.equal(g.areaCache.size,0);
  assert.deepEqual([g.score,g.coins,g.player.power],[4321,9,"big"]);
  g.player.y=280; tick(g); tick(g,120); assert.equal(g.levelId,"4-1"); assert.equal(g.lives,2);
});
test("fixture maze rejects wrong lane and grounded requirement, uses its explicit checkpoint",()=>{
  for(const grounded of [true,false]) {
    const g=arena("4-4");
    g.world.loops=[{id:"gate",x:64,requiredFeetY:grounded?96:208,requiresGrounded:true,
      group:0,sequence:0,groupLength:1,resetCheckpoint:{x:32,feetY:208,cameraX:0}}];
    Object.assign(g.player,{x:63,y:grounded?192:160,vx:2.5,vy:grounded?0:-2,grounded});
    tick(g,1,{right:true,run:true});
    assert.ok(g.player.x<48); assert.equal(g.enemies.length,0);
  }
});
test("fixture maze accepts correct lane for every player height",()=>{
  for(const height of [16,32]) {
    const g=arena("4-4");
    g.world.loops=[{id:"gate",x:64,requiredFeetY:208,requiresGrounded:true,
      group:0,sequence:0,groupLength:1,resetCheckpoint:{x:32,feetY:208,cameraX:0}}];
    Object.assign(g.player,{x:63,y:208-height,h:height,power:height===16?"small":"big",vx:2.5});
    tick(g,1,{right:true,run:true}); assert.ok(g.player.x>=64); assert.equal(g.world.loops[0].checked,true);
  }
});
test("fixture three-gate maze remembers early wrong choice until final gate",()=>{
  const g=arena("7-4");
  g.world.loops=[64,80,96].map((x,i)=>({id:"gate-"+i,x,requiredFeetY:i===0?96:208,requiresGrounded:true,
    group:0,sequence:i,groupLength:3,resetCheckpoint:{x:32,feetY:208,cameraX:0}}));
  Object.assign(g.player,{x:63,vx:2.5}); tick(g,1,{right:true,run:true}); assert.ok(g.player.x>=64);
  for(let i=0;i<20&&g.player.x>=64;i++) tick(g,1,{right:true,run:true});
  assert.ok(g.player.x<64);
});
test("fixture active-area projectile state and audio events never leak across clear/death",()=>{
  const g=arena(); finish(g);
  assert.equal(g.events.filter((e:any)=>e.type==="levelclear").length,1);
  tick(g); assert.equal(g.events.length,0); tick(g,89); assert.equal(g.projectiles.length,0);
  assert.equal(g.events.some((e:any)=>e.type==="win"),false);
  g.transition=null; g.player.y=280; tick(g);
  assert.equal(g.events.filter((e:any)=>e.type==="death").length,1); tick(g); assert.equal(g.events.length,0);
});
test("fixture vine gate requires top crossing, then automatic climb finishes without held up",()=>{
  const g=arena("2-1");
  g.world.exits=[{id:"vine-gate",trigger:"vine",direction:"up",x:160,y:-32,w:16,h:36,
    triggerFeetY:4,autoClimbFeetY:64,target:{levelId:"2-1",areaId:"main",entryId:"start"}}];
  const vine={x:164,y:48,w:8,h:96,baseY:144,growing:false,exitId:"vine-gate"}; g.vines=[vine];
  Object.assign(g.player,{x:162,y:100,grounded:false}); tick(g,1,{up:true});
  assert.equal(g.player.climbing,true); assert.equal(g.areaCache.size,0);
  tick(g,40,{up:true}); tick(g,60);
  assert.equal(g.player.climbing,false); assert.equal(g.player.x,40);
});
test("fixture up key gives water stroke with edge latch",()=>{
  const g=arena(); g.world.physics="water";
  Object.assign(g.player,{y:100,grounded:false}); tick(g,1,{up:true});
  assert.ok(g.player.vy<0); tick(g,50,{up:true}); assert.ok(g.player.vy>0);
  tick(g); tick(g,1,{up:true}); assert.ok(g.player.vy<0);
});
test("fixture restart and next level reset camera, spring, maze and climb state",()=>{
  const g=arena(); g.cameraRegion={min:1024,max:1024}; g.spring={tile:{},ticks:1}; g.loopState={0:{count:1,correct:0}};
  restartGame(g); assert.equal(g.spring,null); assert.deepEqual(g.loopState,{});
  assert.ok(!g.cameraRegion||g.cameraRegion.min===0); tick(g); assert.equal(g.cameraX,0);
  g.cameraRegion={min:1024,max:1024}; g.loopState={0:{count:1,correct:0}}; g.spring={tile:{},ticks:1};
  g.status="clear"; g.clearTicks=89; tick(g);
  assert.equal(g.spring,null); assert.deepEqual(g.loopState,{});
  assert.ok(!g.cameraRegion||g.cameraRegion.min===0);
});
test("fixture factory actor variants and motion records stay finite over simulation",()=>{
  for(const id of ids) {
    const g:any=fresh(id); g.transition=null; g.world.goal=null; g.world.loops=[]; g.world.exits=[];
    g.player.x=100; g.player.y=40; g.player.invincible=10000;
    for(const spawn of g.world.spawns) spawn.x=Math.min(spawn.x,240);
    for(const platform of g.world.platforms) platform.triggerX=0;
    for(let i=0;i<120&&g.status==="playing";i++) {
      tick(g);
      for(const entity of [...g.enemies,...g.projectiles,...g.world.platforms]) {
        assert.ok(Number.isFinite(entity.x)&&Number.isFinite(entity.y),id+" "+JSON.stringify(entity));
      }
    }
  }
});
test("fixture rising platform catches airborne feet using its swept position",()=>{
  const g=arena(); g.world.tiles=[];
  g.world.platforms=[{id:"catch",x:32,y:162,w:64,h:8,motion:"lift",range:{min:0,max:256},speed:-3}];
  Object.assign(g.player,{x:48,y:145,vy:0,grounded:false}); tick(g);
  assert.equal(g.player.grounded,true); assert.equal(g.player.y+g.player.h,g.world.platforms[0].y);
});
test("fixture balance pair opposes rider displacement and cloud ride waits for contact",()=>{
  const g=arena(); g.world.tiles=[];
  const a={id:"a",x:32,y:160,w:64,h:8,motion:"balance",pairId:"b",range:{min:45,max:256},speed:0,acceleration:5/256,upAcceleration:10/256};
  const b={...a,id:"b",x:160,pairId:"a"}; g.world.platforms=[a,b];
  Object.assign(g.player,{x:48,y:144}); tick(g,10);
  assert.ok(a.y>160); assert.ok(b.y<160); assert.equal(a.y+b.y,320); assert.equal(g.player.y+16,a.y);
  const h=arena(); h.world.tiles=[];
  const cloud={id:"cloud",x:160,y:160,w:64,h:8,motion:"horizontal",variant:"cloudRiderPlatform",range:{min:0,max:500},speed:1};
  h.world.platforms=[cloud]; tick(h,4); assert.equal(cloud.x,160);
  Object.assign(h.player,{x:176,y:144,grounded:true,vy:0}); tick(h,4); assert.equal(cloud.x,164);
  tick(h,1,{jump:true}); const x=cloud.x; tick(h,4,{jump:true}); assert.equal(cloud.x,x+4);
});
test("fixture explicit maze checkpoint avoids solids and preserves completed groups and stats",()=>{
  const checkpoints:any={
    "4-4":[{x:208,feetY:160,cameraX:96},{x:1280,feetY:208,cameraX:1168}],
    "7-4":[{x:512,feetY:208,cameraX:400},{x:1536,feetY:208,cameraX:1424}],
    "8-4":[{x:312,feetY:176,cameraX:256},{x:1848,feetY:176,cameraX:1792},{x:3128,feetY:176,cameraX:3072}]
  };
  for(const id of Object.keys(checkpoints)) for(const [group,checkpoint] of checkpoints[id].entries()) for(const height of [16,32]) {
    const g:any=fresh(id); g.transition=null; g.time=123; g.score=9876; g.coins=12; g.lives=4;
    const gate=g.world.loops.find((l:any)=>l.group===group&&l.sequence===l.groupLength-1);
    assert.deepEqual(gate.resetCheckpoint,checkpoint);
    for(const loop of g.world.loops) if(loop.group<group||loop.group===group&&loop.sequence<gate.sequence)loop.checked=true;
    g.loopState[group]={count:gate.groupLength-1,correct:0};
    const surface=g.world.tiles.filter((t:any)=>!t.hidden&&t.kind!=="castle"&&t.kind!=="flagpole"&&t.y>=80&&t.x<=gate.x+4&&t.x+t.w>gate.x+4)
      .map((t:any)=>t.y).find((y:number)=>y!==gate.requiredFeetY&&!g.world.tiles.some((t:any)=>!t.hidden&&!t.oneWay&&t.kind!=="castle"&&t.kind!=="flagpole"&&t.x<gate.x+16&&t.x+t.w>gate.x+4&&t.y<y&&t.y+t.h>y-height));
    assert.ok(surface!=null,id+" wrong lane exists");
    Object.assign(g.player,{x:gate.x+4,y:surface-height,h:height,power:height===16?"small":"big",vx:0,vy:0,grounded:true});
    tick(g);
    assert.deepEqual([g.player.x,g.player.y+g.player.h,g.cameraX],[checkpoint.x,checkpoint.feetY,checkpoint.cameraX]);
    assert.deepEqual([g.time,g.score,g.coins,g.lives,g.player.power],[123,9876,12,4,height===16?"small":"big"]);
    assert.ok(g.world.loops.filter((l:any)=>l.group<group).every((l:any)=>l.checked));
    assert.ok(g.world.loops.filter((l:any)=>l.group===group).every((l:any)=>!l.checked));
    for(let i=0;i<8;i++) {
      tick(g,1,{right:true,jump:i<4});
      assert.equal(g.status,"playing");
      assert.ok(!g.world.tiles.some((t:any)=>!t.hidden&&!t.oneWay&&!["castle","flagpole"].includes(t.kind)&&g.player.x<t.x+t.w&&g.player.x+g.player.w>t.x&&g.player.y<t.y+t.h&&g.player.y+g.player.h>t.y),id+" checkpoint embedded");
    }
  }
});
test("fixture death inside bonus restores current-level midpoint, not room or1-1",()=>{
  const g=arena("3-1"),mainArea=g.areaId,checkpoint=g.world.checkpoint;
  assert.ok(checkpoint);
  g.cameraX=checkpoint.cameraX; Object.assign(g.player,{x:checkpoint.x,y:192});
  tick(g); assert.equal(g.checkpoint,true);
  g.world.exits=[{id:"bonus",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",target:{levelId:"3-1",areaId:"42",entryId:"page-0-drop"}}];
  tick(g); assert.equal(g.areaId,"42"); tick(g,180);
  g.player.power="fire";g.score=2468;g.player.y=280;tick(g);assert.equal(g.status,"dying");tick(g,120);
  assert.equal(g.levelId,"3-1");assert.equal(g.areaId,mainArea);
  assert.equal(g.cameraX,checkpoint.cameraX);assert.equal(g.player.x,checkpoint.x);
  assert.deepEqual([g.score,g.lives,g.player.power,g.areaCache.size],[2468,2,"small",0]);
});
test("fixture whirlpool pulls on odd frames and undercurrent differs from free water",()=>{
  const a=arena(),b=arena();
  for(const g of [a,b]) {g.world.physics="water";g.world.tiles=[];Object.assign(g.player,{x:40,y:100,grounded:false});}
  a.world.whirlpools=[{id:"current",type:"whirlpool",x:32,y:0,w:64,h:240,pull:0.5,gravity:16/256,maxSpeed:1}];
  tick(a);tick(b);assert.equal(a.player.x-b.player.x,1);assert.ok(a.player.vy>b.player.vy);
  const x=a.player.x;tick(a);assert.equal(a.player.x,x);
});
test("fixture each castle axe reaches NPC, then only8-4 emits terminal win",()=>{
  for(let world=1;world<=8;world++) {
    const g:any=fresh(world+"-4"); const goal=g.world.goal;
    g.world.spawns=[]; g.world.hazards=[]; g.world.loops=[]; g.enemies=[]; g.transition=null;
    Object.assign(g.player,{x:goal.x,y:goal.y,w:12,h:16,vx:0,vy:0,grounded:false});
    tick(g);assert.equal(g.status,"flag");assert.equal(g.finish.phase,"bridge");
    const events:string[]=[];let message=false,ending=false;
    for(let i=0;i<1600&&g.status==="flag";i++) {
      tick(g);events.push(...g.events.map((e:any)=>e.type));message||=g.finish.phase==="message";ending||=g.finish.phase==="ending";
    }
    assert.equal(message,true); assert.equal(ending,world===8);
    assert.equal(g.status,world===8?"won":"clear");
    assert.equal(events.filter(e=>e==="win").length,world===8?1:0);
    assert.equal(events.filter(e=>e==="castleclear").length,1);
    assert.equal(events.filter(e=>e==="levelclear").length,world===8?0:1);
  }
});
test("fixture every source pipe/vine/edge reaches its explicit canonical target",()=>{
  let routes=0;
  for(const id of ids) for(const areaId of getLevel(id).areaIds) {
    const source=createWorld(id,areaId);
    for(const exit of source.exits) {
      const g:any=fresh(id),world=createWorld(id,areaId);
      Object.assign(g,{world,areaId:world.areaId,area:world.theme,items:world.items,transition:null,enemies:[],cameraRegion:null});
      world.spawns=[];world.hazards=[];world.loops=[];
      g.cameraX=Math.max(0,exit.x-112);
      if(exit.trigger==="pipe") {
        Object.assign(g.player,{x:exit.direction==="down"?exit.x+(exit.w-12)/2:exit.x-12,y:exit.direction==="down"?exit.y-16:exit.y+exit.h-16,grounded:true,vx:0,vy:0});
        tick(g,1,{down:exit.direction==="down",right:exit.direction==="right",up:exit.direction==="up"});
        assert.ok(g.transition?.target,exit.id+" should start pipe");
        for(let i=0;i<100&&g.transition?.target;i++) tick(g);
      } else if(exit.trigger==="vine") {
        Object.assign(g.player,{x:exit.x,y:exit.triggerFeetY-16,climbing:true,vine:{exitId:exit.id},grounded:false});
        tick(g,1,{up:true});
      } else {
        Object.assign(g.player,{x:exit.x+4,y:exit.y+1,grounded:false});tick(g);
      }
      const target=createWorld(exit.target.levelId,exit.target.areaId),entry=target.entries[exit.target.entryId];
      assert.equal(g.levelId,exit.target.levelId,exit.id);assert.equal(g.areaId,target.areaId,exit.id);
      assert.equal(g.player.x,entry.x,exit.id);assert.equal(g.cameraX,entry.cameraX,exit.id);
      assert.notEqual(g.status,"dying",exit.id);routes++;
    }
  }
  assert.ok(routes>100);console.log("SOURCE ROUTE FIXTURES",routes);
});
test("intro29 walks at source entrance speed and enters current body without held input",()=>{
  for(const id of ["1-2","2-2","4-2","7-2"]) {
    const g:any=fresh(id),x=g.player.x; tick(g);
    assert.equal(g.player.x-x,0.75);
    for(let i=0;i<500&&g.areaId==="29";i++)tick(g);
    assert.equal(g.areaId,getLevel(id).mainAreaId);assert.equal(g.levelId,id);assert.equal(g.status,"playing");
  }
});
function frenzyArena(id:string,areaId="main") {
  const g:any=fresh(id); g.world=createWorld(id,areaId); g.areaId=g.world.areaId;g.area=g.world.theme;
  g.transition=null;g.world.spawns=[];g.world.tiles=[{id:"floor",kind:"ground",x:0,y:208,w:8192,h:32}];
  g.world.platforms=[];g.world.loops=[];g.world.exits=[];g.world.goal=null;
  g.world.hazards=g.world.hazards.filter((h:any)=>h.type.endsWith("spawner"));
  g.items=[];g.enemies=[];g.cameraRegion=null;g.world.cameraLock=null;
  return g;
}
function positionFrenzy(g:any,camera:number) {
  g.cameraX=camera;Object.assign(g.player,{x:camera+112,y:32,vx:0,vy:0,grounded:false});
}
test("frenzy repeated2-2/2-3 starts retain one active generator and shared timer",()=>{
  for(const [id,first,second] of [["2-2",1280,1536],["2-3",416,2192]] as const) {
    const g=frenzyArena(id);positionFrenzy(g,first-384);tick(g);
    assert.equal(g.frenzy?.type,"fish-spawner",id);
    const timer=g.frenzy.timer;positionFrenzy(g,second-384);tick(g);
    assert.equal(g.frenzy.timer,timer-1,"repeat start must not reload the shared timer");
    assert.equal(g.world.hazards.filter((h:any)=>h.type.endsWith("spawner")).length,0);
    g.frenzy.timer=1;g.enemies=[];tick(g);assert.equal(g.enemies.filter((e:any)=>e.type==="cheepcheep").length,1);
  }
});
test("frenzy5-3 enemy stream stops at2256 and never spawns after stop",()=>{
  const g=frenzyArena("5-3");positionFrenzy(g,1312-304);tick(g);
  assert.equal(g.frenzy?.type,"bullet-spawner");
  g.frenzy.timer=1;tick(g);assert.ok(g.enemies.some((e:any)=>e.type==="bulletbill"));
  positionFrenzy(g,2256-384);g.enemies=[];tick(g);
  assert.equal(g.frenzy.type,null);
  for(let i=0;i<180;i++){positionFrenzy(g,2256-384);tick(g);}
  assert.equal(g.enemies.length,0);
});
test("frenzy1-4 approach flame precedes Bowser and shares one timer after boss appears",()=>{
  const g=frenzyArena("1-4");positionFrenzy(g,1664-304);
  for(let i=0;i<240&&!g.projectiles.some((b:any)=>b.type==="flame");i++){positionFrenzy(g,1664-304);tick(g);}
  const approach=g.projectiles.find((b:any)=>b.type==="flame");assert.ok(approach,"approach fire without a spawned Bowser");
  assert.ok(Math.abs(approach.x-(g.cameraX+256+32))<2);
  g.projectiles=[];g.frenzy.timer=1;
  const boss=enemy(g,"bowser",{x:g.cameraX+220,y:176,w:32,h:32,hp:5,fireTimer:0,jumpTimer:999});
  tick(g);assert.equal(g.projectiles.filter((b:any)=>b.type==="flame").length,1);
  assert.ok(g.projectiles[0].x<boss.x);
  const timer=g.frenzy.timer;tick(g);assert.equal(g.frenzy.timer,timer-1);
  assert.equal(g.projectiles.filter((b:any)=>b.type==="flame").length,1);
});
test("frenzy stop retires Lakitu in4-1/6-1/8-2 without more eggs and removes it",()=>{
  for(const [id,stop] of [["4-1",3552],["6-1",2944],["8-2",992]] as const) {
    const g=frenzyArena(id);positionFrenzy(g,stop-385);
    const l=enemy(g,"lakitu",{x:g.cameraX+180,y:64,throwTimer:0});g.player.y=96;g.frenzy.timer=1;tick(g);
    assert.ok(g.projectiles.some((b:any)=>b.type==="spiny-egg"));
    positionFrenzy(g,stop-384);g.projectiles=[];l.throwTimer=0;tick(g);
    assert.equal(l.retiring,true);assert.equal(g.projectiles.length,0);
    for(let i=0;i<300;i++){positionFrenzy(g,stop-384);tick(g);}
    assert.ok(!g.enemies.includes(l));assert.equal(g.projectiles.length,0);
  }
});
test("warp plant suppression begins at source activation, ordinary pipes remain dangerous before",()=>{
  for(const [id,area,marker] of [["1-2","40",3168],["4-2","2f",1120]] as const) {
    const g=frenzyArena(id,area);positionFrenzy(g,marker-385);
    const plant=enemy(g,"piranha",{x:g.cameraX+220,y:160,phase:"rest",rest:999});
    tick(g);assert.ok(g.enemies.includes(plant));
    positionFrenzy(g,marker-384);tick(g);
    assert.ok(!g.enemies.some((e:any)=>e.type==="piranha"));
    g.world.spawns=[{id:"late-plant",type:"piranha",x:g.cameraX+220,y:160,count:1}];tick(g);
    assert.ok(!g.enemies.some((e:any)=>e.type==="piranha"));
    assert.equal(g.frenzy.warpActive,true);
  }
  const ordinary=frenzyArena("3-1");enemy(ordinary,"piranha",{x:180,y:160,phase:"rest",rest:999});tick(ordinary);
  assert.ok(ordinary.enemies.some((e:any)=>e.type==="piranha"));
});
test("frenzy cache restores timer and area identity; maze, death, next and restart reset state",()=>{
  const g=frenzyArena("5-3");positionFrenzy(g,288-304);g.frenzy.timer=53;tick(g);
  assert.equal(g.frenzy.type,"bullet-spawner");const before=g.frenzy.timer;
  g.world.exits=[{id:"bonus",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",target:{levelId:"5-3",areaId:"42",entryId:"page-0-drop"}}];
  g.world.entries["fixture-return"]={x:g.player.x,y:g.player.y,cameraX:g.cameraX,transition:"none"};
  tick(g);assert.equal(g.areaId,"42");assert.equal(g.frenzy.type,null);
  g.transition=null;g.world.exits=[{id:"return",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",target:{levelId:"5-3",areaId:"26",entryId:"fixture-return"}}];
  tick(g);assert.equal(g.areaId,"26");assert.equal(g.frenzy.timer,before);
  g.world.exits=[];g.player.y=280;tick(g);tick(g,120);
  assert.equal(g.levelId,"5-3");assert.equal(g.frenzy.timer,96);assert.equal(g.frenzy.warpActive,false);
  g.frenzy.warpActive=true;g.status="clear";g.clearTicks=89;tick(g);
  assert.equal(g.levelId,"5-4");assert.equal(g.frenzy.warpActive,false);assert.equal(g.frenzy.timer,96);
  g.frenzy.type="fish-spawner";g.frenzy.timer=3;g.frenzy.warpActive=true;restartGame(g);
  assert.equal(g.levelId,"1-1");assert.equal(g.frenzy.type,null);assert.equal(g.frenzy.timer,96);assert.equal(g.frenzy.warpActive,false);
  const maze=frenzyArena("4-4");maze.world.loops=[{id:"retry",x:100,requiredFeetY:96,requiresGrounded:true,group:0,sequence:0,groupLength:1,resetCheckpoint:{x:40,feetY:208,cameraX:0}}];
  maze.world.frenzyCommands=[{id:"start",sourceX:400,activationX:16,action:"start",type:"fish-spawner",variant:"normal"}];
  maze.frenzy.type="fish-spawner";maze.frenzy.cursor=1;maze.frenzy.timer=1;maze.frenzy.warpActive=true;
  Object.assign(maze.player,{x:110,y:192});maze.cameraX=20;tick(maze);
  assert.equal(maze.player.x,40);assert.equal(maze.frenzy.type,null);assert.equal(maze.frenzy.cursor,0);assert.equal(maze.frenzy.timer,96);assert.equal(maze.frenzy.warpActive,false);
});
test("frenzy shares one timer across changed types and freezes during transformations",()=>{
  const g=arena();g.world.frenzyCommands=[
    {id:"fish",sourceX:384,activationX:0,action:"start",type:"fish-spawner",variant:"normal"},
    {id:"bullet",sourceX:484,activationX:100,action:"start",type:"bullet-spawner",variant:"normal"}];
  tick(g);const timer=g.frenzy.timer;positionFrenzy(g,100);tick(g);
  assert.equal(g.frenzy.type,"bullet-spawner");assert.equal(g.frenzy.timer,timer-1);
  g.items.push({type:"mushroom",x:g.player.x,y:g.player.y,w:16,h:16,alive:true});tick(g);assert.ok(g.transform);
  const frozen=g.frenzy.timer;tick(g,10);assert.equal(g.frenzy.timer,frozen);
});
test("frenzy Bowser defeat does not restart approach flames",()=>{
  const g=frenzyArena("1-4");positionFrenzy(g,1664-304);
  const boss=enemy(g,"bowser",{x:g.cameraX+220,y:176,w:32,h:32,hp:5,fireTimer:0,jumpTimer:999});
  tick(g);g.enemies=[];boss.alive=false;g.projectiles=[];g.frenzy.timer=1;tick(g);
  assert.equal(g.projectiles.length,0);assert.equal(g.frenzy.type,null);
});
test("frenzy cached defeated Bowser stays defeated when returning from another area",()=>{
  const g=frenzyArena("1-4");positionFrenzy(g,1664-304);
  enemy(g,"bowser",{x:g.cameraX+220,y:176,w:32,h:32,hp:5,fireTimer:0,jumpTimer:999});
  tick(g);g.enemies=[];tick(g);assert.equal(g.frenzy.type,null);
  const camera=g.cameraX;
  g.world.entries["fixture-return"]={x:g.player.x,y:g.player.y,cameraX:camera,transition:"none"};
  g.world.exits=[{id:"out",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",target:{levelId:"1-4",areaId:"42",entryId:"start"}}];
  tick(g);g.transition=null;g.world.exits=[{id:"back",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",target:{levelId:"1-4",areaId:"60",entryId:"fixture-return"}}];
  tick(g);g.world.exits=[];g.frenzy.timer=1;
  tick(g);assert.equal(g.projectiles.length,0);assert.equal(g.frenzy.bossSeen,true);
});
test("lift wrap is teleportation rather than a sweep through airborne players",()=>{
  for(const [y,speed] of [[255.625,0.9375],[0.375,-0.9375]]) {
    const g=arena("1-2"); g.world.tiles=[];
    const lift={...createWorld("1-2").platforms.find((t:any)=>t.id==="40-e14"),y,speed,triggerX:0};
    g.world.platforms=[lift];g.cameraX=2128;
    Object.assign(g.player,{x:2240,y:140,vy:1,grounded:false});tick(g);
    assert.equal(g.player.y,141);assert.equal(g.player.grounded,false);
    assert.equal(lift.dy,0,"wrapped displacement is not physical velocity");
  }
});
test("lift wraps detach riders and permit a fresh landing on the following tick",()=>{
  for(const [y,speed] of [[255.625,0.9375],[0.375,-0.9375]]) {
    const g=arena();g.world.tiles=[];
    const lift={id:"wrap",x:32,y,w:64,h:8,motion:"lift",range:{min:0,max:256},speed};
    g.world.platforms=[lift];
    Object.assign(g.player,{x:48,y:y-16,grounded:true,supportId:"wrap",vy:0});tick(g);
    assert.ok(Math.abs(g.player.y-(y-16))<1);assert.equal(g.player.grounded,false);assert.equal(g.player.supportId,null);
    Object.assign(g.player,{x:48,y:lift.y-17,grounded:false,vy:2});tick(g);
    assert.equal(g.player.grounded,true);assert.equal(g.player.y+16,lift.y);
  }
  const g=arena();g.world.tiles=[];g.world.platforms=[{id:"continuous",x:32,y:162,w:64,h:8,motion:"lift",range:{min:0,max:256},speed:-3}];
  Object.assign(g.player,{x:48,y:145,vy:0,grounded:false});tick(g);assert.equal(g.player.y,143);assert.equal(g.player.grounded,true);
  tick(g);assert.equal(g.player.y,140);assert.equal(g.player.grounded,true);
});
test("Lakitu fire defeat reappears only on seventh shared frenzy check and can repeat",()=>{
  const g=frenzyArena("4-1");positionFrenzy(g,176);
  Object.assign(g.player,{y:192,grounded:true});
  const first=enemy(g,"lakitu",{x:396,y:32,h:24,throwTimer:128});
  tick(g);assert.equal(g.frenzy.type,"lakitu");
  function defeat(e:any) { shot(g,e);assert.equal(e.alive,false);assert.ok(!g.enemies.some((e:any)=>e.alive&&e.type==="lakitu")); }
  function waitForReturn() {
    g.frenzy.timer=0;
    for(let check=1;check<=6;check++) {
      tick(g,check===1?1:128);
      assert.equal(g.frenzy.lakituAbsentChecks,check);assert.equal(g.frenzy.timer,128);
      assert.ok(!g.enemies.some((e:any)=>e.type==="lakitu"));
    }
    tick(g,127);assert.ok(!g.enemies.some((e:any)=>e.type==="lakitu"));
    tick(g);const actors=g.enemies.filter((e:any)=>e.type==="lakitu");
    assert.equal(actors.length,1);assert.equal(actors[0].x,g.cameraX+288);assert.equal(actors[0].y,32);
    assert.equal(g.frenzy.lakituAbsentChecks,0);return actors[0];
  }
  defeat(first);defeat(waitForReturn());waitForReturn();
  positionFrenzy(g,3552-384);tick(g);assert.equal(g.frenzy.type,null);
  for(let i=0;i<1000;i++){positionFrenzy(g,3552-384);g.player.y=192;g.player.grounded=true;tick(g);}
  assert.ok(!g.enemies.some((e:any)=>e.type==="lakitu"));
});
test("Hammer Bro walking delay uses shared interval phase, source hard-mode durations and player side",()=>{
  for(const [id,duration] of [["1-1",128],["5-3",80]] as const) {
    const g=arena(id);g.intervalTimer=20;
    const bro=enemy(g,"hammerbro",{x:500,y:184,h:24,throwTimer:10000,jumpTimer:10000});
    tick(g,20);assert.equal(bro.walkingTimer,duration);assert.equal(Math.abs(bro.vx),0.25);
    tick(g);assert.equal(bro.walkingTimer,duration-1);
    tick(g,(duration-2)*21);assert.equal(bro.walkingTimer,1);assert.equal(Math.abs(bro.vx),0.25);
    tick(g,20);assert.equal(bro.walkingTimer,1);
    tick(g);assert.equal(bro.walkingTimer,0);assert.equal(bro.vx,-0.5);
    Object.assign(g.player,{x:bro.x+80,y:192,vx:0,grounded:true});tick(g);
    assert.equal(bro.facing,1);assert.equal(Math.abs(bro.vx),0.25);
  }
});
test("Hammer Bro interval timer freezes during power transformation",()=>{
  const g=arena();g.intervalTimer=0;
  const bro=enemy(g,"hammerbro",{x:500,y:184,h:24,walkingTimer:4,throwTimer:10000,jumpTimer:10000});
  g.items.push({type:"mushroom",x:40,y:192,w:16,h:16,alive:true});tick(g);
  assert.equal(bro.walkingTimer,3);const phase=g.intervalTimer;
  tick(g,59);assert.equal(g.transform,null);assert.equal(bro.walkingTimer,3);assert.equal(g.intervalTimer,phase);
  tick(g,phase+1);assert.equal(bro.walkingTimer,2);
});
test("Lakitu reappearance progress survives area cache and resets on death, maze and restart",()=>{
  const g=frenzyArena("4-1");positionFrenzy(g,176);Object.assign(g.player,{y:192,grounded:true});tick(g);
  g.frenzy.lakituAbsentChecks=3;g.frenzy.timer=37;
  g.world.entries["fixture-return"]={x:g.player.x,y:192,cameraX:176,transition:"none"};
  g.world.exits=[{id:"out",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",target:{levelId:"4-1",areaId:"42",entryId:"start"}}];
  tick(g);assert.equal(g.frenzy.lakituAbsentChecks,0);
  g.transition=null;g.world.exits=[{id:"back",x:g.player.x,y:g.player.y,w:32,h:32,trigger:"edge",direction:"right",target:{levelId:"4-1",areaId:"22",entryId:"fixture-return"}}];
  tick(g);assert.equal(g.frenzy.lakituAbsentChecks,3);assert.equal(g.frenzy.timer,37);
  g.world.exits=[];g.player.y=280;tick(g);tick(g,120);assert.equal(g.frenzy.lakituAbsentChecks,0);
  g.frenzy.lakituAbsentChecks=5;g.world.loops=[{id:"retry",x:100,requiredFeetY:96,requiresGrounded:true,group:0,sequence:0,groupLength:1,resetCheckpoint:{x:40,feetY:208,cameraX:0}}];
  Object.assign(g.player,{x:110,y:192,grounded:true});g.world.tiles=[{id:"floor",x:0,y:208,w:8192,h:32,kind:"ground"}];tick(g);
  assert.equal(g.frenzy.lakituAbsentChecks,0);
  g.frenzy.lakituAbsentChecks=6;g.status="clear";g.clearTicks=89;tick(g);assert.equal(g.frenzy.lakituAbsentChecks,0);
  g.frenzy.lakituAbsentChecks=6;restartGame(g);assert.equal(g.frenzy.lakituAbsentChecks,0);
});
for(let world=1;world<=8;world++) test("castle "+world+"-4 frames Mario and NPC throughout message and ending",()=>{
  const g:any=fresh(world+"-4"),goal=g.world.goal;
  g.world.spawns=[];g.world.hazards=[];g.enemies=[];g.transition=null;
  for(const gate of g.world.loops) gate.checked=true;
  Object.assign(g.player,{x:goal.x,y:goal.y,vx:0,vy:0,grounded:false});
  g.cameraX=goal.x-112;
  Object.assign(g,{score:1234,coins:7,lives:3,time:200});
  tick(g);assert.equal(g.finish.phase,"bridge");
  let messageTicks=0,endingTicks=0,previousCamera=g.cameraX;
  for(let i=0;i<1600&&g.status==="flag";i++) {
    tick(g,1,{left:true,down:true,jump:true,run:true});
    assert.ok(g.cameraX>=previousCamera,"automatic walk never scrolls backward");
    assert.ok(g.cameraX>=0&&g.cameraX<=g.world.width-256,"camera stays within area");
    previousCamera=g.cameraX;
    if(["walk","message","ending"].includes(g.finish.phase)) {
      assert.ok(g.player.x>=g.cameraX&&g.player.x+g.player.w<=g.cameraX+256,"Mario stays visible");
    }
    if(["message","ending"].includes(g.finish.phase)) {
      assert.ok(goal.npcX>=g.cameraX&&goal.npcX+16<=g.cameraX+256,"NPC stays visible");
      if(g.status==="flag") {
        if(g.finish.phase==="message") messageTicks++; else endingTicks++;
      }
    }
  }
  assert.equal(messageTicks,180);assert.equal(endingTicks,world===8?240:0);
  assert.deepEqual([g.score,g.coins,g.lives,g.time],[1234,7,3,200]);
  assert.equal(g.status,world===8?"won":"clear");
  assert.ok(goal.npcX+16<=g.cameraX+256);
  if(world===8) {
    const camera=g.cameraX;tick(g,90,{left:true,jump:true});
    assert.equal(g.status,"won");assert.equal(g.cameraX,camera);
  } else {
    tick(g,89);assert.equal(g.status,"clear");
    tick(g);assert.equal(g.levelId,(world+1)+"-1");assert.equal(g.status,"playing");
  }
});

test("Lakitu source row2 and reappearance use visual origin32 with unchanged24px sprite",()=>{
  for(const id of ["4-1","6-1","8-2"]) {
    const spawn=createWorld(id).spawns.find((e:any)=>e.type==="lakitu");
    assert.equal(spawn.y,32,id);
    const actor=createEnemy(spawn);assert.deepEqual([actor.y,actor.w,actor.h],[32,16,24]);
  }
});
test("Lakitu source motion departs coincident Mario and preserves direction within60px",()=>{
  function move(x:number,playerVx:number,direction=-1,speed=0) {
    const e:any=createEnemy({type:"lakitu",x,y:32});e.lakituDirection=direction;e.lakituSpeed=speed;
    moveActor({player:{x:100,vx:playerVx},level:{secondaryHard:true}},e,{});return e;
  }
  for(const vx of [0,1.5,2.5,-1.5]) assert.equal(move(100,vx).vx,-1.25);
  assert.equal(move(120,0).vx,-15/16);
  assert.equal(move(80,0).vx,-15/16,"crossing under Lakitu does not immediately reverse it");
  assert.equal(move(41,0).vx,-6/16);
  assert.equal(move(40,0).vx,5/16,"60px switches left-moving Lakitu to the right");
  assert.equal(move(160,0,1,5/16).vx,4/16,"rightward reversal brakes one speed unit per tick");
  assert.equal(move(160,0,1,1/16).vx,-5/16);
});
test("Lakitu collision excludes decorative sprite edges but retains side damage and stomp",()=>{
  for(const y of [24,54,64]) {
    const g=arena();enemy(g,"lakitu",{x:128,y:32,h:24});
    Object.assign(g.player,{x:130,y,vy:0,grounded:false});tick(g);
    assert.equal(g.status,"playing","visual-only overlap at y="+y);
  }
  const side=arena();enemy(side,"lakitu",{x:128,y:32,h:24});
  Object.assign(side.player,{x:130,y:42,vy:0,grounded:false});tick(side);assert.equal(side.status,"dying");
  const stomped=arena(),e=enemy(stomped,"lakitu",{x:128,y:32,h:24});
  Object.assign(stomped.player,{x:130,y:24,vy:4,grounded:false});tick(stomped);
  assert.equal(e.alive,false);assert.equal(stomped.score,800);assert.equal(stomped.player.vy,-3);
  assert.equal(stomped.player.y,25,"bounce starts at source collision top41");
});
test("Lakitu source inset bounds consistently govern fireball and shell hits",()=>{
  for(const weapon of ["fireball","shell"]) for(const [y,hit] of [[54,false],[41,true]] as const) {
    const g=arena(),e=enemy(g,"lakitu",{x:128,y:32,h:24});
    if(weapon==="fireball")g.fireballs.push({type:"fireball",x:130,y,w:8,h:8,vx:0,vy:0,life:100,alive:true});
    else enemy(g,"shell",{x:114,y,w:16,h:16,vx:3,vy:0,revive:16});
    tick(g);assert.equal(e.alive,!hit,weapon+" at y"+y);
  }
});
test("Lakitu egg visual origin follows native rawY minus8 plus blank sprite row8",()=>{
  const g=arena();enemy(g,"lakitu",{x:180,y:32,h:24,throwTimer:0});tick(g);
  const egg=g.projectiles.find((p:any)=>p.type==="spiny-egg");
  assert.ok(egg);assert.equal(egg.y,29,"visual top32 moved by launch vy-3");
  assert.equal(egg.vx,0);assert.equal(egg.vy,-3+61/256);
});

test("Lakitu suppresses eggs above raw playerY44 for both sizes while reloading shared timer",()=>{
  for(const height of [16,32]) for(const [feet,emit] of [[75,false],[76,true]] as const) {
    const g=arena();Object.assign(g.player,{y:feet-height,h:height,power:height===16?"small":"big",grounded:false});
    enemy(g,"lakitu",{x:180,y:32,h:24,throwTimer:0});tick(g);
    assert.equal(g.projectiles.some((p:any)=>p.type==="spiny-egg"),emit,"feet"+feet+" height"+height);
    assert.equal(g.frenzy.timer,128);
  }
});
test("retired Lakitu exits left at source1px per tick without spawning eggs",()=>{
  const g=arena();const e=enemy(g,"lakitu",{x:120,y:32,h:24,retiring:true,throwTimer:0});
  g.frenzy.stopped=true;tick(g);assert.equal(e.x,119);assert.equal(e.vx,-1);assert.equal(e.facing,-1);
  tick(g,180);assert.ok(!g.enemies.includes(e));assert.equal(g.projectiles.length,0);assert.equal(g.frenzy.type,null);
});

test("Lakitu source horizontal inset ignores sprite-only side edges",()=>{
  for(const [x,hurt] of [[116.5,false],[117.5,true],[141.1,false]] as const) {
    const g=arena();enemy(g,"lakitu",{x:128,y:32,h:24});
    Object.assign(g.player,{x,y:42,vy:0,grounded:false});tick(g);
    assert.equal(g.status,hurt?"dying":"playing","player x="+x);
  }
});
test("isolated8-2 staircase scene passes using ordinary controls with source Lakitu",()=>{
  const g:any=fresh("8-2"),spawn=g.world.spawns.find((e:any)=>e.type==="lakitu");
  // Scene isolates the genuine blocker coordinates; it is not a stage-entry or full-campaign proof.
  g.world.spawns=[];g.world.hazards=[];g.items=[];
  Object.assign(g.player,{x:320.4501953125,y:128,vx:1.0390625,vy:0,grounded:true});
  g.cameraX=g.player.x-112;
  g.enemies=[createEnemy({...spawn,x:321.1283695024655})];
  let jumping=false,lastJump=false;
  for(let i=0;i<400&&g.player.x<448;i++) {
    const p=g.player,front=p.x+p.w,feet=p.y+p.h;
    const wall=g.world.tiles.some((t:any)=>!t.hidden&&!["castle","flagpole"].includes(t.kind)&&
      t.x>front-1&&t.x<front+28&&t.y<feet&&t.y+t.h>p.y);
    if(p.grounded)jumping=!lastJump&&wall;
    tick(g,1,{right:true,run:true,jump:jumping});lastJump=jumping;
    assert.equal(g.status,"playing");assert.equal(g.player.power,"small");assert.equal(g.lives,3);
    assert.equal(g.player.invincible,0);
  }
  assert.ok(g.player.x>=448);assert.equal(g.frame,73);
});

test("ordinary small8-2 entry traverses the first staircase without state grants",()=>{
  const g:any=fresh("8-2");
  const keys=["left","right","down","up","jump","run"] as const;
  const controls=[[34,36],[50,6],[34,24],[50,30],[34,24],[2,6],[0,6],[33,6],
    [34,6],[50,30],[34,12],[50,6],[34,48],[50,4]];
  for(const [mask,n] of controls)for(let i=0;i<n;i++) {
    const input=Object.fromEntries(keys.map((key,bit)=>[key,!!(mask&(1<<bit))]));
    stepGame(g,input);
    assert.equal(g.status,"playing");assert.equal(g.player.power,"small");assert.equal(g.lives,3);
    assert.equal(g.player.invincible,0);
  }
  assert.equal(g.frame,244);assert.equal(g.player.x,481.115234375);assert.equal(g.player.y,108.9375);
});
console.log(`Mario campaign selftest: ${passed} passed, ${failed} failed (fixtures; full-flow separate)`);
if(failed) process.exitCode=1;
