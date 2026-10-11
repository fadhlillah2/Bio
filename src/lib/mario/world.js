import { getLevel, getAreaData, AREA_IDS } from './levels.js';

export const TILE = 16;
export const VIEW_WIDTH = 256;
export const VIEW_HEIGHT = 240;

// Layout semantics: Xkeeper0/smb1 prg.asm AreaParserCore, RenderUnderPart and object routines.
const TERRAIN = [0,0,0,24,1,24,7,24,15,24,255,24,1,31,7,31,15,31,129,31,1,0,143,31,241,31,249,24,241,24,255,31];
const SPANS = new Set(['brickRow','solidRow','coinRow','pit','waterHole','pulleyRope','bridgeHigh','bridgeMiddle','bridgeLow','questionCoinRowHigh','questionCoinRowLow','staircase']);
const BLOCKS = {
  questionPower: ['question','powerup'], questionCoin: ['question','coin'], hiddenCoin: ['question','coin'],
  hiddenOneUp: ['question','oneup'], brickPower: ['brick','powerup'], brickVine: ['brick','vine'],
  brickStar: ['brick','star'], brickMultiCoin: ['brick','multicoin'], brickOneUp: ['brick','oneup']
};
function objectWidth(record, area) {
  const kind = record[2];
  if (SPANS.has(kind) || (kind === 'styleObject' && area.style !== 2)) return record[3] + 1;
  if (kind.endsWith('VerticalPipe')) return 2;
  if (kind === 'castle') return 5;
  if (kind === 'castleBridge') return 13;
  if (kind === 'introPipe' || kind === 'sideExitPipe') return 4;
  return 1;
}
function areaWidth(area) {
  return (Math.floor(Math.max(...area.objects.map(r => r[0] + objectWidth(r,area) - 1)) / 16) + 2) * 256;
}
function entryName(page, mode) { return `page-${page}-${mode}`; }

