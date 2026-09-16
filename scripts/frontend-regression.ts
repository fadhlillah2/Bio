/** Print and mobile-menu regressions. Run: bun scripts/frontend-regression.ts (native Chrome required). */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { extractText } from "unpdf";
import { findChrome } from "../cv/build-pdf.ts";

const root = resolve(import.meta.dir, "..");
const chrome = findChrome();
if (chrome.toLowerCase().endsWith(".exe")) throw new Error("Frontend regression requires native Chrome; Windows Chrome via WSL is unsupported");
const temp = mkdtempSync(join(tmpdir(), "bio-frontend-check-"));
const failures: string[] = [];
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? "OK" : "FAIL"} ${label}`);
  if (!ok) failures.push(label);
};
try {
  const flags = ["--headless=new", "--disable-gpu", "--no-first-run", "--disable-background-networking",
    `--user-data-dir=${join(temp, "profile")}`];
  const run = (args: string[]) => execFileSync(chrome, [...flags, ...args], {
    encoding: "utf8", timeout: 30_000, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"]
  });
  // Real enhance() and DOM; only the media-query boundary is controlled to simulate resizing.
  const entry = join(temp, "menu.js");
  await Bun.write(entry, `
    import { enhance } from ${JSON.stringify(join(root, "src/lib/enhance.js"))};
    const results = [];
    const check = (ok, label) => results.push({ok, label});
    const mobile = new EventTarget(); mobile.matches = true;
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = q => q === '(max-width: 920px)' ? mobile : nativeMatchMedia(q);
    const toggle = document.querySelector('.nav-toggle');
    const link = document.querySelector('#site-nav a');
    const open = () => document.body.classList.contains('nav-open');
    const key = (key, shiftKey = false) => {
      const e = new KeyboardEvent('keydown', {key, shiftKey, bubbles: true, cancelable: true});
      document.dispatchEvent(e); return e.defaultPrevented;
    };
    const cleanup = enhance();
    toggle.click();
    check(open() && toggle.getAttribute('aria-expanded') === 'true', 'menu opens');
    link.focus(); check(key('Tab') && document.activeElement === toggle, 'mobile focus trap');
    key('Escape'); check(!open() && document.activeElement === toggle, 'Escape closes menu');
    toggle.click(); link.click(); check(!open(), 'section link closes menu');
    toggle.click(); mobile.matches = false;
    mobile.dispatchEvent(new MediaQueryListEvent('change', {matches: false}));
    check(!open() && toggle.getAttribute('aria-expanded') === 'false', 'desktop breakpoint closes menu');
    link.focus(); check(!key('Tab'), 'desktop Tab is not trapped');
    mobile.matches = true;
    mobile.dispatchEvent(new MediaQueryListEvent('change', {matches: true}));
    if (!open()) toggle.click();
    cleanup();
    check(!open() && toggle.getAttribute('aria-expanded') === 'false', 'route cleanup unlocks body');
    // A detached route must no longer receive changes from the persistent media query.
    toggle.setAttribute('aria-expanded', 'detached');
    mobile.dispatchEvent(new MediaQueryListEvent('change', {matches: false}));
    check(toggle.getAttribute('aria-expanded') === 'detached', 'cleanup removes media listener');
    document.querySelector('#site-nav').remove(); toggle.remove();
    const articleCleanup = enhance();
    check(!open(), 'article mounts without inherited scroll lock'); articleCleanup();
    const report = document.createElement('pre'); report.id = 'report';
    report.textContent = JSON.stringify(results); document.body.append(report);
  `);
  const bundled = await Bun.build({ entrypoints: [entry], target: "browser", format: "iife" });
  if (!bundled.success) throw new Error(String(bundled.logs));
  const menu = join(temp, "menu.html");
  await Bun.write(menu, `<body><button class="nav-toggle" aria-expanded="false">Menu</button>
    <nav id="site-nav"><a href="#target">Section</a></nav><section id="target"></section>
    <script>${await bundled.outputs[0].text()}</script></body>`);
  const dom = run(["--dump-dom", `file://${menu}`]);
  const report = /<pre id="report">(.*?)<\/pre>/.exec(dom)?.[1];
  if (!report) throw new Error("Browser menu probe did not finish");
  for (const result of JSON.parse(report)) check(result.ok, result.label);

  const css = await Bun.file(join(root, "static/assets/css/style.css")).text();
  // Hidden parent/children reproduce printing before scroll; revealed control catches fixture errors.
  for (const revealed of [false, true]) {
    const html = join(temp, "print.html"), pdf = join(temp, "print.pdf");
    await Bun.write(html, `<html class="js"><style>${css}</style><body><h1>PRINT_CONTROL</h1>
      <ul class="metrics ${revealed ? "is-in" : ""}" data-reveal data-reveal-children>
      <li class="metric">FACTS_SENTINEL</li></ul>
      <div class="stack-grid ${revealed ? "is-in" : ""}" data-reveal data-reveal-children>
      <div>SKILLS_SENTINEL</div></div></body></html>`);
    run(["--no-pdf-header-footer", `--print-to-pdf=${pdf}`, `file://${html}`]);
    const { text } = await extractText(await Bun.file(pdf).bytes(), { mergePages: true });
    check(["PRINT_CONTROL", "FACTS_SENTINEL", "SKILLS_SENTINEL"].every(s => text.includes(s)),
      `print includes grid children (${revealed ? "after" : "before"} scroll)`);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
if (failures.length) throw new Error(`${failures.length} frontend regression(s)`);
