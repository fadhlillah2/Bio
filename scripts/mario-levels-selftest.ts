import { strict as assert } from 'node:assert';
import { createHash } from 'node:crypto';
import { createWorld, TILE, VIEW_WIDTH, VIEW_HEIGHT } from '../src/lib/mario/world.js';

assert.equal(createWorld('8-4', 'main').levelId, '8-4', 'factory selects the requested campaign stage');
const { LEVEL_IDS, getLevel, AREA_IDS, getAreaData } = await import('../src/lib/mario/levels.js');
const expectedIds = Array.from({ length: 32 }, (_, i) => `${1 + Math.floor(i / 4)}-${1 + i % 4}`);
assert.deepEqual(LEVEL_IDS, expectedIds);
assert(Object.isFrozen(LEVEL_IDS));
assert.equal(AREA_IDS.length, 34);
assert.equal(new Set(AREA_IDS).size, 34);
assert.deepEqual([TILE, VIEW_WIDTH, VIEW_HEIGHT], [16, 256, 240]);
for (const id of ['', '1-0', '1-5', '9-1', 'main', undefined, null]) assert.throws(() => getLevel(id), RangeError);
assert.throws(() => createWorld('1-1', 'missing'), RangeError);
const bodies = ['25','40','26','60','28','01','27','62','24','35','20','63','22','41','2c','61','2a','31','26','62','2e','23','2d','60','33','01','27','64','30','32','21','65'];
const arrays = ['tiles','items','spawns','platforms','hazards','exits','loops','scenery','whirlpools','frenzyCommands'];
assert.equal(AREA_IDS.reduce((sum,id)=>sum+getAreaData(id).objects.length,0),1635);
assert.equal(AREA_IDS.reduce((sum,id)=>sum+getAreaData(id).enemies.length+getAreaData(id).routes.length,0),502);
assert.equal(AREA_IDS.reduce((sum,id)=>sum+getAreaData(id).routes.length,0),50);
assert.equal(new Set(LEVEL_IDS.flatMap(id=>getLevel(id).areaIds)).size,34);
assert.equal(new Set(bodies).size,27);
for(const areaId of AREA_IDS) { const area=getAreaData(areaId);assert(Object.isFrozen(area.objects));assert(area.objects.every(Object.isFrozen)); }
const timers=[400,400,300,300,400,400,300,300,400,300,300,300,400,400,300,400,300,400,300,300,400,400,300,300,400,400,300,400,300,400,300,400];
assert.deepEqual(LEVEL_IDS.map(id=>getLevel(id).timer),timers);
const tileCells = (world: any) => world.tiles.flatMap((t: any) => {
  const out: any[] = [];
  for (let x = t.x; x < t.x + t.w; x += 16) for (let y = t.y; y < t.y + t.h; y += 16) out.push([x,y,t.kind,t.content ?? null,!!t.hidden]);
  return out;
}).sort((a: any,b: any) => a[0]-b[0] || a[1]-b[1] || a[2].localeCompare(b[2]));
for (const [i,id] of LEVEL_IDS.entries()) {
  const level = getLevel(id);
  assert.equal(level.mainAreaId, bodies[i]);
  assert.equal(level.id, id);
  assert.equal(level.primaryHard, false);
  assert.equal(level.secondaryHard, i >= 18);
  assert.equal(level.ending, id === '8-4');
  assert.equal(level.startAreaId, ['1-2','2-2','4-2','7-2'].includes(id) ? '29' : bodies[i]);
  const world = createWorld(id);
  assert.equal(world.areaId, level.mainAreaId);
  assert.equal(world.levelId, id);
  assert(world.entries.start);
  for (const key of arrays) assert(Array.isArray(world[key]), `${id}.${key}`);
  for (const t of world.tiles) assert(t.w > 0 && t.h > 0 && t.y >= 0 && t.y < 240);
  const fresh = createWorld(id);
  const before = JSON.stringify(fresh);
  for (const key of arrays) { assert.notEqual(world[key], fresh[key]); world[key].push({ mutated: true }); }
  world.entries.start.x = -999;
  assert.equal(JSON.stringify(createWorld(id)), before, `${id}: no shared mutable values`);
  for (const areaId of level.areaIds) {
    const area = createWorld(id, areaId);
    for (const exit of area.exits) {
      const target = createWorld(exit.target.levelId, exit.target.areaId);
      const entry=target.entries[exit.target.entryId];
      assert(entry, `${id}/${areaId}/${exit.id}: valid entry`);
      if(exit.target.entryId.endsWith('pipe-up')) assert(target.tiles.some((tile:any)=>tile.kind==='pipe'&&tile.y===entry.y+16&&tile.x<=entry.x&&tile.x+tile.w>=entry.x+12), `${id}/${areaId}/${exit.id}: return above destination pipe lip`);
      if(exit.trigger==='vine') { assert.equal(exit.triggerFeetY,4);assert.equal(exit.autoClimbFeetY,64);assert(exit.blockY>exit.y+exit.h); }
    }
  }
}
const first = createWorld();
assert.equal(first.tiles[0].kind,'ground');
assert.equal(first.goal.h,160);
assert.equal(first.tiles.filter((t:any)=>t.kind==='pipe').length,6);
for(const pipe of first.tiles.filter((t:any)=>t.kind==='pipe')) { assert.equal(pipe.w,32);assert.equal(pipe.direction,'down'); }
for(const id of LEVEL_IDS) for(const spring of createWorld(id).tiles.filter((t:any)=>t.kind==='spring')) { assert.equal(spring.h,32);assert.equal(spring.compression,0); }
assert.equal(createWorld('3-1').palette,'night');
assert.equal(createWorld('3-2').palette,'night');
assert.equal(createWorld('5-1').palette,'snow');
assert.equal(createWorld('6-3').palette,'gray');
assert.equal(createHash('sha256').update(JSON.stringify(tileCells(first))).digest('hex'), '274daee31c14158d9d12be980be9a5205e2d6c1c7a222a7755faf414187fa6a6', 'original 1-1 complete geometry and block contents');
assert.deepEqual(first.spawns.map((s: any) => [s.x,s.y,s.type,s.count,s.group ?? null]), [
  [352,192,'goomba',1,null],[640,192,'goomba',1,null],[864,192,'goomba',2,54],
  [1280,64,'goomba',1,null],[1312,64,'goomba',1,null],[1600,192,'goomba',2,100],
  [1712,184,'koopa',1,null],[1872,192,'goomba',2,117],[2032,192,'goomba',2,127],
  [2096,192,'goomba',2,131],[2832,192,'goomba',2,177]
]);
assert(!createWorld('1-1','main',false).tiles.some((t: any) => t.content === 'oneup'));
for (const [levelId, expected] of [['1-2',[4,3,2]],['4-2',[5]]] as const) {
  assert.deepEqual(createWorld(levelId).exits.filter((e: any) => e.warp).map((e: any) => +e.target.levelId[0]), expected);
}
assert.deepEqual(createWorld('4-2','2f').exits.filter((e: any) => e.warp).map((e: any) => +e.target.levelId[0]), [8,7,6]);
for (const [levelId,areaId,destination,page] of [['2-2','01','25',11],['7-2','01','25',11],['5-2','00','31',7],['6-2','00','23',7],['8-4','02','65',16]] as const) {
  const exit = createWorld(levelId,areaId).exits.find((e:any) => e.direction==='right');
  assert(exit, `${levelId}/${areaId}: original underwater side exit is playable`);
  assert.equal(exit.target.areaId,destination);
  assert.equal(createWorld(levelId,destination).entries[exit.target.entryId].cameraX,page*256);
}
const castle = createWorld('8-4');
for (const [x,area,page] of [[81,'65',7],[152,'65',12],[228,'02',0]] as const) {
  const exit = castle.exits.find((e: any) => e.x === x * 16);
  assert(exit, `8-4 pipe ${x}`);
  assert.equal(exit.target.areaId, area);
  assert.equal(createWorld('8-4',area).entries[exit.target.entryId].cameraX, page * 256);
}
assert.deepEqual(createWorld('4-4').loops.map((l: any) => l.requiredY), [64,176].map(y => y + 16));
assert.deepEqual(createWorld('7-4').loops.map((l: any) => l.requiredY), [176,128,64,64,128,64].map(y => y + 16));
for(const id of ['4-4','7-4','8-4']) {
  const area=createWorld(id);
  for(const loop of area.loops) {
    const checkpoint=loop.resetCheckpoint;
    assert(checkpoint, `${id}/${loop.id}: explicit canonical-map retry checkpoint`);
    for(const h of [16,32]) {
      const p={x:checkpoint.x,y:checkpoint.feetY-h,w:12,h};
      const colliding=area.tiles.filter((t:any)=>t.kind!=='castle'&&t.kind!=='flagpole'&&!t.hidden);
      assert(!colliding.some((t:any)=>p.x<t.x+t.w&&p.x+p.w>t.x&&p.y<t.y+t.h&&p.y+p.h>t.y), `${loop.id}: reset headroom ${h}`);
      assert(colliding.some((t:any)=>p.x<t.x+t.w&&p.x+p.w>t.x&&checkpoint.feetY===t.y), `${loop.id}: grounded retry ${h}`);
      assert(!area.hazards.some((t:any)=>t.type==='lava'&&p.x<t.x+t.w&&p.x+p.w>t.x&&p.y<t.y+t.h&&p.y+p.h>t.y));
    }
  }
}
assert.deepEqual(castle.loops.map((l:any)=>l.x),[1536,2816,4096]);
for(const [i,x] of [81,152,228].entries()) assert(x*16<castle.loops[i].x);

