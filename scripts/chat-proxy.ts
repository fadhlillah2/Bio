/**
 * Local chat backend for the site widget: browser → this proxy → `opencode run`.
 *
 * This process runs on the author's machine next to `bun run dev`; the credentials stay inside
 * opencode (`~/.local/share/opencode/auth.json`) and are never sent to the browser. For a public
 * deployment use worker/chat.ts instead — it calls the provider API directly, with no opencode
 * CLI and no personal credential file on the host.
 *
 *   bun run chat                               # 127.0.0.1:4317, plan-covered model
 *   CHAT_MODEL=deepseek/deepseek-flash bun run chat   # ~3x faster, ~$0.0002 per answer
 *
 * The default costs nothing per answer: it runs on the existing GLM coding-plan credential and
 * opencode reports $0.00000 per run (deepseek/deepseek-flash reports ~$0.00019).
 *
 * Do NOT switch this to an `opencode/*-free` model: the zen gateway answers 403 "OpenCode's free
 * tier can only be used from within OpenCode" for any customised session, and this widget needs
 * the custom toolless bio-guide agent. Stock `opencode run` works, a custom agent does not, so
 * the free tier is not available here without handing visitor text to a shell-capable agent.
 * `opencode-go/deepseek-v4.1-flash` additionally needs an account opt-in (China-hosted).
 *
 * Every guard shared with the worker lives in scripts/chat-core.ts.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import {
  assertStrongSecret,
  buildPrompt,
  clampReply,
  importSigningKey,
  isDevConfig,
  needsToken,
  newNonce,
  normalizeTurns,
  numberEnv,
  originAllowed,
  resolveOrigins,
  signReply,
  tokenMatches,
  createDailyCap,
  createRateLimiter
} from './chat-core.ts';

/** The entire safety story: this agent has every tool disabled, so visitor text reaches no shell. */
export const AGENT = 'bio-guide';

export const agentFile = (repo: string) => `${repo}/.opencode/agent/${AGENT}.md`;

/**
 * opencode does NOT fail when `--agent` cannot be resolved. It prints this warning to stderr,
 * silently runs the default `build` agent — which has bash, edit and write — and still exits 0
 * with a normal answer on stdout. The warning is the only signal that the toolless boundary was
 * not in effect, so an answer carrying it is discarded rather than served.
 */
export function fellBackToDefaultAgent(stderr: string): boolean {
  return /falling back to default agent/i.test(stderr) ||
    new RegExp(`agent\\s+["']?${AGENT}["']?\\s+not found`, 'i').test(stderr);
}

/**
 * Resolved, never hardcoded: a pinned resume-v8.10.txt would be a versioned reference outside
 * every gate (cv-current-check only scans src/**\/*.svelte), so the next CV bump would break
 * startup with validate:ci still green. cv/ holds exactly one version per family by contract.
 */
export function currentResume(repo: string): string {
  const found = readdirSync(`${repo}/cv`).filter((name) => /^resume-v\d+\.\d+\.txt$/.test(name));
  if (found.length !== 1) throw new Error(`expected one current resume in cv/, found ${found.length}`);
  return `${repo}/cv/${found[0]}`;
}

/**
 * Facts the site publishes but the CV does not (Fineksi, freelance availability, the Kubernetes
 * tag), quoted from the rendered components so the wording can only be what the page ships. Every
 * anchor must match exactly once: a moved anchor throws, refusing startup rather than grounding
 * the bot on stale text. The worker bundle generator inlines this same output.
 */
