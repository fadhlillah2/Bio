/**
 * Hero sky — one WebGL2 fragment shader behind the hero, driven by the look tokens.
 * No dependency. If WebGL2 or the shader is unavailable nothing is added: the CSS
 * orb and haze inside .sky stay exactly as they are. mountSky() returns a cleanup.
 */

// clip-space triangle from gl_VertexID: no buffer, no attribute
var VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID & 1) << 2), float((gl_VertexID & 2) << 1)) - 1.0;
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

var FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform vec2 uRes;      // backing-store pixels
uniform float uTime;    // seconds since mount (0 under reduced motion)
uniform vec3 uLook;     // morning, dusk, night weights — sum to 1
uniform vec2 uPointer;  // -1..1, y up
uniform float uScroll;  // 0..1 of the hero scrolled past
uniform vec4 uShelter, uShelter2; // lede and proof-strip rects in uv, y up: x0 y0 x1 y1
uniform vec2 uFeather;            // shelter fades (lede, strip), backing pixels
uniform vec3 uBg, uSkyA, uSkyB;
uniform float uSeed;

float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
// value-noise fbm, rotated per octave so the lattice never shows
float fbm(vec2 p, int n) {
  float v = 0.0, a = 0.5;
  mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    if (i >= n) break;
    v += a * vnoise(p);
    p = R * p * 2.07 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}