export function createWorld(levelId = '1-1', areaId = 'main', hiddenOneup = true) {
  const level = getLevel(levelId);
  if (areaId === 'main') areaId = level.mainAreaId;
  const area = getAreaData(areaId);
  const cloud = ['2b','34'].includes(areaId) || area.style === 3;
  const theme = cloud ? 'sky' : { ground:'overworld',water:'underwater',underground:'underground',castle:'castle' }[area.type];
  let color=area.foregroundOrColor;
  for(const record of area.objects) if(record[0]<24 && record[2]==='attributes' && (record[3]&64) && (record[3]&7)>=4) color=record[3]&7;
  const world = {
    levelId,areaId,theme,palette: color===4||color===6?'night':color===5?'snow':color===7?'gray':'day',
    physics: area.type === 'water' ? 'water' : 'land', width:areaWidth(area),height:VIEW_HEIGHT,
    tiles:[],items:[],spawns:[],platforms:[],hazards:[],exits:[],loops:[],frenzyCommands:[],goal:null,entries:{},checkpoint:null,
    cameraLock:{min:0,max:areaWidth(area)-VIEW_WIDTH,regions:[],commands:[]}, scenery:[], attributes:[], whirlpools:[],
    source:{label:area.label,objectRecords:area.objects.length,enemyRecords:area.enemies.length,routeRecords:area.routes.length},
    area:theme, primaryHard:false,secondaryHard:level.secondaryHard
  };
  const cells = [];
  const pipes = [];
  const vines = [];
  const commands = [];
  const records = area.objects.filter(r => r[2] !== 'pageSet');
  const slots = [null,null,null];
  let next = 0, terrain = area.terrain, background=area.background, foreground = area.foregroundOrColor < 4 ? area.foregroundOrColor : 0;
  let oneup = hiddenOneup;
  const widthTiles = world.width / TILE;
  const add = (array, value) => { array.push(value); return value; };
  for (let x = 0; x < widthTiles; x++) {
    const column = Array(13).fill(null);
    const put = (row, kind, extra = {}, force = false) => {
      if (row < 0 || row >= 13) return;
      const old = column[row];
      if (!force && old && (old.protected || old.ledgeMiddle || (old.kind === 'ground' && extra.decoration === 'mushroom-stem'))) return;
      column[row] = kind ? {kind,...extra} : null;
    };
    const fill = (row, count, kind, extra = {}) => { for (let y=row;y<Math.min(13,row+count);y++) put(y,kind,extra); };
    for (let y=0;y<13;y++) {
      const byte = TERRAIN[terrain*2+(y>=8?1:0)];
      if ((byte & (1 << (y%8))) && (!cloud || y<8 || y===11)) {
        put(y,cloud?'cloud':area.type==='underground'&&y<11?'brick':area.type==='castle'||(area.type==='water'&&level.worldNumber===8)?'stone':'ground');
      } else if (foreground===1 && y>=11) put(y,'ground');
    }
    if(background) addBackdrop(world,x,background);
    if(foreground===2) world.scenery.push({id:`${areaId}-wall-${x}`,kind:'wall',x:x*16,y:112,w:16,h:96});
    for (let slot=2;slot>=0;slot--) {
      let active = slots[slot];
      if (!active && next < records.length) {
        const record = records[next];
        if (record[0] < x) throw new Error(`Unconsumed object ${areaId}:${record[5]} at column ${x}`);
        if (record[0] === x) { active={record,start:x,end:x+objectWidth(record,area)-1}; slots[slot]=active; next++; }
      }
      if (!active) continue;
      const [start,row,kind,param,line,offset] = active.record;
      const step = x-active.start, first=step===0, last=x===active.end;
      const sourceId = `${areaId}-o${offset}`;
      const meta={sourceId};
      const brickKind=cloud?'cloud':area.type==='water'?'coral':'brick';
      if (Object.hasOwn(BLOCKS,kind)) {
        if (kind!=='hiddenOneUp' || oneup) {
          const [tileKind,content]=BLOCKS[kind];
          put(row,tileKind,{...meta,content,hidden:kind==='hiddenCoin'||kind==='hiddenOneUp',protected:kind!=='questionCoin'});
          if (kind==='hiddenOneUp') oneup=false;
          if (kind==='brickVine') vines.push({x:start*TILE,y:(row+2)*TILE,sourceId});
        }
      } else switch(kind) {
        case 'brickRow': put(row,brickKind,meta); break;
        case 'solidRow': put(row,area.type==='water'?'coral':'stone',meta); break;
        case 'brickColumn': fill(row,param+1,area.type==='water'?'coral':'brick',meta); break;
        case 'solidColumn': fill(row,param+1,area.type==='water'?'coral':'stone',meta); break;
        case 'coinRow': put(row,'coin',{...meta,protected:true}); break;
        case 'usedBlock': put(row,'used',{...meta,protected:true}); break;
        case 'questionCoinRowHigh': put(3,'question',{...meta,content:'coin'},true); break;
        case 'questionCoinRowLow': put(7,'question',{...meta,content:'coin'},true); break;
        case 'pit':
          fill(8,5,null);
          if (first && world.physics==='water') add(world.whirlpools,{id:sourceId,type:'whirlpool',x:(start-1)*TILE,y:0,w:(param+3)*TILE,h:240,pull:0.5,pullEvery:2,pullPhase:1,gravity:16/256,maxSpeed:1});
          break;
        case 'waterHole': fill(10,3,null); break;
        case 'decorativeVerticalPipe': case 'enterableVerticalPipe': {
          const height=(param&7)+1;
          put(row,'pipe',meta,true); fill(row+1,height-1,'pipe',meta);
          if (first) pipes.push({id:sourceId,x:start*TILE,y:(row+2)*TILE,w:32,h:height*TILE,enter:kind==='enterableVerticalPipe',direction:'down'});
          break;
        }
        case 'waterSidePipe':
          put(row,'pipe',meta,true);put(row+1,'pipe',meta,true);
          if(first) pipes.push({id:sourceId,x:start*16,y:(row+2)*16,w:16,h:32,enter:true,direction:'right',water:true});
          break;
        case 'introPipe': case 'sideExitPipe': {
          const height=kind==='introPipe'?10:param;
          if (step>=2) {
            fill(0,height-1,'pipe',meta);
            if (kind==='introPipe') { for(let y=0;y<=6;y++) put(y,null,{},true); put(7,'pipe',meta,true); }
          }
          put(height-1,'pipe',meta,true);put(height,'pipe',meta,true);
          if(first) pipes.push({id:sourceId,x:start*TILE,y:(height+1)*TILE,w:32,h:32,enter:true,direction:'right',intro:kind==='introPipe',shaftY:kind==='introPipe'?144:32});
          break;
        }
        case 'staircase': { const height=Math.min(step+1,8); fill(11-height,height,'stone',meta);break; }
        case 'styleObject':
          if(area.style===2) {
            fill(row,param+1,'stone',{...meta,decoration:'cannon'});
            if(first) add(world.hazards,{id:sourceId,type:'cannon',x:start*TILE,y:(row+2)*TILE,w:16,h:(param+1)*TILE});
          } else {
            put(row,'platform',{...meta,oneWay:true,ledgeMiddle:!first&&!last,style:area.style===1?'mushroom':cloud?'cloud':'tree'},!first&&!last);
            if(area.style===1 && step===Math.ceil(param/2)) add(world.scenery,{id:`${sourceId}-stem`,kind:'mushroom-stem',x:x*TILE,y:(row+3)*TILE,w:16,h:(12-row)*TILE});
            else if(area.style!==1 && ((!first&&!last)||start===0)) add(world.scenery,{id:`${sourceId}-${x}`,kind:'tree-trunk',x:x*TILE,y:(row+3)*TILE,w:16,h:(12-row)*TILE});
          }
          break;
        case 'bridgeHigh': case 'bridgeMiddle': case 'bridgeLow': {
          const y={bridgeHigh:6,bridgeMiddle:7,bridgeLow:9}[kind];
          put(y,null,{},true);put(y+1,'bridge',{...meta,oneWay:true});
          if(first) add(world.scenery,{id:`${sourceId}-rail`,kind:'bridge-rail',x:start*TILE,y:(y+2)*TILE,w:(param+1)*TILE,h:16});
          break;
        }
        case 'castleBridge': put(8,'bridge',{...meta,bridge:true});break;
        case 'axe': if(first) commands.push({kind,x:start*TILE,sourceId});break;
        case 'chain': if(first) add(world.scenery,{id:sourceId,kind:'chain',x:start*TILE,y:144,w:16,h:16});break;
        case 'spring': put(row,'spring',meta,true);put(row+1,'spring',meta,true);break;
        case 'castle':
          for(let y=param;y<11;y++) put(y,null,{},true);
          if(first) add(world.tiles,{id:sourceId,x:start*TILE,y:(param+2)*TILE,w:80,h:(11-param)*TILE,kind:'castle'});
          break;
        case 'flagpole':
          put(10,'stone',meta,true);
          if(first) { add(world.tiles,{id:sourceId,x:start*TILE,y:32,w:16,h:160,kind:'flagpole'});commands.push({kind,x:start*TILE,sourceId}); }
          break;
        case 'attributes':
          if(param&64) foreground=(param&7)<4?param&7:0;
          else { terrain=param&15; background=(param>>4)&3; }
          if(first) world.attributes.push({x:start*TILE,parameter:param});
          break;
        case 'endlessRope': case 'balanceRope': case 'pulleyRope':
          if(first) add(world.scenery,{id:sourceId,kind,x:start*TILE,y:kind==='balanceRope'?48:32,w:kind==='pulleyRope'?(param+1)*16:16,h:kind==='pulleyRope'?16:kind==='balanceRope'?(param+1)*16:208});
          break;
        case 'scrollLock': case 'warpScrollLock': case 'loopCommand': case 'flyingFishFrenzy': case 'bulletOrFishFrenzy': case 'stopFrenzy':
          if(first) commands.push({kind,x:start*TILE,sourceId,parameter:param,sourceLine:line});
          break;
        default: throw new Error(`Unsupported area object ${kind} at ${area.label}:${line}`);
      }
      if(last) slots[slot]=null;
    }
    cells.push(column);
  }
  if(next!==records.length) throw new Error(`Incomplete area expansion ${areaId}`);
  for(let x=0;x<cells.length;x++) for(let row=0;row<13;row++) {
    const cell=cells[x][row];
    if(!cell) continue;
    const {protected:ignored,ledgeMiddle:ignored2,...tile}=cell;
    if(cell.kind==='coin') world.items.push({id:`${areaId}-coin-${x}-${row}`,type:'coin',x:x*16+4,y:(row+2)*16,w:8,h:16,alive:true});
    else world.tiles.push({id:`${areaId}-tile-${x}-${row}`,x:x*16,y:(row+2)*16,w:16,h:16,...tile});
  }
  mergePipes(world,pipes);
  addActors(world,area,level,pipes);
  addRoutes(world,area,level,pipes,vines,commands);
  world.frenzyCommands.sort((a,b)=>a.activationX-b.activationX || a.sourceX-b.sourceX);
  const warpPipes=new Set(world.exits.filter(e=>e.warp).map(e=>e.id));
  world.spawns=world.spawns.filter(s=>s.type!=='piranha'||!warpPipes.has(s.pipeId));
  addGoals(world,area,level,commands);
  addEntries(world,area,level,pipes);
  addLoops(world,level);
  if(theme==='castle') {
    for(let x=0;x<cells.length;x++) if(!cells[x][11] && !cells[x][12]) {
      const previous=world.hazards.at(-1);
      if(previous?.type==='lava'&&previous.x+previous.w===x*16) previous.w+=16;
      else world.hazards.push({id:`${areaId}-lava-${x}`,type:'lava',x:x*16,y:208,w:16,h:32});
    }
  }
  if(areaId===level.mainAreaId && level.checkpointCameraPage) {
    const cameraX=level.checkpointCameraPage*256;
    world.checkpoint={x:cameraX+40,y:192,cameraX};
  }
  const springs=new Map();
  for(const tile of world.tiles) if(tile.kind==='spring') {
    const spring=springs.get(tile.sourceId);
    if(spring) spring.h+=tile.h;
    else springs.set(tile.sourceId,{...tile,compression:0});
  }
  world.tiles=world.tiles.filter(t=>t.kind!=='spring').concat([...springs.values()]);
  world.tiles.sort((a,b)=>(a.kind==='ground'?0:1)-(b.kind==='ground'?0:1)||a.x-b.x||a.y-b.y);
  world.spawns.sort((a,b)=>a.x-b.x);
  return world;
}

