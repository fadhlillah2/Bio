export const TILE = 16;
export const VIEW_WIDTH = 256;
export const VIEW_HEIGHT = 240;

// Geometry: Xkeeper0/smb1 objects.asm L_GroundArea6, checked against MarioUniverse 1-1 map.
export function createWorld(area = "overworld", hiddenOneup = true) {
  const tiles = [];
  const items = [];
  const spawns = [];
  const tile = (x, y, kind, extra = {}) => {
    const t = { x: x * TILE, y: y * TILE, w: TILE, h: TILE, kind, ...extra };
    tiles.push(t);
    return t;
  };
  const rect = (x, y, w, h, kind, extra = {}) =>
    tile(x, y, kind, { w: w * TILE, h: h * TILE, ...extra });
  if (area === "underground") {
    for (let x = 0; x < 17; x++) for (let y = 13; y < 15; y++) tile(x, y, "ground");
    for (let y = 2; y < 13; y++) tile(0, y, "brick");
    for (let x = 4; x <= 10; x++) {
      tile(x, 2, "brick");
      for (let y = 10; y <= 12; y++) tile(x, y, "brick");
    }
    for (const [y, first, last] of [[5, 5, 9], [7, 4, 10], [9, 4, 10]]) {
      for (let x = first; x <= last; x++) {
        items.push({ type: "coin", x: x * TILE + 4, y: y * TILE, w: 8, h: 16, alive: true });
      }
    }
    rect(13, 11, 2, 2, "pipe", { direction: "left", exit: true });
    rect(15, 2, 2, 11, "pipe", { direction: "vertical" });
    return { width: 17 * TILE, height: VIEW_HEIGHT, tiles, items, spawns, area };
  }
  const pits = [[69, 70], [86, 88], [153, 154]];
  for (let x = 0; x < 224; x++) {
    if (!pits.some(([a, b]) => x >= a && x <= b)) {
      tile(x, 13, "ground"); tile(x, 14, "ground");
    }
  }
  for (const [x, y, h] of [[28,11,2],[38,10,3],[46,9,4],[57,9,4],[163,11,2],[179,11,2]]) {
    rect(x, y, 2, h, "pipe", { enter: x === 57, exit: x === 163 });
  }
  for (const [x,y] of [[21,9],[78,9],[109,5]]) tile(x,y,"question",{content:"powerup"});
  for (const [x,y] of [[16,9],[22,5],[23,9],[94,5],[106,9],[109,9],[112,9],[129,5],[130,5],[170,9]]) {
    tile(x,y,"question",{content:"coin"});
  }
  if (hiddenOneup) tile(64,8,"question",{hidden:true,content:"oneup"});
  tile(94,9,"brick",{content:"multicoin"});
  tile(101,9,"brick",{content:"star"});
  for (const x of [20,22,24,77,79,100,118,129,130,168,169,171]) tile(x,9,"brick");
  for (const x of [80,81,82,83,84,85,86,87,91,92,93,121,122,123,128,131]) tile(x,5,"brick");
  for (const [start, heights] of [
    [134,[1,2,3,4]], [140,[4,3,2,1]], [148,[1,2,3,4,4]],
    [155,[4,3,2,1]], [181,[1,2,3,4,5,6,7,8,8]]
  ]) {
    for (let i=0; i<heights.length; i++) {
      for (let y=13-heights[i]; y<13; y++) tile(start+i,y,"stone");
    }
  }
  tile(198,12,"stone");
  rect(198,2,1,10,"flagpole");
  rect(202,8,5,5,"castle");
  for (const [x, surface] of [[22,13],[40,13],[80,5],[82,5]]) {
    spawns.push({ x: x*TILE, y: surface*TILE-16, type: "goomba", count: 1, spawned: false });
  }
  spawns.push({x:107*TILE,y:13*TILE-24,type:"koopa",count:1,spawned:false});
  for (const x of [54,100,117,127,131,177]) {
    spawns.push({x:x*TILE,y:13*TILE-16,type:"goomba",count:2,group:x,spawned:false});
  }
  spawns.sort((a,b)=>a.x-b.x);
  return {
    width: 224*TILE, height: VIEW_HEIGHT, tiles, spawns, items, area, pits,
    flagX: 198*TILE, castleX: 204*TILE, checkpointX: 1280,
    entryX: 57*TILE, exitX: 163*TILE
  };
}
