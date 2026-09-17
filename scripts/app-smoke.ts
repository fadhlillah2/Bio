/** Real built-app smoke. Run: bun scripts/app-smoke.ts [build-directory]. Native Chrome required. */
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { findChrome } from "../cv/build-pdf.ts";
import { extractText } from "unpdf";

const build = resolve(process.argv[2] || "build");
assert(await Bun.file(join(build, "index.html")).exists(), "Build the app in an isolated copy first");
const chromePath = findChrome();
assert(!chromePath.toLowerCase().endsWith(".exe"), "App smoke requires native Chrome; Windows Chrome via WSL is unsupported");
const temp = mkdtempSync(join(tmpdir(), "bio-app-smoke-"));
let server: ReturnType<typeof Bun.serve> | undefined;
let chrome: ReturnType<typeof Bun.spawn> | undefined;
let socket: WebSocket | undefined;
let deadline: ReturnType<typeof setTimeout> | undefined;
const pause = () => Bun.sleep(50);
try {
  server = Bun.serve({ hostname: "127.0.0.1", port: 0, async fetch(req) {
    let path = decodeURIComponent(new URL(req.url).pathname).replace(/^\/Bio(?=\/|$)/, "") || "/";
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(build, "." + path);
    if (!file.startsWith(build + "/")) return new Response(null, { status: 403 });
    let body = Bun.file(file);
    if (!(await body.exists()) && !path.endsWith(".html")) body = Bun.file(file + ".html");
    return await body.exists() ? new Response(body) : new Response(null, { status: 404 });
  }});
  const origin = `http://127.0.0.1:${server.port}`;
  chrome = Bun.spawn([chromePath, "--headless=new", "--no-first-run", "--disable-background-networking",
    "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--remote-debugging-port=0",
    `--user-data-dir=${temp}`, "about:blank"], { stdout: "ignore", stderr: "ignore" });
  deadline = setTimeout(() => chrome?.kill(), 60_000);
  const portFile = join(temp, "DevToolsActivePort");
  let targets: any[] = [];
  for (let n = 0; n < 100 && !targets.length; n++) {
    try {
      const port = (await Bun.file(portFile).text()).split("\n")[0];
      if (/^\d+$/.test(port)) targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
    } catch { /* Chrome creates the file before the endpoint is ready. */ }
    if (!targets.length) await pause();
  }
  assert(targets.some(t => t.type === "page"), "Chrome debugging endpoint did not become ready");
  socket = new WebSocket(targets.find((t: any) => t.type === "page").webSocketDebuggerUrl);
  await new Promise<void>((ok, fail) => { socket!.onopen = () => ok(); socket!.onerror = fail; });
  let id = 0;
  const pending = new Map<number, { ok: (v: any) => void, fail: (e: any) => void }>();
  socket.onmessage = event => {
    const message = JSON.parse(String(event.data));
    if (message.method === "Fetch.requestPaused") {
      const allowed = new URL(message.params.request.url).origin === origin;
      socket!.send(JSON.stringify({ id: ++id, method: allowed ? "Fetch.continueRequest" : "Fetch.failRequest",
        params: { requestId: message.params.requestId, ...(allowed ? {} : { errorReason: "BlockedByClient" }) } }));
    }
    const waiter = pending.get(message.id);
    if (waiter) { pending.delete(message.id); message.error ? waiter.fail(message.error) : waiter.ok(message.result); }
  };
  socket.onclose = () => { for (const p of pending.values()) p.fail(new Error("Chrome disconnected")); pending.clear(); };
  const send = (method: string, params = {}): Promise<any> => new Promise((ok, fail) => {
    if (socket?.readyState !== WebSocket.OPEN) { fail(new Error("Chrome disconnected")); return; }
    pending.set(++id, { ok, fail }); socket.send(JSON.stringify({ id, method, params }));
  });
  const js = async (expression: string) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = async (expression: string) => {
    for (let n = 0; n < 100; n++) { if (await js(expression)) return; await pause(); }
    const state = await js(`JSON.stringify({width:innerWidth,height:innerHeight,print:matchMedia('print').matches,
      ready:document.readyState,fonts:document.fonts.status,timeline:document.timeline.currentTime,now:performance.now(),draws:window.__skyDraws,screenReady:window.__screenReady,offscreenReady:window.__offscreenReady,body:document.body.className,url:location.href,scrollY,
      visibility:document.visibilityState,focus:document.hasFocus(),scrollBehavior:getComputedStyle(document.documentElement).scrollBehavior,
      active:{tag:document.activeElement?.tagName,id:document.activeElement?.id,href:document.activeElement?.getAttribute('href')},
      sections:['resume','services'].map(id=>({id,top:document.getElementById(id)?.getBoundingClientRect().top})),
      aria:document.querySelector('.nav-toggle')?.getAttribute('aria-expanded'),
      nav:(()=>{const e=document.querySelector('#site-nav');if(!e)return null;const s=getComputedStyle(e);
        return {display:s.display,visibility:s.visibility,opacity:s.opacity,transform:s.transform,
          animations:e.getAnimations().map(a=>({pending:a.pending,state:a.playState,time:a.currentTime,start:a.startTime}))};})(),
      toggleRects:[...(document.querySelector('.nav-toggle')?.getClientRects()||[])].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}))})`);
    throw new Error(`Timed out: ${expression}\nState: ${state}`);
  };
  const check = async (expression: string, label: string) => {
    assert(await js(expression), label); console.log(`OK ${label}`);
  };
  const viewport = (width: number) => send("Emulation.setDeviceMetricsOverride", { width, height: 800, deviceScaleFactor: 1, mobile: false });
  const settleScroll = async () => {
    let previous = await js("scrollY"), stable = 0;
    for (let n = 0; n < 100; n++) {
      await pause();
      const current = await js("scrollY");
      stable = current === previous ? stable + 1 : 0;
      if (stable === 3) return;
      previous = current;
    }
    throw new Error("Scrolling did not settle before the next keyboard action");
  };
  const openMenu = async () => {
    await wait(`!matchMedia('print').matches && matchMedia('screen').matches && document.readyState === 'complete'
      && document.fonts.status === 'loaded' && (()=>{const e=document.querySelector('.nav-toggle');if(!e)return false;
        const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.visibility==='visible' && s.display!=='none'
          && r.width>0 && r.height>0 && r.top>=0 && r.bottom<=innerHeight;})()`);
    const point = await js("(()=>{const r=document.querySelector('.nav-toggle').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
    await send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
  };
  await send("Fetch.enable", { patterns: [{ urlPattern: "http://*" }, { urlPattern: "https://*" }] });
  await send("Page.enable");
  console.log("BROWSER", await send("Browser.getVersion"));
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `
    window.__skyDraws = 0;
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function(...args) {
      window.__skyDraws++; return draw.apply(this, args);
    };` });
  const motion = async (value: string) => {
    await js(`(()=>{
      const media = matchMedia('(prefers-reduced-motion: reduce)'), expected = ${value === "reduce"};
      window.__motionReady = false;
      const applied = () => {
        if (media.matches !== expected) return;
        media.removeEventListener('change', applied);
        requestAnimationFrame(() => { window.__motionReady = true; });
      };
      media.addEventListener('change', applied);
      applied();
    })()`);
    const media = await js("matchMedia('print').matches ? 'print' : 'screen'");
    await send("Emulation.setEmulatedMedia", { media, features: [{ name: "prefers-reduced-motion", value }] });
    await wait("window.__motionReady === true");
  };
  const printMedia = async (media: "print" | "screen") => {
    await js(`(()=>{
      const query=matchMedia('print'), expected=${media === "print"};
      window.__printReady=false;
      const applied=()=>{
        if(query.matches!==expected) return;
        query.removeEventListener('change',applied);
        requestAnimationFrame(()=>{window.__printReady=true});
      };
      query.addEventListener('change',applied); applied();
    })()`);
    const value = await js("matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference'");
    await send("Emulation.setEmulatedMedia", { media, features: [{ name: "prefers-reduced-motion", value }] });
    await wait("window.__printReady === true");
  };
  const stillSky = async (label: string) => {
    await Bun.sleep(300); // Allow initial layout/intersection redraws; media readiness is event-driven above.
    const before = await js("window.__skyDraws");
    await Bun.sleep(500);
    assert.equal(await js("window.__skyDraws"), before, label);
    console.log(`OK ${label}`);
  };
  const movingSky = async (label: string) => {
    const before = await js("window.__skyDraws");
    await wait(`window.__skyDraws >= ${before + 3}`);
    console.log(`OK ${label}`);
  };
  await viewport(390);
  await send("Page.navigate", { url: origin + "/Bio/writeups/fox-asset-project-management.html" });
  await wait("!!document.querySelector('.article h1')");
  await check("document.documentElement.scrollWidth <= innerWidth", "FOX case direct static route fits mobile viewport");
  const caseLinks: string[] = await js("[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>new URL(h).origin === location.origin))]");
  assert(caseLinks.length, "FOX case has internal navigation");
  for (const url of caseLinks) assert((await fetch(url)).ok, `FOX case link unavailable: ${url}`);
  console.log("OK FOX case internal links resolve");
  await send("Emulation.setEmulatedMedia", { media: "print" });
  await wait("[...document.querySelectorAll('.article h1,.article h2,.article p')].every(e=>{for(let p=e;p;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility!=='visible'||s.opacity!=='1')return false;}return true;})");
  console.log("OK FOX case content visible in print media");
  await send("Emulation.setEmulatedMedia", { media: "screen" });
  await js("document.querySelector('.fab-contact').click()");
  await wait("location.pathname === '/Bio/' && location.hash === '#contact' && !!document.querySelector('#contact')");
  console.log("OK FOX footer contact action reaches home contact section");
  await send("Page.navigate", { url: origin + "/Bio/writeups/hybrid-retrieval.html" });
  await wait("!!document.querySelector('.read-progress')");
  console.log("OK direct .html article route served");
  await send("Page.navigate", { url: origin + "/Bio/" });
  await wait("!!document.querySelector('.hero[data-sky]')");
  await check("innerWidth === 390 && scrollY === 0", "home hydrates at mobile viewport before scroll");
  await check("['resume','services'].every(id=>{const a=document.querySelector('.hero a[href=\"#'+id+'\"]'); return a && document.getElementById(id) && a.getBoundingClientRect().width>0;})", "both audience links have visible controls and existing destinations");
  const originalLook = await js("document.documentElement.getAttribute('data-look')");
  const luminance = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
    .reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
  const contrast = (a: string, b: string) => {
    const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
    return (values[0] + .05) / (values[1] + .05);
  };
  for (const look of ['night', 'morning', 'dusk']) {
    await js(`document.documentElement.setAttribute('data-look', '${look}')`);
    const tokens = [];
    for (const value of ['no-preference', 'more']) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-contrast', value }] });
      tokens.push(await js("Object.fromEntries(['text','muted','line','line-2','ink-0','ink-1','ink-2'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue('--'+k).trim()]))"));
    }
    for (const fg of ['text', 'muted']) for (const bg of ['ink-0', 'ink-1', 'ink-2']) {
      const before = contrast(tokens[0][fg], tokens[0][bg]), after = contrast(tokens[1][fg], tokens[1][bg]);
      assert(after > before && after >= 4.5, `${look} increased contrast: ${fg}/${bg}`);
    }
    for (const border of ['line', 'line-2']) assert(contrast(tokens[1][border], tokens[1]['ink-0']) > contrast(tokens[0][border], tokens[0]['ink-0']), `${look} increased border contrast`);
    console.log(`OK ${look} increased-contrast text and borders improve`);
  }
  await js(`document.documentElement.setAttribute('data-look', ${JSON.stringify(originalLook)})`);
  await send('Emulation.setEmulatedMedia', { features: [] });
  await printMedia("print");
  await wait("[...document.querySelectorAll('[data-reveal-children] > *')].every(e => { if(getComputedStyle(e).transform !== 'none') return false; for(let p=e;p;p=p.parentElement) { const s=getComputedStyle(p); if(s.opacity !== '1' || s.visibility !== 'visible' || s.display === 'none') return false; } return true; })");
  console.log("OK all reveal children and ancestors visible in actual print styles");
  const printDraws = await js("window.__skyDraws");
  const pdf = await send("Page.printToPDF", { printBackground: true });
  const { text } = await extractText(new Uint8Array(Buffer.from(pdf.data, "base64")), { mergePages: true });
  // Individual labels avoid PDF column-order interleaving and CSS text-transform differences.
  const labels: string[] = await js("[...document.querySelectorAll('.metric-label, .stack-grid .tag-row li')].map(e=>e.textContent.trim()).filter(Boolean)");
  const normalize = (s: string) => s.toLowerCase().replace(/\s/g, "");
  assert(labels.length && labels.every(label => normalize(text).includes(normalize(label))), "facts and skills labels printed before scroll");
  console.log(`OK real home print contains ${labels.length} facts/skills labels`);
  assert.equal(await js("window.__skyDraws"), printDraws, "print-hidden sky does not submit WebGL draws");
  console.log("OK print-hidden sky does not submit WebGL draws");
  await printMedia("screen");
  await movingSky("normal sky resumes after printing");
  await js("window.__screenReady=false; requestAnimationFrame(()=>requestAnimationFrame(()=>{window.__screenReady=true})); void 0");
  await wait("window.__screenReady === true");
  const downloads: string[] = await js("[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.includes('/cv/')))]");
  assert(downloads.length);
  for (const url of downloads) { assert(new URL(url).origin === origin); assert((await fetch(url)).ok, url); }
  console.log(`OK ${downloads.length} CV download URLs available`);
  await openMenu();
  await check("document.body.classList.contains('nav-open')", "mobile menu opens");
  // CSS visibility needs rendered frames; keep host polling for the deadline.
  await js(`(()=>{window.__menuVisible=false;const poll=()=>{
    window.__menuVisible=getComputedStyle(document.querySelector('#site-nav')).visibility === 'visible' && document.querySelector('.nav-toggle').getClientRects().length > 0;
    if(!window.__menuVisible) window.__menuFrame=requestAnimationFrame(poll);
  };poll();})()`);
  try {
    await wait("window.__menuVisible === true");
  } finally {
    await js("cancelAnimationFrame(window.__menuFrame)").catch(error=>console.error('Menu frame cleanup failed', error));
  }
  await js("document.querySelector('.nav-toggle').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await check("document.activeElement === document.querySelector('#site-nav a')", "real Tab enters mobile menu from toggle");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 });
  await check("document.activeElement.matches('.nav-toggle')", "real Shift Tab returns from first link to toggle");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: 8 });
  await check("document.activeElement === document.querySelector('#site-nav li:last-child a')", "real Shift Tab wraps to last mobile link");
  await js("document.querySelector('#site-nav li:last-child a').focus()");
  await check("document.activeElement === document.querySelector('#site-nav li:last-child a')", "last mobile link receives focus");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await check("document.activeElement.matches('.nav-toggle')", "real keyboard Tab wraps in mobile menu");
  await viewport(1280);
  await wait("!document.body.classList.contains('nav-open')");
  await check("document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'false'", "actual desktop resize closes menu");
  await js("document.querySelector('#site-nav li:last-child a').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await check("!document.activeElement.matches('.nav-toggle')", "desktop keyboard focus escapes menu");
  await motion("reduce");
  await printMedia("print");
  await send("Page.navigate", { url: origin + "/Bio/" });
  await wait("!!document.querySelector('.hero[data-sky]')");
  await check("document.querySelector('.hero').dataset.sky === 'gl'", "motion regression uses real WebGL");
  await check("window.__skyDraws === 0", "sky mounted in print does not draw");
  await viewport(390);
  await js("document.documentElement.setAttribute('data-look','morning')");
  await motion("no-preference"); await motion("reduce");
  await check("window.__skyDraws === 0", "print resize, look and motion changes do not draw");
  await printMedia("screen");
  await check("window.__skyDraws > 0", "reduced sky repaints after leaving initial print");
  await stillSky("sky initially reduced is static");
  await motion("no-preference");
  await movingSky("sky resumes when initial reduce changes to normal");
  await motion("reduce");
  await stillSky("sky stops when normal changes to reduce");
  await motion("no-preference");
  await movingSky("sky resumes after a second preference change");
  await js(`(()=>{
    window.__offscreenReady=false; window.__insideReady=false;
    const observer=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting) window.__insideReady=true;
      else if(window.__insideReady) {
        observer.disconnect(); requestAnimationFrame(()=>{window.__offscreenReady=true});
      }
    });
    observer.observe(document.querySelector('.hero'));
  })()`);
  await wait("window.__insideReady === true");
  await js("window.scrollTo({top:document.body.scrollHeight,behavior:'instant'})");
  await wait("window.__offscreenReady === true");
  const offscreenDraws = await js("window.__skyDraws");
  await Bun.sleep(500);
  assert.equal(await js("window.__skyDraws"), offscreenDraws, "offscreen sky stays paused");
  console.log("OK offscreen sky stays paused");
  await motion("reduce"); await motion("no-preference");
  await stillSky("offscreen preference changes do not restart sky");
  await printMedia("print"); await printMedia("screen");
  await stillSky("offscreen print changes do not restart sky");
  await js("window.scrollTo({top:0,behavior:'instant'})");
  await movingSky("visible sky resumes after scrolling back");
  await js("window.__smokeFox = true; document.querySelector('a[href*=\"fox-asset-project-management\"]').click()");
  await wait("location.pathname.endsWith('fox-asset-project-management') && !!document.querySelector('.article h1')");
  await check("window.__smokeFox === true && document.documentElement.scrollWidth <= innerWidth", "FOX case uses client router and fits desktop viewport");
  const unmountedDraws = await js("window.__skyDraws");
  await motion("reduce");
  await motion("no-preference"); await Bun.sleep(500);
  await printMedia("print"); await printMedia("screen");
  assert.equal(await js("window.__skyDraws"), unmountedDraws, "unmounted sky never redraws after preference changes");
  console.log("OK unmounted sky never redraws after preference changes");
  await js("document.querySelector('.fab-contact').click()");
  await wait("location.pathname === '/Bio/' && location.hash === '#contact' && !!document.querySelector('.hero[data-sky]')");
  console.log("OK client-routed FOX footer reaches home contact section");
  await js("window.__smokeRoute = true; document.querySelector('a[href*=\"hybrid-retrieval\"]').click()");
  await wait("location.pathname.endsWith('hybrid-retrieval') && !!document.querySelector('.read-progress')");
  await check("window.__smokeRoute === true", "article navigation uses client router");
  await js("document.querySelector('.brand').click()");
  await wait("location.pathname === '/Bio/' && !!document.querySelector('.hero[data-sky]')");
  await viewport(390);
  await openMenu();
  await check("document.body.classList.contains('nav-open')", "menu opens before history navigation");
  await js("history.back()");
  await wait("location.pathname.endsWith('hybrid-retrieval') && !!document.querySelector('.read-progress')");
  await check("window.__smokeRoute === true", "history navigation preserves app document");
  await check("!document.body.classList.contains('nav-open') && getComputedStyle(document.body).overflowY !== 'hidden'", "history to article cleans menu and scroll lock");
  await check("[...document.querySelectorAll('.article p a:not(.btn)')].every(a=>getComputedStyle(a).textDecorationLine.includes('underline'))", "article prose links are underlined");
  await js("document.querySelector('.article p a:not(.btn)').focus()");
  await check("document.activeElement.matches('.article p a:not(.btn)') && getComputedStyle(document.activeElement).textDecorationLine.includes('underline')", "focused prose link retains underline");
  await check("[...document.querySelectorAll('.article-nav .btn')].every(a=>!getComputedStyle(a).textDecorationLine.includes('underline'))", "article CTA styling preserved");
  await send("Emulation.setScriptExecutionDisabled", { value: true });
  await send("Page.navigate", { url: origin + "/Bio/" });
  await wait("!!document.querySelector('#site-nav') && !document.documentElement.classList.contains('js')");
  for (const width of [320, 390, 920]) {
    await viewport(width);
    await wait("document.documentElement.clientWidth <= innerWidth && getComputedStyle(document.querySelector('#site-nav')).visibility === 'visible'");
    await check("getComputedStyle(document.querySelector('.nav-toggle')).display === 'none' && [...document.querySelectorAll('#site-nav a')].every(a=>a.getBoundingClientRect().width > 0) && document.documentElement.scrollWidth <= innerWidth && document.querySelector('#site-nav').getBoundingClientRect().bottom <= document.querySelector('.hero').getBoundingClientRect().top", `no-JS navigation visible without overlap/overflow at ${width}px`);
  }
  await viewport(390);
  await js("document.querySelector('#site-nav a').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await check("document.activeElement === document.querySelectorAll('#site-nav a')[1]", "no-JS links reachable by keyboard Tab");
  await send("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await wait("location.hash === '#portfolio' && scrollY > 0");
  await settleScroll();
  console.log("OK no-JS native Enter navigates to section anchor");
  for (const id of ["resume", "services"]) {
    await js(`document.querySelector('.hero a[href="#${id}"]').focus()`);
    await settleScroll();
    await check(`document.activeElement === document.querySelector('.hero a[href="#${id}"]')`, `no-JS ${id} link receives focus before Enter`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await wait(`location.hash === '#${id}' && Math.abs(document.getElementById('${id}').getBoundingClientRect().top) < innerHeight`);
    await settleScroll();
    console.log(`OK no-JS audience link reaches ${id} with native Enter`);
  }
  await js("document.querySelector('.contact-prompts summary').focus()");
  await check("document.activeElement === document.querySelector('.contact-prompts summary')", "no-JS contact brief summary receives focus");
  await send("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await wait("document.querySelector('.contact-prompts details').open");
  await check("document.querySelector('.contact-prompts details').open", "no-JS contact brief opens with native Enter");
  await send("Page.navigate", { url: origin + "/Bio/writeups/fox-asset-project-management.html" });
  await wait("!!document.querySelector('.article h1') && !document.documentElement.classList.contains('js')");
  await check("document.querySelector('.article h1').getBoundingClientRect().width > 0 && getComputedStyle(document.querySelector('.article-head')).opacity === '1' && document.documentElement.scrollWidth <= innerWidth", "FOX case readable without JavaScript on mobile");
  const closed = new Promise<void>(ok => socket!.addEventListener("close", () => ok(), { once: true }));
  socket.close(); await closed;
  const closedResult = await Promise.race([
    send("Runtime.evaluate", { expression: "1" }).then(() => "resolved", () => "rejected"),
    Bun.sleep(250).then(() => "still pending")
  ]);
  assert.equal(closedResult, "rejected", "RPC after socket closure must reject without hanging cleanup");
  console.log("OK closed browser RPC rejects without hanging cleanup");
} finally {
  clearTimeout(deadline); socket?.close(); chrome?.kill(); if (chrome) await chrome.exited;
  server?.stop(true); rmSync(temp, { recursive: true, force: true });
}
