/**
 * Contrast floor for the three looks: 4.5:1 for tested pairs, except the accepted
 * night terminal-title baseline, which must not regress.
 * Run: bun scripts/looks-contrast.ts
 */
const css = await Bun.file(new URL("../static/assets/css/style.css", import.meta.url)).text();

const block = (selector: string): Record<string, string> => {
  const at = css.indexOf(selector + " {");
  if (at < 0) throw new Error("missing block: " + selector);
  const out: Record<string, string> = {};
  for (const m of css.slice(at, css.indexOf("}", at)).matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
};

const night = block(":root");
const looks: Record<string, Record<string, string>> = {
  morning: { ...night, ...block(':root[data-look="morning"]') },
  dusk: { ...night, ...block(':root[data-look="dusk"]') },
  night
};

const hex = (tokens: Record<string, string>, name: string): string => {
  const ref = /^var\(--([\w-]+)\)$/.exec(tokens[name]);
  return ref ? hex(tokens, ref[1]) : tokens[name];
};

const WEIGHT = [0.2126, 0.7152, 0.0722];
const luminance = (color: string): number => {
  const n = parseInt(color.slice(1), 16);
  return [16, 8, 0]
    .map((shift) => ((n >> shift) & 255) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * WEIGHT[i], 0);
};

const ratio = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const pairs: [string, string][] = [];
for (const fg of ["head", "bright", "text", "muted", "accent", "metric"]) {
  for (const bg of ["ink-0", "ink-1", "ink-2"]) pairs.push([fg, bg]);
}
pairs.push(["muted", "ink-3"], ["solid-ink", "solid"], ["solid-ink", "accent"]);

// Accepted .term-title baseline (~4.41): compare at full precision, not the rounded display.
const ALLOWED = "night muted/ink-3";
const BASELINE = ratio("#788394", "#161d29");
let failed = 0;

for (const look of Object.keys(looks)) {
  for (const [fg, bg] of pairs) {
    const r = ratio(hex(looks[look], fg), hex(looks[look], bg));
    const floor = `${look} ${fg}/${bg}` === ALLOWED ? BASELINE : 4.5;
    const ok = r >= floor;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"}  ${look.padEnd(8)} ${`${fg}/${bg}`.padEnd(19)} ${r.toFixed(2)}`);
  }
}

console.log(failed ? `\n${failed} pair(s) below their contrast floor` :
  `\nall tested pairs meet their floor (4.5:1; ${ALLOWED}: accepted baseline ${BASELINE.toFixed(2)}:1)`);
process.exit(failed ? 1 : 0);