// Source frenzy commands share one runtime channel; terrain prefetch is384px, actor prefetch304px.
for(const [id,starts,stop] of [['2-2',[1280,1536],3072],['2-3',[416,2192],3152],['5-3',[288,1312],2256]] as const) {
  const world=createWorld(id),commands=world.frenzyCommands;
  assert.deepEqual(commands.filter((c:any)=>c.action==='start').map((c:any)=>c.sourceX),starts);
  assert.deepEqual(commands.filter((c:any)=>c.action==='stop').map((c:any)=>c.sourceX),[stop]);
  assert(!world.hazards.some((h:any)=>h.type==='fish-spawner'||h.type==='bullet-spawner'));
  assert(commands.every((c:any,i:number)=>i===0||commands[i-1].activationX<=c.activationX));
  for(const command of commands) assert.equal(command.activationX,Math.max(0,command.sourceX-(id==='5-3'&&command.action==='start'?304:384)));
}
assert(createWorld('1-4').frenzyCommands.some((c:any)=>c.type==='bowser-flame'&&c.sourceX===1664&&c.activationX===1360));
for(const [id,stop] of [['4-1',3552],['6-1',2944],['8-2',992]] as const) {
  const world=createWorld(id);assert(world.frenzyCommands.some((c:any)=>c.action==='stop'&&c.sourceX===stop));
}
for(const [id,areaId] of [['1-2','40'],['4-2','2f']] as const) {
  const world=createWorld(id,areaId),warps=world.exits.filter((e:any)=>e.warp);
  assert.equal(warps.length,3);
  for(const exit of warps) assert(!world.spawns.some((s:any)=>s.type==='piranha'&&s.pipeId===exit.id));
  assert(world.frenzyCommands.some((c:any)=>c.action==='warp'));
}
assert(createWorld('3-1').spawns.some((s:any)=>s.type==='piranha'));
console.log(`Mario level data: ${LEVEL_IDS.length} stages, ${AREA_IDS.length} areas, geometry, spawns, portals, mazes and fresh ownership passed`);