float sdRect(vec2 p, vec4 r) {
  vec2 d = abs(p - (r.xy + r.zw) * 0.5) - (r.zw - r.xy) * 0.5;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
// one cumulus deck: x = density, y = lit factor (faces toward the light are bright)
vec2 deck(vec2 p, vec2 lightDir, float th) {
  p += (vec2(fbm(p * 1.3 + 3.0, 3), fbm(p * 1.3 + 17.0, 3)) - 0.5) * 0.35;
  float base = fbm(p, 5);
  float billow = 1.0 - abs(2.0 * fbm(p * 3.1 + 9.0, 3) - 1.0);
  float field = base + 0.12 * billow - 0.06;
  float dens = smoothstep(th, th + 0.18, field);
  float toward = fbm(p + lightDir * 0.05, 5) - base;
  float lit = 1.0 - smoothstep(-0.06, 0.06, toward);
  return vec2(dens, lit);
}

void main() {
  vec2 uv = vUv;
  vec2 ar = vec2(uRes.x / uRes.y, 1.0);
  float wM = uLook.x, wD = uLook.y, wN = uLook.z;

  // atmosphere: horizon colour low, zenith colour high
  vec3 zenith = mix(uSkyA, uSkyA * vec3(0.76, 0.87, 1.02), wM);
  vec3 col = mix(uSkyB, zenith, smoothstep(0.0, 0.85, uv.y));

  // one camera for every layer: content slides against the pointer and lags the scroll,
  // each layer by its depth (stars 0.15, light 0.45, far deck 0.7, near deck 1.4)
  vec2 cam = uPointer * vec2(0.06, 0.045) + vec2(0.0, uScroll * 0.25);
  // the light — morning sun high, dusk sun on the horizon, night moon
  vec2 lightPos = vec2(0.80, 0.90) * wM + vec2(0.93, 0.30) * wD + vec2(0.80, 0.91) * wN - cam * 0.45;
  vec2 rel = (uv - lightPos) * ar;
  float dl = length(rel);
  vec3 sun = vec3(1.0, 0.94, 0.78) * (1.0 - smoothstep(0.036, 0.050, dl)) * 1.3
           + vec3(1.0, 0.90, 0.70) * (exp(-dl * dl * 300.0) * 0.35 + exp(-dl * 9.0) * 0.05);
  vec3 dsun = vec3(1.0, 0.58, 0.34) * (1.0 - smoothstep(0.105, 0.125, dl)) * 1.2
            + vec3(1.0, 0.45, 0.25) * (exp(-dl * dl * 5.0) * 0.75 + exp(-dl * 1.8) * 0.22);
  float discN = 1.0 - smoothstep(0.050, 0.056, dl);
  float bite = smoothstep(0.050, 0.058, length(rel - vec2(0.024, 0.014)));
  float mare = 0.35 * smoothstep(0.45, 0.70, fbm(rel * 38.0 + 3.0, 3));
  vec3 moon = vec3(0.93, 0.91, 0.85) * (1.0 - mare) * discN * bite
            + vec3(0.55, 0.65, 0.90) * exp(-dl * dl * 55.0) * 0.22;
  col += sun * wM + dsun * wD + moon * wN;

  // stars (night): one candidate per cell, few survive, they scintillate rather than blink
  vec2 sp = (uv + cam * 0.15) * ar * 95.0 + uSeed;
  vec2 c = floor(sp), f = fract(sp) - 0.5;
  float hs = hash21(c);
  vec2 o = vec2(hash21(c + 7.3), hash21(c + 13.9)) - 0.5;
  float mag = fract(hs * 41.7);
  float rad = 0.06 + 0.09 * mag * mag;
  float star = (1.0 - smoothstep(rad * 0.25, rad, length(f - o * 0.7))) * step(0.93, hs)
             * (0.25 + 0.75 * mag * mag) * (0.85 + 0.15 * sin(uTime * (0.8 + 1.2 * hs) + hs * 80.0));
  star *= smoothstep(0.0, 0.3, uv.y) * smoothstep(0.05, 0.25, dl);
  col += vec3(0.8, 0.86, 1.0) * star * wN;

  // clouds: a fine far deck under a bigger near deck, each drifting and parallaxing at its own rate
  float cover = 0.32 * wM + 0.50 * wD + 0.30 * wN;
  float th = 0.66 - cover * 0.32;
  vec2 lightDir = normalize((lightPos - uv) * ar + 1e-4);
  vec2 qFar = (uv + cam * 0.7 - 0.5) * ar + uSeed * 0.37;
  vec2 qNear = (uv + cam * 1.4 - 0.5) * ar + uSeed * 0.37;
  vec2 drift = vec2(uTime * 0.02, uTime * 0.004);
  vec3 litC = vec3(0.97, 0.98, 1.0) * wM + vec3(1.0, 0.72, 0.55) * wD + vec3(0.30, 0.34, 0.44) * wN;
  vec3 shdC = vec3(0.64, 0.71, 0.83) * wM + vec3(0.42, 0.27, 0.44) * wD + vec3(0.07, 0.09, 0.15) * wN;
  float alpha = 0.92 * wM + 0.88 * wD + 0.70 * wN;
  vec2 far = deck(qFar * 2.3 + drift, lightDir, th + 0.04);
  vec2 near = deck(qNear * 1.35 + drift * 2.2 + 11.0, lightDir, th);
  col = mix(col, mix(shdC, litC, far.y) * 0.92, far.x * alpha * 0.85);
  col = mix(col, mix(shdC, litC, near.y), near.x * alpha);

  // vignette, then the shelter: the words sit on the look's own background
  vec2 v = uv - 0.5;
  col *= 1.0 - smoothstep(0.35, 0.9, dot(v, v) * 2.0) * 0.12;
  float s = max(1.0 - smoothstep(0.0, uFeather.x, sdRect(uv * uRes, uShelter * uRes.xyxy)),
                1.0 - smoothstep(0.0, uFeather.y, sdRect(uv * uRes, uShelter2 * uRes.xyxy)));
  col = mix(col, uBg, s);

  // dither against banding on the big gradients
  col += (hash21(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

var UNIFORMS = ['uRes', 'uTime', 'uLook', 'uPointer', 'uScroll', 'uShelter', 'uShelter2', 'uFeather', 'uBg', 'uSkyA', 'uSkyB', 'uSeed'];
var NIGHT_A = [0.020, 0.027, 0.047]; // #05070c
var NIGHT_B = [0.078, 0.110, 0.173]; // #141c2c
var TWEEN_MS = 600;
// one layout of clouds and stars per page load, so client-side navigation comes back to the same sky
var SEED = Math.random() * 100;

function compile(gl, type, src) {
  var sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader compile failed');
  return sh;
}

function build(gl) {
  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'program link failed');
  return prog;
}

// "#rrggbb" token → [r, g, b] in 0..1; anything else → fallback (night has no --sky-* tokens)
function rgb(name, fallback) {
  var m = /^#([0-9a-f]{6})$/i.exec(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
  if (!m) return fallback;
  var n = parseInt(m[1], 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

function palette() {
  var look = document.documentElement.getAttribute('data-look');
  return {
    w: look === 'morning' ? [1, 0, 0] : look === 'dusk' ? [0, 1, 0] : [0, 0, 1],
    bg: rgb('--ink-0', [0.027, 0.039, 0.063]),
    a: rgb('--sky-a', NIGHT_A),
    b: rgb('--sky-b', NIGHT_B)
  };
}

function lerp3(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function mountSky(hero) {
  var host = hero.querySelector('.sky');
  var lede = hero.querySelector('.hero-lede');
  var strip = hero.querySelector('.proof-strip');
  var fail = function (kind, msg) {
    hero.setAttribute('data-sky', kind);
    if (msg) hero.setAttribute('data-sky-error', String(msg).slice(0, 200));
    return function () { hero.removeAttribute('data-sky'); hero.removeAttribute('data-sky-error'); };
  };
  if (!host || !lede) return fail('error', 'missing .sky or .hero-lede');
  if (!window.WebGL2RenderingContext) return fail('nogl');

  var canvas = document.createElement('canvas');
  canvas.className = 'sky-gl';
  canvas.setAttribute('aria-hidden', 'true');
  var gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return fail('nogl');
  var prog;
  try { prog = build(gl); } catch (e) { return fail('error', e.message); }
  gl.useProgram(prog);
  gl.bindVertexArray(gl.createVertexArray()); // WebGL2 needs a VAO bound even with no attributes
  var u = {};
  UNIFORMS.forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var start = performance.now();
  var from = palette(), to = from, tweenAt = 0;
  var target = [0, 0], cur = [0, 0], lastMove = null;
  var shelter = [0, 0, 0, 0], shelter2 = [0, 0, 0, 0], feather = [1, 1], height = 1;
  var frame = 0, running = false, inView = false;

  var render = function (now) {
    var e = reduced ? 1 : Math.min(1, (now - tweenAt) / TWEEN_MS);
    e = e * e * (3 - 2 * e);
    if (lastMove) {
      var r = hero.getBoundingClientRect();
      target = [(lastMove.clientX - r.left) / r.width * 2 - 1, 1 - (lastMove.clientY - r.top) / r.height * 2];
      lastMove = null;
    }
    if (!reduced) { cur[0] += (target[0] - cur[0]) * 0.1; cur[1] += (target[1] - cur[1]) * 0.1; }
    var scroll = Math.min(1, Math.max(0, window.scrollY / height));
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform1f(u.uTime, reduced ? 0 : (now - start) / 1000);
    gl.uniform3fv(u.uLook, lerp3(from.w, to.w, e));
    gl.uniform2f(u.uPointer, cur[0], cur[1]);
    gl.uniform1f(u.uScroll, reduced ? 0 : scroll);
    gl.uniform4fv(u.uShelter, shelter);
    gl.uniform4fv(u.uShelter2, shelter2);
    gl.uniform2f(u.uFeather, feather[0], feather[1]);
    gl.uniform3fv(u.uBg, lerp3(from.bg, to.bg, e));
    gl.uniform3fv(u.uSkyA, lerp3(from.a, to.a, e));
    gl.uniform3fv(u.uSkyB, lerp3(from.b, to.b, e));
    gl.uniform1f(u.uSeed, SEED);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  var tick = function (now) {
    frame = 0;
    render(now);
    if (running) frame = window.requestAnimationFrame(tick);
  };
  var update = function () {
    var want = inView && document.visibilityState === 'visible' && !reduced;
    if (want && !running) { running = true; frame = window.requestAnimationFrame(tick); }
    if (!want && running) { running = false; if (frame) { window.cancelAnimationFrame(frame); frame = 0; } }
  };

  var resize = function () {
    var scale = window.innerWidth > 980 ? Math.min(window.devicePixelRatio || 1, 1.5) : 0.6;
    canvas.width = Math.max(1, Math.round(hero.clientWidth * scale));
    canvas.height = Math.max(1, Math.round(hero.clientHeight * scale));
    gl.viewport(0, 0, canvas.width, canvas.height);
    var hr = hero.getBoundingClientRect();
    if (!hr.width || !hr.height) return;
    height = hr.height;
    var rect = function (el) {
      if (!el) return [0, 0, 0, 0];
      var r = el.getBoundingClientRect();
      return [(r.left - hr.left) / hr.width, 1 - (r.bottom - hr.top) / hr.height, (r.right - hr.left) / hr.width, 1 - (r.top - hr.top) / hr.height];
    };
    shelter = rect(lede);
    shelter2 = rect(strip);
    feather = [(window.innerWidth > 980 ? 120 : 48) * scale, 48 * scale];
    // always draw: a resized (or fresh) alpha:false buffer composites as black until the first frame
    render(performance.now());
  };

  var onLook = function () {
    var now = performance.now();
    var e = reduced ? 1 : Math.min(1, (now - tweenAt) / TWEEN_MS);
    e = e * e * (3 - 2 * e);
    // start the new tween from wherever the old one is, so a quick double click never jumps
    from = { w: lerp3(from.w, to.w, e), bg: lerp3(from.bg, to.bg, e), a: lerp3(from.a, to.a, e), b: lerp3(from.b, to.b, e) };
    to = palette();
    tweenAt = now;
    if (reduced) { from = to; render(now); }
  };

  var onMove = function (e) { lastMove = e; };
  var onLeave = function () { lastMove = null; target = [0, 0]; };

  // first frame off-DOM: only a canvas that actually drew replaces the CSS sky
  resize();
  var err = gl.getError();
  if (err) {
    var lost = gl.getExtension('WEBGL_lose_context');
    if (lost) lost.loseContext();
    return fail('error', 'gl error 0x' + err.toString(16) + ' on first frame');
  }
  host.prepend(canvas);
  hero.classList.add('is-gl');
  hero.setAttribute('data-sky', 'gl');

  var ro = new ResizeObserver(resize);
  ro.observe(hero);
  ro.observe(lede);
  var mo = new MutationObserver(onLook);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-look'] });
  var io = new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; update(); });
  io.observe(hero);
  document.addEventListener('visibilitychange', update);
  if (fine && !reduced) {
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
  }

  return function cleanup() {
    running = false;
    if (frame) window.cancelAnimationFrame(frame);
    ro.disconnect();
    mo.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', update);
    hero.removeEventListener('pointermove', onMove);
    hero.removeEventListener('pointerleave', onLeave);
    var lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    canvas.remove();
    hero.classList.remove('is-gl');
    hero.removeAttribute('data-sky');
  };
}
