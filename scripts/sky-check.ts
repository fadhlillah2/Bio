/**
 * Sky check: the built home page must mount the WebGL2 sky (hero[data-sky="gl"]).
 * Serves build/ under /Bio/ and dumps the DOM from Chrome headless on SwiftShader.
 * Run after `bun run build`: bun run check:sky
 */
import { resolve } from "node:path";
import { findChrome } from "../cv/build-pdf.ts";

const BUILD = resolve(import.meta.dir, "..", "build");

const server = Bun.serve({
  port: 0,
  async fetch(req) {
    let path = new URL(req.url).pathname.replace(/^\/Bio(?=\/|$)/, "") || "/";
    if (path.endsWith("/")) path += "index.html";
    const file = Bun.file(resolve(BUILD, "." + path));
    return (await file.exists()) ? new Response(file) : new Response("not found", { status: 404 });
  },
});

const proc = Bun.spawn([
  findChrome(), "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--no-first-run", "--hide-scrollbars", "--window-size=1366,768", "--virtual-time-budget=4000",
  "--dump-dom", `http://127.0.0.1:${server.port}/Bio/`,
], { stdout: "pipe", stderr: "ignore" });
const dom = await new Response(proc.stdout).text();
await proc.exited;
server.stop(true);

const sky = /data-sky="([^"]*)"/.exec(dom)?.[1];
const why = /data-sky-error="([^"]*)"/.exec(dom)?.[1];
if (sky === "gl") {
  console.log("OK   sky: WebGL2 mounted (hero[data-sky=gl])");
  process.exit(0);
}
console.error(sky
  ? `FAIL sky: hero[data-sky=${sky}]${why ? " — " + why : ""}`
  : "FAIL sky: hero has no data-sky — enhance() never ran in headless (check build/ exists and the page hydrates)");
if (sky === "nogl") console.error("     headless Chrome gave no WebGL2 context: SwiftShader flags rejected on this machine");
process.exit(1);
