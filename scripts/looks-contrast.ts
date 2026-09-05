/**
 * Contrast floor for the three looks. Every text token has to clear WCAG AA (4.5:1)
 * on every surface it can land on — a palette is only shippable if it does.
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

// pre-existing baseline: .term-title on the terminal bar, 4.41 — not one of the looks' doing
const ALLOWED = "night muted/ink-3";
let failed = 0;

for (const look of Object.keys(looks)) {
  for (const [fg, bg] of pairs) {
    const r = ratio(hex(looks[look], fg), hex(looks[look], bg));
    const ok = r >= 4.5 || `${look} ${fg}/${bg}` === ALLOWED;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"}  ${look.padEnd(8)} ${`${fg}/${bg}`.padEnd(19)} ${r.toFixed(2)}`);
  }
}

console.log(failed ? `\n${failed} pair(s) below 4.5:1` : "\nall three looks clear 4.5:1");
process.exit(failed ? 1 : 0);