export function siteFacts(repo: string): string {
  const read = (name: string) => readFileSync(`${repo}/src/lib/components/${name}`, 'utf8');
  const grab = (name: string, text: string, re: RegExp): string => {
    const found = [...text.matchAll(re)];
    if (found.length !== 1)
      throw new Error(`${name}: anchor ${re} matched ${found.length} times, expected exactly 1`);
    return found[0][1]!;
  };
  const anchorAt = (name: string, text: string, needle: string): number => {
    const hits = text.split(needle).length - 1;
    if (hits !== 1) throw new Error(`${name}: anchor ${needle} matched ${hits} times, expected exactly 1`);
    return text.indexOf(needle);
  };

  const current = grab('About.svelte', read('About.svelte'), /<dt>Current<\/dt><dd>([^<]*)<\/dd>/g);

  const resume = read('Resume.svelte');
  const org = '<span class="tl-org">Fineksi</span>';
  const orgAt = anchorAt('Resume.svelte', resume, org);
  const cardFrom = resume.lastIndexOf('<details class="experience-card">', orgAt);
  const cardTo = resume.indexOf('</details>', orgAt);
  if (cardFrom < 0 || cardTo < 0) throw new Error(`Resume.svelte: anchor ${org} has no enclosing experience card`);
  const card = resume.slice(cardFrom, cardTo);
  const role = grab('Resume.svelte', card, /<h3>([^<]*)<\/h3>/g);
  const dates = grab('Resume.svelte', card, /<span class="tl-dates">([^<]*)<\/span>/g);

  const hero = read('Hero.svelte');
  const labelAt = anchorAt('Hero.svelte', hero, '<p class="proof-label">Production systems built at</p>');
  const listFrom = hero.indexOf('<ul class="proof-list">', labelAt);
  const listTo = listFrom >= 0 ? hero.indexOf('</ul>', listFrom) : -1;
  if (listFrom < 0 || listTo < 0) throw new Error('Hero.svelte: no proof list under "Production systems built at"');
  const heroOrg = grab('Hero.svelte', hero.slice(listFrom, listTo), /<li>(Fineksi)<\/li>/g);

  const flagship = grab('Portfolio.svelte', read('Portfolio.svelte'), /<h3 class="flagship-title">(Fineksi[^<]*)<\/h3>/g);
  const worksFor = grab('HomeHead.svelte', read('HomeHead.svelte'), /"worksFor": \{ "@type": "Organization", "name": "(Fineksi)" \}/g);
  const availability = grab('Services.svelte', read('Services.svelte'), /<strong>(Freelance Availability:[^<]*)<\/strong>/g)
    .replaceAll('&middot;', '·');

  const skills = read('Skills.svelte');
  const groupAt = anchorAt('Skills.svelte', skills, '<h3>DevOps / Cloud</h3>');
  const groupTo = skills.indexOf('</div>', groupAt);
  if (groupTo < 0) throw new Error('Skills.svelte: the "DevOps / Cloud" group never closes');
  const kubernetes = grab('Skills.svelte', skills.slice(groupAt, groupTo), /<li>(Kubernetes)<\/li>/g);

  return `SITE FACTS — statements already published on fadhlillah2.github.io/Bio, quoted from the page. Some of these are published only on the site, not in the CV document: answer from this block and do not claim where the CV shows them.

- About section, "Current" fact: "${current}"
- Experience timeline, Fineksi entry: "${role}", dates "${dates}"
- Hero proof list "Production systems built at": "${heroOrg}"
- Project Showcase, flagship card: "${flagship}"
- JSON-LD "worksFor": "${worksFor}"
- Services section: "${availability}"
- Skills section, "DevOps / Cloud" group: "${kubernetes}"
`;
}

/**
 * Turn one finished run into the answer, or refuse it.
 *
 * A killed run still carries the text parts it managed to emit before the signal, and serving
 * those would hand the visitor a sentence cut off mid-word — on a CV bot that can change what a
 * metric claims, so a non-zero exit is discarded rather than trimmed.
 */
export function parseRun(out: string, err: string, code: number): { reply: string; cost: number } {
  // stderr comes along: the 502 body tells the operator to check this terminal for the reason,
  // and on a non-zero exit this message is the only place that reason can still appear.
  if (code !== 0) {
    const why = err.trim();
    throw new Error(`opencode exited ${code} (killed or crashed); partial answer discarded${why ? `: ${why}` : ''}`);
  }

  // JSON Lines: the answer is every text part, in order; step_finish carries the bill
  let reply = '';
  let cost = 0;
  for (const line of out.split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type === 'text' && event.part?.text) reply += event.part.text;
      if (event.type === 'step_finish' && typeof event.part?.cost === 'number') cost += event.part.cost;
    } catch {
      // a non-JSON line is opencode chatter, not an answer
    }
  }
  if (!reply.trim()) throw new Error(err.trim() || `opencode exited ${code} without an answer`);
  return { reply: reply.trim(), cost };
}

// Answers land in 5-16s; the ceiling only bounds how long one question may hold the single slot.
const RUN_TIMEOUT_MS = 60_000;
const KILL_GRACE_MS = 5_000;

/**
 * Wait for a spawned run without ever waiting on it unconditionally.
 *
 * `proc.exited` stays pending forever if the child ignores SIGTERM or keeps its pipes open, and
 * the caller's single-flight flag would hang with it — the proxy would then answer 429 to every
 * visitor until it is restarted by hand. So: SIGTERM, then SIGKILL, then give up regardless.
 */
