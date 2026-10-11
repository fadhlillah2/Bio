/** Built Mario route acceptance; native Chrome + Bun, no browser library. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { findChrome } from "../cv/build-pdf.ts";

const audioOnly = process.argv.includes("--audio-only");
const build = resolve(process.argv.slice(2).find(arg => !arg.startsWith("--")) || "build");
const temp = mkdtempSync(join(tmpdir(), "bio-mario-check-"));
let chrome: ReturnType<typeof Bun.spawn> | undefined;
let socket: WebSocket | undefined;
let deadline: ReturnType<typeof setTimeout> | undefined;
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, async fetch(req) {
  if (new URL(req.url).pathname === "/fixture") return new Response(fixtureHTML,{headers:{"Content-Type":"text/html"}});
  if (new URL(req.url).pathname === "/fixture.js") return new Response(fixtureCode,{headers:{"Content-Type":"text/javascript"}});
  let path = decodeURIComponent(new URL(req.url).pathname).replace(/^\/Bio(?=\/|$)/, "") || "/";
  if (path.endsWith("/")) path += "index.html";
  const file = resolve(build, "." + path);
  if (!file.startsWith(build + "/")) return new Response(null, {status:403});
  let body = Bun.file(file);
  if (!(await body.exists()) && !path.endsWith(".html")) body = Bun.file(file + ".html");
  return await body.exists() ? new Response(body) : new Response(null, {status:404});
}});
const fixtureEntry = join(temp,"fixture-entry.js");
await Bun.write(fixtureEntry, `
  import { mountMario } from ${JSON.stringify(resolve("src/lib/mario/runtime.js"))};
  import { createAudio } from ${JSON.stringify(resolve("src/lib/mario/audio.js"))};
  window.__createAudio = createAudio;
  window.__mount=()=>window.__api=mountMario(document.querySelector('[data-mario]'),{onState:s=>window.__state=s});
  window.__mount();
`);
const fixture = await Bun.build({entrypoints:[fixtureEntry],target:"browser",plugins:[{
  name:"record-render-state",
  setup(b) { b.onLoad({filter:/\/mario\/graphics\.js$/},async args=>({
    contents:(await Bun.file(args.path).text()).replace("export function renderGame(ctx, game) {",
      "export function renderGame(ctx, game) { window.__liveGame = game; window.__game = structuredClone(game);"),
    loader:"js"
  })); }
}]});
assert(fixture.success, "runtime fixture bundle compiles");
const fixtureCode = await fixture.outputs[0].text();
const fixtureHTML = `<!doctype html><html><body><a href="/Bio/">Outside</a>
<section data-mario><div style="width:768px;height:720px"><canvas tabindex="0"></canvas></div>
<div data-overlay><b data-overlay-title></b><button data-action="start">Start game</button></div>
<button data-action="pause">Pause</button><button data-action="mute">Mute</button><button data-action="restart">Restart</button>
${["left","right","down","jump","run"].map(c=>'<button style="width:80px;height:50px;touch-action:none" data-control="'+c+'">'+c+'</button>').join("")}
<input aria-label="test input"><div data-announcement role="status"></div></section>
<script type="module" src="/fixture.js"></script></body></html>`;
const origin = `http://127.0.0.1:${server.port}`;
const clock = `
  window.__clock = { time: 0, next: 0, callbacks: new Map(), draws: 0, audio: [] };
  window.requestAnimationFrame = callback => { const id=++__clock.next; __clock.callbacks.set(id,callback); return id; };
  window.cancelAnimationFrame = id => __clock.callbacks.delete(id);
  window.__advance = (frames, delta=1000/60) => {
    for(let i=0;i<frames;i++) {
      __clock.time += delta; const callbacks=[...__clock.callbacks.values()]; __clock.callbacks.clear();
      for(const callback of callbacks) callback(__clock.time);
    }
  };
  window.__ticks=n=>{__advance(Math.floor(n/5),5000/60);if(n%5)__advance(1,(n%5)*1000/60);};
  const fill=CanvasRenderingContext2D.prototype.fillRect;
  CanvasRenderingContext2D.prototype.fillRect=function(...args){
    if(this.canvas.width===256 && args[2]===256 && args[3]===240) { __clock.draws++; __clock.background=this.fillStyle; }
    return fill.apply(this,args);
  };
  const Audio=window.AudioContext;
  if(Audio) window.AudioContext=class extends Audio {
    constructor(...args) {
      super(...args); __clock.audio.push(this); this.voices=[];
      this.analyser=this.createAnalyser(); this.analyser.fftSize=2048; this.analyser.connect(this.destination);
      const gain=this.createGain.bind(this);
      this.createGain=()=>{
        const node=gain(),connect=node.connect.bind(node);
        node.connect=(target,...rest)=>connect(target===this.destination?this.analyser:target,...rest);
        return node;
      };
      for(const method of ['createOscillator','createBufferSource']) {
        const make=this[method].bind(this);
        this[method]=()=>{
          const source=make(),record={start:null,stops:[],disconnected:false,ended:false};
          this.voices.push(record);
          const start=source.start.bind(source),stop=source.stop.bind(source),disconnect=source.disconnect.bind(source);
          source.start=time=>{record.start=time;return start(time);};
          source.stop=time=>{record.stops.push(time??this.currentTime);return stop(time);};
          source.disconnect=()=>{record.disconnected=true;return disconnect();};
          source.addEventListener('ended',()=>record.ended=true);
          return source;
        };
      }
    }
  };
  window.__keys = bits => {
    const codes=['ArrowLeft','ArrowRight','ArrowDown','Space','KeyX'];
    const old=window.__bits||0;
    codes.forEach((code,i)=>{if((old&(1<<i))!==(bits&(1<<i))) document.querySelector('canvas').dispatchEvent(
      new KeyboardEvent(bits&(1<<i)?'keydown':'keyup',{code,bubbles:true,cancelable:true}));});
    window.__bits=bits;
  };
`;
const mainTrace = [[115,18],[41,26],[63,18],[46,26],[48,18],[45,26],[31,18],[41,26],[65,18],[41,26],[71,18],[57,26],[52,18],[57,26],[1,18],[52,26],[9,18],[41,26],[30,18],[58,26],[28,18],[72,26],[6,18],[57,26],[1,18],[36,26],[56,18],[41,26],[1,18],[65,26],[47,18],[52,26],[1,18],[49,26],[3,18],[41,26],[1,18],[46,26],[52,18],[85,26],[522,18]];
const pipeTrace = [[115,18],[41,26],[63,18],[46,26],[48,18],[45,26],[31,18],[41,26],[64,18],[1,1],[8,9],[8,8],[25,10],[4,2],[1,6],[1,4],[31,0],[53,2],[36,10],[6,9],[1,1],[5,9],[12,10],[1,8],[10,9],[1,8],[1,9],[1,10],[1,8],[1,9],[1,10],[2,8],[1,9],[1,10],[6,8],[1,9],[1,10],[1,9],[1,10],[1,9],[5,10],[13,2],[5,10],[9,9],[2,8],[19,10],[8,9],[1,8],[1,9],[1,8],[1,9],[3,8],[4,10],[12,2],[4,10],[10,9],[2,8],[20,10],[10,9],[1,10],[1,9],[1,10],[1,9],[4,10],[13,2],[5,10],[83,2],[92,18],[36,26],[9,18],[45,26],[1,18],[46,26],[1,18],[46,26],[1,18],[50,26],[42,18],[86,26],[451,18]];
try {
  chrome = Bun.spawn([findChrome(), "--headless=new", "--no-first-run", "--disable-background-networking",
    "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--remote-debugging-port=0",
    `--user-data-dir=${temp}`, "about:blank"], {stdout:"ignore",stderr:"ignore"});
  deadline = setTimeout(() => chrome?.kill(), 180_000);
  let targets: any[] = [];
  for (let n=0;n<100 && !targets.length;n++) {
    try {
      const port = (await Bun.file(join(temp,"DevToolsActivePort")).text()).split("\n")[0];
      targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());
    } catch {}
    if (!targets.length) await Bun.sleep(50);
  }
  assert(targets.some(t=>t.type==="page"), "Chrome debugging endpoint ready");
  socket = new WebSocket(targets.find(t=>t.type==="page").webSocketDebuggerUrl);
  await new Promise<void>((ok,fail)=>{socket!.onopen=()=>ok();socket!.onerror=fail;});
  let id=0;
  const pending = new Map<number,{ok:(v:any)=>void,fail:(e:any)=>void}>();
  const errors: string[] = [];
  socket.onmessage = e => {
    const m=JSON.parse(String(e.data));
    if(m.method==="Runtime.exceptionThrown") errors.push(JSON.stringify(m.params.exceptionDetails));
    const p=pending.get(m.id);
    if(p){pending.delete(m.id);m.error?p.fail(m.error):p.ok(m.result);}
  };
  socket.onclose=()=>{for(const p of pending.values())p.fail(new Error("Chrome disconnected"));pending.clear();};
  const send=(method:string,params={}):Promise<any>=>new Promise((ok,fail)=>{
    pending.set(++id,{ok,fail});socket!.send(JSON.stringify({id,method,params}));
  });
  const js=async(expression:string,userGesture=false)=>{
    const r=await send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true,userGesture});
    if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
  };
  const wait=async(expression:string)=>{
    for(let n=0;n<100;n++){if(await js(expression))return;await Bun.sleep(50);}
    throw new Error("Timed out: "+expression);
  };
  const check=async(expression:string,label:string)=>{assert(await js(expression),label);console.log("OK "+label);};
  await send("Page.enable");await send("Runtime.enable");
  console.log("BROWSER",await send("Browser.getVersion"));
  if (!audioOnly) {
  await send("Page.navigate",{url:origin+"/Bio/games/mario/"});
  await wait("document.readyState === 'complete'");
  await check("!!document.querySelector('[data-mario] canvas')", "Mario deep link serves the game canvas");
  await wait("document.querySelector('[data-mario]').dataset.status === 'ready'");
  await check("!document.querySelector('.chat-fab,.chat-panel')", "game has no chat widget");
  if(process.env.MARIO_CAPTURE_DIR) {
    const shot=await send("Page.captureScreenshot",{format:"png"});
    await Bun.write(join(resolve(process.env.MARIO_CAPTURE_DIR),"ready.png"),Buffer.from(shot.data,"base64"));
  }
  const click=async(selector:string)=>{
    const p=await js(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await send("Input.dispatchMouseEvent",{type:"mousePressed",...p,button:"left",clickCount:1});
    await send("Input.dispatchMouseEvent",{type:"mouseReleased",...p,button:"left",clickCount:1});
  };
  await click("[data-action=start]");
  await wait("document.querySelector('[data-mario]').dataset.status === 'playing'");
  await js(`window.__marioLeft=()=>{const d=document.querySelector('canvas').getContext('2d').getImageData(0,176,120,32).data;
    let left=120;for(let y=0;y<32;y++)for(let x=0;x<120;x++){const i=(y*120+x)*4;
      if(d[i]>100 && d[i+1]<100 && d[i+2]<80)left=Math.min(left,x);}return left;};window.__beforeLeft=__marioLeft();`);
  await send("Input.dispatchKeyEvent",{type:"keyDown",code:"ArrowRight",key:"ArrowRight",windowsVirtualKeyCode:39});
  try {
    await wait("__beforeLeft<120 && __marioLeft()>__beforeLeft && __marioLeft()<120");
    await check("__beforeLeft<120 && __marioLeft()>__beforeLeft && __marioLeft()<120","native CDP keyboard moves Mario under actual RAF");
  } finally {
    await send("Input.dispatchKeyEvent",{type:"keyUp",code:"ArrowRight",key:"ArrowRight",windowsVirtualKeyCode:39});
  }
  await wait("+document.querySelector('[data-time]').textContent < 400");
  await send("Page.addScriptToEvaluateOnNewDocument",{source:clock});
  const load=async()=>{
    await send("Page.navigate",{url:origin+"/Bio/games/mario/"});
    await wait("!!window.__clock && document.querySelector('[data-mario]')?.dataset.status === 'ready'");
  };
  await load();
  await check("__clock.audio.length === 0","no AudioContext before gesture");
  await click("[data-action=start]");
  await wait("__clock.audio.length === 1 && __clock.audio[0].state === 'running'");
  console.log("OK start gesture unlocks audio");
  await js("__advance(1)");
  const resizeGame=async(width:number,height:number)=>{
    await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:width<900});
    await wait(`innerWidth===${width} && innerHeight===${height}`);
    await js("document.fonts.ready");
    let previous="";
    for(let n=0;n<100;n++) {
      await Bun.sleep(50);
      const bounds=await js("JSON.stringify([document.querySelector('canvas').getBoundingClientRect(),document.querySelector('.game-stage').getBoundingClientRect()])");
      if(bounds===previous)return;
      previous=bounds;
    }
    throw new Error("Canvas resize did not settle");
  };
  await send("Input.dispatchKeyEvent",{type:"keyDown",code:"ArrowRight",key:"ArrowRight",windowsVirtualKeyCode:39});
  await send("Input.dispatchKeyEvent",{type:"keyUp",code:"ArrowRight",key:"ArrowRight",windowsVirtualKeyCode:39});
  const viewportReports=[];
  for(const [width,height] of [[1536,707],[1920,1080],[1280,900],[390,844],[844,390]]) {
    const before=await js("JSON.stringify([document.querySelector('[data-mario]').dataset,document.querySelector('.game-score').textContent,document.querySelector('canvas').toDataURL()])");
    await resizeGame(width,height);
    assert.equal(await js("JSON.stringify([document.querySelector('[data-mario]').dataset,document.querySelector('.game-score').textContent,document.querySelector('canvas').toDataURL()])"),before,"resize preserves simulation and pause state");
    const report=await js(`(()=>{
      const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
      const canvas=rect('canvas'),stage=rect('.game-stage'),root=rect('.mario-page');
      const inside=r=>r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;
      const buttons=[...document.querySelectorAll('[data-control],.game-actions button')];
      const fit=Math.min(stage.width*240/256,stage.height);
      return {viewport:[innerWidth,innerHeight],canvas,stage,root,zoom:getComputedStyle(document.body).zoom,
        lives:inside(rect('[data-lives]'))&&document.querySelector('[data-lives]').checkVisibility()&&rect('.game-lives').height>=14&&getComputedStyle(document.querySelector('.game-lives')).clipPath==='none',
        focus:document.querySelector('canvas').matches(':focus-visible')&&getComputedStyle(document.querySelector('canvas')).outlineStyle==='solid'&&parseFloat(getComputedStyle(document.querySelector('canvas')).outlineOffset)<0,
        optimal:Math.abs(canvas.height-fit)<1,
        ratio:Math.abs(canvas.width*15/16-canvas.height)<.1,
        pixels:document.querySelector('canvas').width===256&&document.querySelector('canvas').height===240,
        viewportUsed:root.width>=innerWidth-24&&canvas.height>=Math.min((innerWidth-24)*15/16,innerHeight-(innerHeight<500?65:150)),
        contained:inside(canvas)&&inside(root)&&document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1,
        controls:buttons.every(e=>{const r=e.getBoundingClientRect();return inside(r)&&r.width>=44&&r.height>=44&&(r.right<=canvas.left||r.left>=canvas.right||r.top>=canvas.bottom||r.bottom<=canvas.top);})};
    })()`);
    viewportReports.push(report);
    console.log("VIEWPORT",JSON.stringify(report));
    for(const phase of ["playing","paused"]) {
      if(phase==="paused")await js("document.querySelector('[data-action=pause]').click()");
      await check("[...document.querySelectorAll('.game-actions button,[data-control]')].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&r.width>=44&&r.height>=44})",`${phase} controls reachable at ${width}×${height}`);
      if(process.env.MARIO_CAPTURE_DIR) {
        const shot=await send("Page.captureScreenshot",{format:"png"});
        await Bun.write(join(resolve(process.env.MARIO_CAPTURE_DIR),`${width}x${height}-${phase}.png`),Buffer.from(shot.data,"base64"));
      }
    }
    await js("document.querySelector('[data-action=start]').click();__advance(1)");
  }
  if(process.env.MARIO_CAPTURE_DIR)
    await Bun.write(join(resolve(process.env.MARIO_CAPTURE_DIR),"viewports.json"),JSON.stringify(viewportReports,null,2));
  for(const report of viewportReports) {
    for(const key of ["optimal","ratio","pixels","viewportUsed","contained","controls","lives","focus"])
      assert(report[key],`${key} at ${report.viewport.join("×")}: ${JSON.stringify(report)}`);
    console.log(`OK optimal canvas, viewport bounds and accessible controls at ${report.viewport.join("×")}`);
  }
  for(const [name,trace,score,coins] of [["main",mainTrace,19750,2],["pipe",pipeTrace,21700,19]] as const) {
    await js("document.querySelector('[data-action=restart]').click();__bits=0;__advance(1)");
    let underground=false,returned=false;
    for(const [frames,bits] of trace) {
      const area=await js(`__keys(${bits});__ticks(${frames});__clock.background==='#000000'`);
      if(area)underground=true;else if(underground)returned=true;
    }
    await check("document.querySelector('[data-mario]').dataset.status === 'won'",`${name} continuous real-route playthrough reaches won`);
    await check(`+document.querySelector('[data-score]').textContent===${score} && +document.querySelector('[data-coins]').textContent===${coins} && +document.querySelector('[data-lives]').textContent===3`,`${name} fullplay score, coins and lives match input evidence`);
    if(name==="pipe")assert(underground&&returned,"bonus room entered and exited");
  }
  if(process.env.MARIO_CAPTURE_DIR) {
    const directory=resolve(process.env.MARIO_CAPTURE_DIR);
    await js("document.querySelector('[data-action=restart]').click();__bits=0;__advance(1);__keys(18);__ticks(115);__keys(26);__ticks(20);__keys(0)");
    const png=await js(`(()=>{const out=document.createElement('canvas');out.width=1200;out.height=675;
      const ctx=out.getContext('2d');ctx.fillStyle='#070a10';ctx.fillRect(0,0,1200,675);
      ctx.imageSmoothingEnabled=false;ctx.drawImage(document.querySelector('canvas'),344,97,512,480);
      return out.toDataURL('image/png').split(',')[1];})()`);
    await Bun.write(join(directory,"mario.png"),Buffer.from(png,"base64"));
    for(const [width,height,name] of [[390,844,"portrait"],[844,390,"landscape"],[1280,900,"desktop"]] as const) {
      await resizeGame(width,height);
      const shot=await send("Page.captureScreenshot",{format:"png"});
      await Bun.write(join(directory,`mario-${name}.png`),Buffer.from(shot.data,"base64"));
    }
    console.log("CAPTURES",directory);
  }
  await js("window.__oldAudio=__clock.audio[0];document.querySelector('header a').click()");
  await wait("location.pathname === '/Bio/' && !document.querySelector('[data-mario]')");
  await wait("__oldAudio.state === 'closed'");
  await js(`document.querySelector('a[href="/Bio/games/mario/"]').closest(".flagship").scrollIntoView()`);
  await wait(`document.querySelector('img[src="/Bio/assets/img/mario.png"]')?.naturalWidth === 1200`);
  await check(`document.querySelectorAll('a[href="/Bio/games/mario/"]').length === 1 && document.querySelector('img[src="/Bio/assets/img/mario.png"]').naturalHeight === 675`, "one Mario card with the gameplay screenshot");
  const oldDraws=await js("__clock.draws");
  await js("__advance(20)");
  assert.equal(await js("__clock.draws"),oldDraws,"unmounted Mario stops drawing");
  await js("document.querySelector('a[href=\"/Bio/games/mario/\"]').click()");
  await wait("document.querySelector('[data-mario]')?.dataset.status === 'ready'");
  await click("[data-action=start]");
  await wait("__clock.audio.length===2 && __clock.audio[1].state==='running'");
  console.log("OK navigation destroys audio and drawing; client remount creates one fresh game");
  await send("Page.navigate",{url:origin+"/fixture"});
  await wait("!!window.__api && !!window.__game");
  await js(`
    window.__key=(code,type='keydown',extra={})=>{const e=new KeyboardEvent(type,{code,bubbles:true,cancelable:true,...extra});document.activeElement.dispatchEvent(e);return e.defaultPrevented;};
    window.__pointer=(control,type,id)=>document.querySelector('[data-control='+control+']').dispatchEvent(new PointerEvent(type,{pointerId:id,button:0,bubbles:true,cancelable:true}));
    window.__reset=()=>{__keys(0);__api.restart();__advance(1);};
  `);
  await js("__reset();__key('ArrowRight');window.__snapshot=JSON.stringify(__game);document.querySelector('canvas').parentElement.style.cssText='width:613px;height:577px'");
  await wait("Math.abs(document.querySelector('canvas').getBoundingClientRect().width-613)<.1");
  await check("JSON.stringify(__game)===__snapshot && !__state.paused","resize alone does not advance or pause the simulation");
  await js("__advance(8)");
  await check("__game.player.x>40","held keyboard direction survives resize");
  await js("__key('ArrowRight','keyup');__api.togglePause();window.__snapshot=JSON.stringify(__game);document.querySelector('canvas').parentElement.style.cssText='width:768px;height:720px'");
  await wait("document.querySelector('canvas').getBoundingClientRect().width===768");
  await js("__advance(30)");
  await check("__state.paused && JSON.stringify(__game)===__snapshot","resize preserves paused game and timer");
  await js("__reset();__key('ArrowRight');__advance(10);window.__frame=__game.frame;__advance(1,5000)");
  await check("__game.frame-__frame===5","frame stall advances at most five ticks");
  await js("__reset();__key('KeyD');__advance(8);__key('KeyP');window.__frame=__game.frame;__advance(100)");
  await check("__state.paused && __game.frame===__frame","pause freezes simulation");
  await js("__key('KeyP','keyup');__key('Enter');__advance(1);__advance(20)");
  await check("__game.player.x<65","pause clears held direction before resume");
  await js("__reset();__key('ArrowRight');__advance(4);window.dispatchEvent(new Event('blur'));window.__frame=__game.frame;__advance(60)");
  await check("__state.paused && __game.frame===__frame","window blur auto-pauses");
  await js("__key('ArrowRight','keyup');__api.start();__advance(1);__advance(20)");
  await check("__game.player.x<52","blur releases held keys");
  await js("__reset();__key('KeyD');Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));window.__frame=__game.frame;__advance(300);__key('KeyD','keyup')");
  await check("__state.paused && __game.frame===__frame","hidden page has no simulation or timer progress");
  await js("Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));__api.start();__advance(1);__advance(20)");
  await check("__game.player.x===40","keyup while hidden leaves no stuck movement or catchup");
  await js("__reset();document.querySelector('a').focus();window.__prevented=__key('ArrowRight');__advance(20)");
  await check("!__prevented && __game.player.x===40","keyboard outside game is not hijacked");
  await js("__reset();document.querySelector('input').focus();window.__prevented=__key('KeyD');__advance(10)");
  await check("!__prevented && __game.player.x===40","text input keeps its keys");
  await js("__reset();window.__prevented=__key('KeyD','keydown',{ctrlKey:true});__advance(10)");
  await check("!__prevented && __game.player.x===40","modified shortcuts are untouched");
  await js("__reset();document.querySelector('[data-control=jump]').focus();__key('Space');__advance(8)");
  await check("__game.player.y<180","focused native jump button activates with Space");
  await js("__key('Space','keyup');__advance(50)");
  await check("__game.player.grounded","native jump button release does not auto-repeat jump");
  await js("__reset();document.querySelector('[data-control=right]').focus();__key('Enter');__advance(8);__key('Enter','keyup');__advance(20)");
  await check("__game.player.x>40 && __game.player.vx===0","focused native direction button supports Enter hold/release");
  await js("__reset();document.querySelector('[data-action=pause]').focus()");
  await send("Input.dispatchKeyEvent",{type:"keyDown",code:"Space",key:" ",windowsVirtualKeyCode:32});
  await send("Input.dispatchKeyEvent",{type:"keyUp",code:"Space",key:" ",windowsVirtualKeyCode:32});
  await js("__advance(5)");
  await check("__state.paused && __game.player.y===192 && __game.frame===0","Space on pause button pauses once without jumping");
  await js("__reset();document.querySelector('[data-action=mute]').click()");
  await check("__state.muted && document.querySelector('[data-action=mute]').textContent==='Unmute'","mute state and label agree");
  await js("document.querySelector('[data-action=mute]').click()");
  await check("!__state.muted && document.querySelector('[data-action=mute]').textContent==='Mute'","unmute restores state and label");
  await send("Emulation.setDeviceMetricsOverride",{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  const point=async(control:string)=>js(`(()=>{const r=document.querySelector('[data-control=${control}]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await js("__reset();__key('ArrowRight')");
  const right=await point("right"),jump=await point("jump");
  await send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{...right,id:1},{...jump,id:2}]});
  await js("__advance(8)");
  await check("__game.player.x>40 && __game.player.y<192","simultaneous native touch moves and jumps");
  await send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[{...right,id:1}]});
  await js("__advance(5)");
  await check("__game.player.vx>0","releasing jump keeps direction active");
  await send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await js("__advance(10)");
  await check("__game.player.vx>0","touch release preserves independent held keyboard source");
  await js("__key('ArrowRight','keyup');__advance(80)");
  await check("__game.player.vx===0","all sources released stops movement");
  await js("__reset()");
  await send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{...right,id:3}]});
  await js("__key('KeyD');__key('KeyD','keyup');__advance(8)");
  await check("__game.player.x>40","keyboard release preserves independent touch source");
  await send("Input.dispatchTouchEvent",{type:"touchCancel",touchPoints:[]});
  await js("__advance(30)");
  await check("__game.player.vx===0 && !document.querySelector('[data-held]')","pointercancel clears held touch");
  await js("window.__got=0;document.querySelector('[data-control=right]').addEventListener('gotpointercapture',()=>__got++);document.querySelector('[data-control=right]').addEventListener('pointerdown',e=>window.__captureId=e.pointerId,{once:true})");
  await send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{...right,id:4}]});
  await send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:right.x+1,y:right.y,id:4}]});
  await wait("__got===1 && document.querySelector('[data-control=right]').hasPointerCapture(__captureId)");
  await js("window.__lost=0;document.querySelector('[data-control=right]').addEventListener('lostpointercapture',()=>__lost++);document.querySelector('[data-control=right]').releasePointerCapture(__captureId)");
  await send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:right.x+2,y:right.y,id:4}]});
  await wait("__lost===1");
  await js("__advance(20)");
  await check("__game.player.vx===0 && !document.querySelector('[data-held]')","lost capture clears control before physical release");
  await send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await js("__reset();window.__announcements=0;window.__observer=new MutationObserver(()=>__announcements++);__observer.observe(document.querySelector('[data-announcement]'),{subtree:true,childList:true,characterData:true});__advance(120)");
  await check("__announcements===0","live region does not announce timer ticks");
  await js("__observer.disconnect();__reset();__keys(18);__advance(140);__keys(0)");
  await check("__game.status==='dying' || __game.lives<3","ordinary enemy collision starts death");
  await js("__advance(130)");
  await check("__game.lives===2 && __game.area==='overworld'","death respawns with one life removed");
  await js("__api.destroy();window.__frame=__game.frame;window.__draws=__clock.draws;__advance(50);document.querySelector('[data-action=restart]').click();");
  await check("__clock.draws===__draws && __clock.callbacks.size===0 && __game.frame===__frame","destroy removes RAF and action listeners");
  await js("__mount();document.querySelector('[data-action=start]').click();__advance(1);__advance(10)");
  await check("__game.frame===10 && __clock.callbacks.size===1","remount owns exactly one simulation loop");
  await js("__api.destroy()");
  }
  if(audioOnly)await send("Page.addScriptToEvaluateOnNewDocument",{source:clock});
  await send("Page.navigate",{url:origin+"/fixture"});
  await wait("!!window.__api && !!window.__createAudio");
  const audioReport=await js(`(async()=>{
    const checks=[],measurements=[];
    const verify=(ok,label)=>checks.push({label,ok:!!ok});
    const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const until=async predicate=>{
      for(let i=0;i<300;i++){if(predicate())return;await delay(20);}
      throw Error('Audio lifecycle wait timed out');
    };
    const silent=context=>{
      const samples=new Float32Array(context.analyser.fftSize);
      context.analyser.getFloatTimeDomainData(samples);
      return samples.every(value=>Math.abs(value)<.0001);
    };
    const cancelled=(voices,now)=>voices.every(v=>v.stops[0]<=now ||
      (v.stops.length===2 && v.stops[1]<=now && v.disconnected));
    verify(__clock.audio.length===0,'audio fixture stays lazy before gesture');
    __api.destroy();
    const beginDeath=async(lives=3)=>{
      __mount();
      document.querySelector('[data-action=start]').click();
      await until(()=>__clock.audio.at(-1)?.state==='running');
      const context=__clock.audio.at(-1);
      __liveGame.lives=lives;__liveGame.time=1;__liveGame.timerTicks=23;
      __advance(2);
      verify(__game.status==='dying','runtime timer expiry enters death');
      await context.suspend();
      return {context,voices:context.voices.slice(),origin:context.voices[0].start};
    };

    let run=await beginDeath();
    verify(run.voices.length===21,'death schedules all 21 notes without future sync');
    measurements.push({scenario:'death',notes:run.voices.length,
      lastStart:Math.max(...run.voices.map(v=>v.start))-run.origin,
      lastStop:Math.max(...run.voices.map(v=>v.stops[0]))-run.origin});
    // Hold native audio time while advancing synthetic RAF, independent of host rendering speed.
    __advance(119);
    verify(__game.status==='dying','death lasts the first 119 engine ticks');
    await run.context.resume();__advance(1);
    verify(__game.status==='playing' && __game.lives===2,'automatic respawn keeps engine death lifetime');
    verify(run.voices.every(v=>v.stops.length===1),'automatic respawn never cancels death voices');
    verify(run.context.voices.length===21,'background waits while death tail is pending');
    await until(()=>run.context.currentTime>run.origin+3.2 && run.voices.every(v=>v.ended));
    __advance(2);
    verify(run.voices.length===21 && run.voices.every(v=>v.ended && v.stops.length===1),
      'respawn death cue reaches every natural node ending');
    verify(run.context.voices.length>21,'background resumes after death cue');
    __api.destroy();

    run=await beginDeath(1);
    __advance(119);
    verify(__game.status==='dying','last life remains dying before the final tick');
    await run.context.resume();__advance(1);
    const finalFrame=__game.frame;
    verify(__game.status==='gameover','last life reaches gameover with running audio');
    await until(()=>run.context.currentTime>run.origin+3.2 && run.voices.every(v=>v.ended));
    __advance(30);
    verify(__game.frame===finalFrame,'gameover stops simulation steps');
    verify(run.context.voices.length===21 && run.voices.every(v=>v.ended && v.stops.length===1),
      'gameover completes all death notes without further steps');
    __api.destroy();

    for(const action of ['pause','mute','restart','playagain','destroy','gameover-blur']) {
      run=await beginDeath(action==='playagain'||action==='gameover-blur'?1:3);
      if(action==='playagain'||action==='gameover-blur')__advance(120);
      await run.context.resume();
      await until(()=>!silent(run.context));
      verify(run.voices.some(v=>v.start>run.context.currentTime),action+' starts with future death notes pending');
      if(action==='pause')__api.togglePause();
      if(action==='mute')__api.toggleMute();
      if(action==='restart')__api.restart();
      if(action==='playagain')__api.start();
      if(action==='destroy')__api.destroy();
      if(action==='gameover-blur')window.dispatchEvent(new Event('blur'));
      verify(cancelled(run.voices,run.context.currentTime),action+' immediately stops and disconnects every pending death node');
      const count=run.context.voices.length;
      await delay(180);
      verify(run.context.voices.length===count && (action==='destroy'?run.context.state==='closed':silent(run.context)),
        action+' has no tail or autonomous resurrection');
      if(action==='pause')__api.start();
      if(action==='mute')__api.toggleMute();
      if(action==='pause'||action==='mute') {
        __advance(2);
        verify(run.context.voices.length===count,action+' resume does not replay the interrupted death');
      }
      __api.destroy();
    }

    run=await beginDeath();
    await run.context.resume();
    __api.toggleMute();
    const beforeSecondDeath=run.context.voices.length;
    __advance(120);
    verify(__game.status==='playing' && __state.muted,'respawn advances while muted');
    __liveGame.time=1;__liveGame.timerTicks=23;__advance(1);
    verify(__game.status==='dying','second death starts while muted');
    verify(run.context.voices.length===beforeSecondDeath,'muted second death schedules no voices');
    __api.toggleMute();__advance(1);
    const secondDeath=run.context.voices.slice(beforeSecondDeath);
    verify(secondDeath.length===21,'unmute during a new death schedules its complete cue');
    measurements.push({scenario:'muted-respawn-second-death',notes:secondDeath.length});
    __advance(1);
    verify(run.context.voices.length===beforeSecondDeath+21,'second death cue is scheduled only once');
    __api.destroy();

    const audio=__createAudio(),game={status:'dying',frame:1,area:'overworld',time:300,
      player:{invincible:0},events:[{type:'death'}]};
    audio.sync(game);await audio.unlock();
    const context=__clock.audio.at(-1),count=context.voices.length;
    audio.sync(game);audio.sync(game);
    verify(context.voices.length===count && count===21,'identical death snapshot never duplicates cue');
    audio.stop();audio.sync(game);
    verify(context.voices.length===count,'stopped identical death snapshot does not replay');
    audio.destroy();

    const Native=window.AudioContext;
    for(const action of ['stop','mute','destroy']) {
      const context=new Native();
      let release;
      window.AudioContext=function(){return new Proxy(context,{get(target,key){
        if(key==='state')return target.state==='closed'?'closed':'suspended';
        if(key==='resume')return async()=>{
          await target.resume();
          await new Promise(resolve=>release=resolve);
        };
        const value=Reflect.get(target,key,target);
        return typeof value==='function'?value.bind(target):value;
      }});};
      const audio=__createAudio();
      audio.sync({...game});
      const pending=audio.unlock();
      await until(()=>!!release);
      if(action==='mute')audio.setMuted(true);else audio[action]();
      release();const unlocked=await pending;
      verify(context.voices.length===0 && (action!=='destroy'||unlocked===false),
        action+' during pending unlock cannot resurrect audio');
      audio.destroy();window.AudioContext=Native;
    }
    return {checks,measurements};
  })()`,true);
  for(const {label,ok} of audioReport.checks)console.log((ok?"OK ":"FAIL ")+label);
  console.log("AUDIO_LIFECYCLE",JSON.stringify(audioReport));
  assert(audioReport.checks.every((check:any)=>check.ok),"audio lifecycle regressions");
  assert.equal(errors.length,0,errors.join("\n"));
} finally {
  if(deadline)clearTimeout(deadline);
  socket?.close();chrome?.kill();if(chrome)await chrome.exited;
  server.stop(true);rmSync(temp,{recursive:true,force:true});
}
