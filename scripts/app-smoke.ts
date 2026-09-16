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
    pending.set(++id, { ok, fail }); socket!.send(JSON.stringify({ id, method, params }));
  });
  const js = async (expression: string) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = async (expression: string) => {
    for (let n = 0; n < 100; n++) { if (await js(expression)) return; await pause(); }
    throw new Error(`Timed out: ${expression}`);
  };
  const check = async (expression: string, label: string) => {
    assert(await js(expression), label); console.log(`OK ${label}`);
  };
  const viewport = (width: number) => send("Emulation.setDeviceMetricsOverride", { width, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Fetch.enable", { patterns: [{ urlPattern: "http://*" }, { urlPattern: "https://*" }] });
  await send("Page.enable");
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
  await send("Emulation.setEmulatedMedia", { media: "print" });
  await wait("[...document.querySelectorAll('[data-reveal-children] > *')].every(e => { if(getComputedStyle(e).transform !== 'none') return false; for(let p=e;p;p=p.parentElement) { const s=getComputedStyle(p); if(s.opacity !== '1' || s.visibility !== 'visible' || s.display === 'none') return false; } return true; })");
  console.log("OK all reveal children and ancestors visible in actual print styles");
  const pdf = await send("Page.printToPDF", { printBackground: true });
  const { text } = await extractText(new Uint8Array(Buffer.from(pdf.data, "base64")), { mergePages: true });
  // Individual labels avoid PDF column-order interleaving and CSS text-transform differences.
  const labels: string[] = await js("[...document.querySelectorAll('.metric-label, .stack-grid .tag-row li')].map(e=>e.textContent.trim()).filter(Boolean)");
  const normalize = (s: string) => s.toLowerCase().replace(/\s/g, "");
  assert(labels.length && labels.every(label => normalize(text).includes(normalize(label))), "facts and skills labels printed before scroll");
  console.log(`OK real home print contains ${labels.length} facts/skills labels`);
  await send("Emulation.setEmulatedMedia", { media: "screen" });
  const downloads: string[] = await js("[...new Set([...document.querySelectorAll('a[href]')].map(a=>a.href).filter(h=>h.includes('/cv/')))]");
  assert(downloads.length);
  for (const url of downloads) { assert(new URL(url).origin === origin); assert((await fetch(url)).ok, url); }
  console.log(`OK ${downloads.length} CV download URLs available`);
  await js("document.querySelector('.nav-toggle').click()");
  await check("document.body.classList.contains('nav-open')", "mobile menu opens");
  await wait("getComputedStyle(document.querySelector('#site-nav')).visibility === 'visible' && document.querySelector('.nav-toggle').getClientRects().length > 0");
  await js("document.querySelector('#site-nav li:last-child a').focus()");
  await check("document.activeElement === document.querySelector('#site-nav li:last-child a')", "last mobile link receives focus");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await check("document.activeElement.matches('.nav-toggle')", "real keyboard Tab wraps in mobile menu");
  await viewport(1280);
  await wait("!document.body.classList.contains('nav-open')");
  await check("document.querySelector('.nav-toggle').getAttribute('aria-expanded') === 'false'", "actual desktop resize closes menu");
  await js("document.querySelector('#site-nav li:last-child a').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
  await check("!document.activeElement.matches('.nav-toggle')", "desktop keyboard focus escapes menu");
  await js("window.__smokeFox = true; document.querySelector('a[href*=\"fox-asset-project-management\"]').click()");
  await wait("location.pathname.endsWith('fox-asset-project-management') && !!document.querySelector('.article h1')");
  await check("window.__smokeFox === true && document.documentElement.scrollWidth <= innerWidth", "FOX case uses client router and fits desktop viewport");
  await js("document.querySelector('.fab-contact').click()");
  await wait("location.pathname === '/Bio/' && location.hash === '#contact' && !!document.querySelector('.hero[data-sky]')");
  console.log("OK client-routed FOX footer reaches home contact section");
  await js("window.__smokeRoute = true; document.querySelector('a[href*=\"hybrid-retrieval\"]').click()");
  await wait("location.pathname.endsWith('hybrid-retrieval') && !!document.querySelector('.read-progress')");
  await check("window.__smokeRoute === true", "article navigation uses client router");
  await js("document.querySelector('.brand').click()");
  await wait("location.pathname === '/Bio/' && !!document.querySelector('.hero[data-sky]')");
  await viewport(390);
  await js("document.querySelector('.nav-toggle').click()");
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
  await check("document.activeElement === document.querySelectorAll('#site-nav a')[1]", "no-JS links reachable by keyboard Tab");
  await send("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await wait("location.hash === '#portfolio' && scrollY > 0");
  console.log("OK no-JS native Enter navigates to section anchor");
  for (const id of ["resume", "services"]) {
    await js(`document.querySelector('.hero a[href="#${id}"]').focus()`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", text: "\r", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await wait(`location.hash === '#${id}' && Math.abs(document.getElementById('${id}').getBoundingClientRect().top) < innerHeight`);
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
} finally {
  clearTimeout(deadline); socket?.close(); chrome?.kill(); if (chrome) await chrome.exited;
  server?.stop(true); rmSync(temp, { recursive: true, force: true });
}