export async function collect(
  proc: { stdout: ReadableStream; stderr: ReadableStream; exited: Promise<number>; kill: (signal?: never) => void },
  timeoutMs = RUN_TIMEOUT_MS,
  graceMs = KILL_GRACE_MS
): Promise<{ out: string; err: string; code: number }> {
  const term = setTimeout(() => proc.kill('SIGTERM' as never), timeoutMs);
  const kill = setTimeout(() => proc.kill('SIGKILL' as never), timeoutMs + graceMs);
  let bail: ReturnType<typeof setTimeout> | undefined;
  const abandon = new Promise<never>((_, reject) => {
    bail = setTimeout(
      () => reject(new Error(`opencode survived SIGKILL after ${(timeoutMs + graceMs) / 1000}s — abandoning the run`)),
      timeoutMs + graceMs + 1_000
    );
  });
  try {
    const [out, err, code] = await Promise.race([
      Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]),
      abandon
    ]);
    return { out, err, code };
  } finally {
    clearTimeout(term);
    clearTimeout(kill);
    clearTimeout(bail);
  }
}

if (import.meta.main) {
  const PORT = numberEnv('CHAT_PORT', process.env.CHAT_PORT, 4317);
  const HOST = process.env.CHAT_HOST || '127.0.0.1';
  const MODEL = process.env.CHAT_MODEL || 'zhipuai-coding-plan/glm-5.3-flash';
  const TOKEN = (process.env.CHAT_TOKEN || '').trim();
  const RATE_PER_MIN = numberEnv('CHAT_RATE_PER_MIN', process.env.CHAT_RATE_PER_MIN, 5);
  const DAILY_MAX = numberEnv('CHAT_DAILY_MAX', process.env.CHAT_DAILY_MAX, 200);
  // Off by default: a forwarded-for header is caller-controlled, and trusting it without a proxy
  // in front lets one client spoof a fresh IP per request and walk straight past the rate limit.
  const TRUST_PROXY = process.env.CHAT_TRUST_PROXY === '1';
  const CHAT_ORIGINS = process.env.CHAT_ORIGINS || '';
  const DEV_CONFIG = isDevConfig(HOST, CHAT_ORIGINS);
  const ORIGINS = resolveOrigins(CHAT_ORIGINS, DEV_CONFIG);
  const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
  const CV = currentResume(REPO);

  // Refuse to serve at all rather than let opencode fall back to a tool-capable agent.
  if (!existsSync(agentFile(REPO))) {
    throw new Error(`missing ${agentFile(REPO)} — refusing to start: without it opencode answers from the default agent, which has bash and edit`);
  }

  // You cannot expose this by accident. Anywhere but a laptop dev config, every request reaches
  // `opencode run` with personal provider credentials, and an Origin header proves nothing about
  // a non-browser caller — so a reachable deployment demands a token it cannot guess.
  if (needsToken(HOST, CHAT_ORIGINS) && !TOKEN) {
    throw new Error(`refusing to serve a non-dev configuration (host ${HOST}, origins ${CHAT_ORIGINS || 'none'}) without CHAT_TOKEN: the Origin check is not authentication, and anyone reaching this port would spend your model quota`);
  }
  if (TOKEN) assertStrongSecret('CHAT_TOKEN', TOKEN);

  const grounding = await Bun.file(CV).text();
  // Fail-closed: extraction runs at startup so a moved anchor stops the proxy, not serves stale facts.
  const facts = siteFacts(REPO);
  // Per process, never persisted: a tag only has to outlive the conversation it belongs to.
  const SIGNING_KEY = await importSigningKey(crypto.getRandomValues(new Uint8Array(32)));

  // one visitor, one machine: serialising keeps a click-happy tab from spawning a fleet of agents
  let busy = false;

  const cors = (origin: string | null) => {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (origin && ORIGINS.has(origin)) {
      headers['access-control-allow-origin'] = origin;
      // authorization is listed so a token-protected instance is usable from a browser at all:
      // without it the preflight refuses the header and every request fails as 401.
      headers['access-control-allow-headers'] = 'authorization, content-type';
      headers['vary'] = 'Origin';
    }
    return headers;
  };

  const json = (body: unknown, status: number, origin: string | null) =>
    new Response(JSON.stringify(body), { status, headers: cors(origin) });

  /** Spawned as an argv array, never a shell string: visitor text is an argument, not a command. */
  const ask = async (prompt: string) => {
    // re-checked per request: the file can go away while the server is up
    if (!existsSync(agentFile(REPO))) throw new Error(`agent definition ${agentFile(REPO)} disappeared`);

    const proc = Bun.spawn(
      ['opencode', 'run', '--pure', '--agent', AGENT, '-m', MODEL, '--format', 'json', prompt],
      { cwd: REPO, stdout: 'pipe', stderr: 'pipe', stdin: 'ignore' }
    );
    const { out, err, code } = await collect(proc);

    if (fellBackToDefaultAgent(err)) {
      throw new Error(`opencode ignored --agent ${AGENT} and answered from the default tool-capable agent; answer discarded`);
    }
    return parseRun(out, err, code);
  };

  const limiter = createRateLimiter(RATE_PER_MIN, 60_000);
  const daily = createDailyCap(DAILY_MAX);

  const server = Bun.serve({
    hostname: HOST,
    port: PORT,
    // The slot is claimed before the body is read (see the handler), so a request whose body
    // stalls holds it until the socket times out. Pinned here rather than left to Bun's default.
    idleTimeout: 10,
    // 20 turns × 2000 chars is the most a valid request can carry; Bun's default would buffer
    // 128 MB per request before the handler ever gets to reject it.
    maxRequestBodySize: 128 * 1024,
    async fetch(req, server) {
      const origin = req.headers.get('origin');
      const { pathname } = new URL(req.url);

      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
      if (pathname !== '/health' && (pathname !== '/chat' || req.method !== 'POST')) {
        return json({ error: 'not found' }, 404, origin);
      }

      // Ahead of /health too: the probe runs from a page we serve and carries an Origin, while an
      // ungated /health would name the model to anyone who asks. The token gate stays below it —
      // the widget must be able to probe without one.
      if (!originAllowed(origin, ORIGINS)) return json({ error: 'origin not allowed' }, 403, origin);
      if (pathname === '/health') return json({ ok: true, model: MODEL }, 200, origin);

      // Metered before the token is checked, so guesses cost the guesser their own allowance;
      // the other way round, 401s were free and unlimited and left no trace in the log.
      const forwarded = TRUST_PROXY ? (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() : '';
      const caller = forwarded || server.requestIP(req)?.address || 'unknown';
      if (!limiter.take(caller, Date.now())) {
        return json({ error: `Too many questions — up to ${RATE_PER_MIN} per minute.` }, 429, origin);
      }

      if (TOKEN && !(await tokenMatches(req.headers.get('authorization'), TOKEN))) {
        console.warn(`rejected an unauthorized request from ${caller}`);
        return json({ error: 'unauthorized' }, 401, origin);
      }

      // Claimed synchronously, before the first await: a slow request body between the check and
      // the set let two callers through, so both spawned a run and whichever finished first
      // released the slot out from under the other.
      if (busy) return json({ error: 'A question is already being answered — try again in a moment.' }, 429, origin);
      busy = true;

      try {
        let messages;
        try {
          const body = (await req.json()) as { messages?: unknown };
          messages = await normalizeTurns(body.messages, SIGNING_KEY, () =>
            console.warn(`dropped an unsigned assistant turn from ${caller}`));
        } catch (e) {
          return json({ error: `bad request: ${(e as Error).message}` }, 400, origin);
        }

        // Spent here, not at the gate: charged earlier, a flood of malformed bodies could burn
        // the whole day's budget without a single answer ever being produced.
        if (!daily.take(Date.now())) {
          return json({ error: 'The assistant has reached its daily limit. Please use the contact section.' }, 503, origin);
        }

        const started = Date.now();
        try {
          const run = await ask(buildPrompt(grounding, facts, messages, newNonce()));
          // clamped before signing: the transcript truncates to the same length on the way back,
          // and a tag over the longer text would never verify again
          const reply = clampReply(run.reply);
          console.log(`answered in ${((Date.now() - started) / 1000).toFixed(1)}s · $${run.cost.toFixed(5)}`);
          return json({ reply, sig: await signReply(reply, SIGNING_KEY), model: MODEL }, 200, origin);
        } catch (e) {
          console.error('chat failed:', (e as Error).message);
          return json({ error: 'The model did not answer. Check this terminal for the reason.' }, 502, origin);
        }
      } finally {
        busy = false;
      }
    }
  });

  console.log(`chat proxy on http://127.0.0.1:${server.port} · model ${MODEL} · agent ${AGENT} (no tools)`);
  console.log(`grounded on ${CV.replace(REPO + '/', '')} · open http://localhost:5173/Bio/ and the widget appears`);
}