// Scenery position facts: smb1/prg.asm BackSceneryData (three repeating pages).
const BACKDROP = [
  [147,0,0,17,18,18,19,0,0,81,82,83,0,0,0,0,0,0,1,2,2,3,0,0,0,0,0,0,145,146,147,0,0,0,0,81,82,83,65,66,67,0,0,0,0,0,145,146],
  [151,135,136,137,153,0,0,0,17,18,19,164,165,165,165,166,151,152,153,1,2,3,0,164,165,166,0,17,18,18,18,19,0,0,0,0,1,2,2,3,0,164,165,165,166,0,0,0],
  [17,18,18,19,0,0,0,0,0,0,0,156,0,139,170,170,170,170,17,18,19,139,0,156,156,0,0,1,2,3,17,18,18,19,0,0,0,0,170,170,156,170,0,139,0,1,2,3]
];
function addBackdrop(world,x,background) {
  const code=BACKDROP[background-1][x%48];
  if(!code) return;
  const type=code&15;
  const kind=type<=3?'cloud':type<=6?'bush':type<=9?'hill':type===10?'fence':'tree';
  const part=type<=9?['left','middle','right'][(type-1)%3]:type===11?'tall':type===12?'short':'middle';
  world.scenery.push({id:`${world.areaId}-background-${x}`,kind,part,x:x*16,y:((code>>4)+2)*16,w:16,h:kind==='cloud'?32:kind==='bush'||kind==='fence'?16:48});
}

function mergePipes(world,pipes) {
  for(const pipe of pipes) {
    const parts=pipe.direction==='down'?[{x:pipe.x,y:pipe.y,w:pipe.w,h:pipe.h,direction:'down'}]:pipe.water?[{x:pipe.x,y:pipe.y,w:16,h:32,direction:'left'}]:[
      {x:pipe.x,y:pipe.y,w:32,h:32,direction:'left'},
      {x:pipe.x+32,y:pipe.shaftY,w:32,h:pipe.y+32-pipe.shaftY,direction:'vertical'}
    ];
    for(const [index,part] of parts.entries()) {
      const cells=world.tiles.filter(t=>t.kind==='pipe'&&t.sourceId===pipe.id&&t.x>=part.x&&t.x<part.x+part.w&&t.y>=part.y&&t.y<part.y+part.h);
      if(cells.length!==part.w*part.h/256) throw new Error(`Clipped pipe requires explicit shape: ${pipe.id}`);
      const members=new Set(cells);
      world.tiles=world.tiles.filter(t=>!members.has(t));
      world.tiles.push({id:`${pipe.id}-pipe-${index}`,kind:'pipe',sourceId:pipe.id,...part,enter:pipe.enter});
    }
  }
}

function addActors(world,area,level,pipes) {
  const family={goomba:'goomba',greenKoopa:'koopa',redKoopa:'koopa',greenParatroopaJump:'koopa',greenParatroopaFly:'koopa',redParatroopa:'koopa',buzzyBeetle:'beetle',hammerBro:'hammerbro',lakitu:'lakitu',bloober:'blooper',grayCheep:'cheepcheep',podoboo:'podoboo',bowser:'bowser'};
  let balance=null;
  for(const [index,record] of area.enemies.entries()) {
    const [tileX,row,kind,hard,line,sourceId]=record;
    if(hard&&!level.secondaryHard) continue;
    const x=tileX*16, id=`${world.areaId}-e${index}`;
    if(kind==='pageSet'||kind==='warpZoneObject'||kind==='retainer') continue;
    if(kind==='bulletOrFishFrenzy'||kind==='bowserFlameFrenzy'||kind==='lakitu') {
      world.frenzyCommands.push({id,sourceX:x,activationX:Math.max(0,x-304),action:'start',
        type:kind==='bowserFlameFrenzy'?'bowser-flame':kind==='lakitu'?'lakitu':world.physics==='water'?'fish-spawner':'bullet-spawner',variant:'normal'});
      if(kind!=='lakitu') continue;
    }
    if(kind.includes('Firebar')) {
      const fast=kind.startsWith('fast'),length=kind.startsWith('long')?12:6;
      world.hazards.push({id,type:'firebar',x:x+8,y:row*16+8,w:8,h:8,length,spacing:8,angle:0,angularSpeed:(kind.endsWith('CCW')?-1:1)*(fast?56:40)/256*2*Math.PI/32,sourceId});
      continue;
    }
    if(kind.includes('Platform')||kind.includes('Lift')) {
      const small=kind.startsWith('small'),isBalance=kind==='balancePlatform',lift=kind.includes('Lift');
      const motion=isBalance?'balance':kind==='verticalPlatform'?'vertical':kind==='dropPlatform'?'fall':lift?'lift':'horizontal';
      const y=row*16+(isBalance?-2:0);
      const platform={id,x:x+(lift?12:isBalance?(level.secondaryHard?8:0):0),y,w:small?24:level.secondaryHard||area.type==='castle'?32:48,h:8,motion,
        range:motion==='vertical'?{min:row*16<128?row*16:256-row*16,center:(row*16+(row*16<128?64:192))%256}:motion==='horizontal'?{min:x-52.5,max:x}:motion==='lift'?{min:0,max:256}:{min:45,max:256},
        speed:lift?(kind.endsWith('Up')?-0.9375:0.9375):kind==='cloudRiderPlatform'?1:motion==='horizontal'?0.875:0,
        variant:kind,triggerX:x,sourceId,acceleration:motion==='fall'?127/256:5/256,upAcceleration:10/256,maxSpeed:motion==='fall'?2:3,counterMax:14,counterTicks:4,fallAcceleration:32/256};
      world.platforms.push(platform);
      if(isBalance) { if(balance) { platform.pairId=balance.id;balance.pairId=platform.id;balance=null; } else balance=platform; }
      continue;
    }
    if(kind.includes('Group')) {
      const type=kind.startsWith('goomba')?'goomba':'koopa',count=kind.includes('Group3')?3:2,surface=kind.endsWith('High')?9:13;
      world.spawns.push({id,x,y:surface*16-(type==='koopa'?24:16),type,count,group:tileX,spawned:false,triggerX:x,spawnAt:'camera-right',spacing:24,variant:type==='koopa'?'green':undefined,sourceId,secondaryOnly:hard});
      continue;
    }
    const type=family[kind];
    if(!type) throw new Error(`Unsupported enemy ${kind} at ${area.label}:${line}`);
    const height=type==='koopa'||type==='hammerbro'||type==='blooper'?24:type==='bowser'?32:16;
    const y=type==='podoboo'?258:type==='bowser'||type==='lakitu'?row*16:row*16+32-height;
    world.spawns.push({id,x,y,type,count:1,spawned:false,triggerX:x,variant:kind,sourceId,secondaryOnly:hard});
  }
  for(const pipe of pipes) if(pipe.direction==='down' && level.id!=='1-1') world.spawns.push({id:`${pipe.id}-plant`,x:pipe.x+8,y:pipe.y,type:'piranha',pipeId:pipe.id,count:1,spawned:false,triggerX:pipe.x,range:{min:pipe.y-24,max:pipe.y},speed:0.5,restFrames:64});
}

function routeTarget(level, route, mode) {
  return {levelId:level.id,areaId:route[2],entryId:entryName(route[3],mode)};
}
function addRoutes(world,area,level,pipes,vines,commands) {
  const routes=area.routes.filter(r=>r[1]===level.worldNumber);
  const latch=(x)=> {
    const camera=Math.max(0,Math.min(world.width-256,x-120));
    return routes.filter(r=>r[0]*16<=camera+304).at(-1);
  };
  const warp=commands.find(c=>c.kind==='warpScrollLock');
  const warpPipes=warp?pipes.filter(p=>p.enter&&p.direction==='down').slice(world.areaId==='2f'||level.worldNumber===1?-3:-1):[];
  for(const pipe of pipes) if(pipe.enter) {
    let target,warped=false;
    if(pipe.intro) target={levelId:level.id,areaId:level.mainAreaId,entryId:'start'};
    else if(warpPipes.includes(pipe)) {
      const destinations=world.areaId==='2f'?[8,7,6]:level.worldNumber===1?[4,3,2]:[5];
      const destination=destinations[warpPipes.indexOf(pipe)];
      if(!destination) throw new Error(`Unexpected warp pipe ${level.id}/${pipe.id}`);
      const stage=getLevel(`${destination}-1`);
      target={levelId:stage.id,areaId:stage.startAreaId,entryId:'start'};warped=true;
    } else {
      const route=latch(pipe.x);
      if(!route) continue;
      const mode=pipe.direction==='right'||area.type==='castle'?'pipe-up':'drop';
      target=routeTarget(level,route,mode);
    }
    world.exits.push({id:pipe.id,x:pipe.x,y:pipe.y,w:pipe.w,h:pipe.h,trigger:'pipe',direction:pipe.direction,target,warp:warped});
  }
  for(const vine of vines) {
    const route=latch(vine.x);
    if(!route) throw new Error(`Missing vine destination ${level.id}/${vine.sourceId}`);
    world.exits.push({id:`${vine.sourceId}-vine`,x:vine.x,y:-32,w:16,h:36,trigger:'vine',direction:'up',triggerFeetY:4,autoClimbFeetY:64,blockY:vine.y,blockId:vine.sourceId,target:routeTarget(level,route,'vine')});
  }
  if(world.theme==='sky'&&routes.length) world.exits.push({id:`${world.areaId}-fall`,x:0,y:240,w:world.width,h:32,trigger:'edge',direction:'down',target:routeTarget(level,routes.at(-1),'fall')});
  for(const command of commands) {
    if(command.kind==='scrollLock'||command.kind==='warpScrollLock') world.cameraLock.commands.push({sourceX:command.x,toggle:true,warp:command.kind==='warpScrollLock',sourceId:command.sourceId});
    if(['flyingFishFrenzy','bulletOrFishFrenzy','stopFrenzy','warpScrollLock'].includes(command.kind)) {
      world.frenzyCommands.push({id:command.sourceId,sourceX:command.x,activationX:Math.max(0,command.x-384),
        action:command.kind==='stopFrenzy'?'stop':command.kind==='warpScrollLock'?'warp':'start',
        type:command.kind==='flyingFishFrenzy'||world.physics==='water'?'fish-spawner':'bullet-spawner',
        variant:command.kind==='flyingFishFrenzy'?'flying':'normal'});
    }
  }
  if(world.areaId==='42') for(let page=0;page<=8;page+=2) world.cameraLock.regions.push({entryPage:page,min:page*256,max:page*256});
}

function addEntries(world,area,level,pipes) {
  world.entries.start={x:40,y:area.initialY+16,cameraX:0,transition:area.entranceCtrl===1?'drop':'none'};
  const pages=new Set([0]);
  for(const aid of AREA_IDS) for(const route of getAreaData(aid).routes) if(route[1]===level.worldNumber&&route[2]===world.areaId) pages.add(route[3]);
  for(const page of pages) {
    const cameraX=page*256;
    const pipe=pipes.find(p=>p.direction==='down'&&p.x===cameraX+48);
    for(const mode of ['drop','pipe-up','vine','fall']) {
      world.entries[entryName(page,mode)]={x:cameraX+(mode==='drop'?24:mode==='fall'?40:56),y:mode==='pipe-up'&&pipe?pipe.y-16:mode==='fall'?16:mode==='vine'?224:area.initialY+16,cameraX,transition:mode==='fall'||mode==='drop'?'drop':mode==='vine'?'pipe-up':mode,climbing:mode==='vine'};
    }
  }
}
function addGoals(world,area,level,commands) {
  const flag=commands.find(c=>c.kind==='flagpole');
  if(flag) {
    const castle=world.tiles.find(t=>t.kind==='castle'&&t.x>flag.x);
    world.goal={kind:'flag',x:flag.x,y:32,w:16,h:160,castleX:castle?castle.x+32:flag.x+96,floorY:208};
    world.flagX=flag.x;world.castleX=world.goal.castleX;
  }
  const axe=commands.find(c=>c.kind==='axe');
  if(axe) {
    const retainer=area.enemies.find(r=>r[2]==='retainer');
    world.goal={kind:level.ending?'ending':'axe',x:axe.x,y:128,w:16,h:16,floorY:208,bridgeIds:world.tiles.filter(t=>t.bridge).map(t=>t.id),npcX:retainer?retainer[0]*16:axe.x+128};
  }
}
// Maze checks compare feet so small and large players follow the same original lane.
function addLoops(world,level) {
  if(world.areaId!==level.mainAreaId) return;
  const rows=level.id==='4-4'?[[5,64,18],[9,176,54]]:level.id==='7-4'?[[4,176,14],[5,128,14],[6,64,14],[8,64,50],[9,128,50],[10,64,50]]:level.id==='8-4'?[[6,240,10],[11,240,38],[16,240,64]]:[];
  // Retry at each source corridor's entry landing; raw four-page replay needs the original streaming renderer.
  const checkpoints=level.id==='4-4'?[[208,160,96],[1280,208,1168]]:level.id==='7-4'?[[512,208,400],[1536,208,1424]]:[[312,176,256],[1848,176,1792],[3128,176,3072]];
  world.loops=rows.map(([page,y,offset],i)=> {
    const group=level.id==='7-4'?Math.floor(i/3):i;
    const [x,feetY,cameraX]=checkpoints[group];
    return {id:`${world.areaId}-loop-${i}`,x:page*256-(level.id==='8-4'?0:256),rendererPage:page,requiredY:y+16,requiredFeetY:y+32,requiresGrounded:true,group,sequence:level.id==='7-4'?i%3:0,groupLength:level.id==='7-4'?3:1,resetCheckpoint:{x,feetY,cameraX},sourceRestartOffset:offset};
  });
}
