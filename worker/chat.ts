/**
 * Public chat backend: browser → this worker → the model provider's HTTPS API.
 *
 * The alternative, hosting scripts/chat-proxy.ts, would put the opencode CLI and the author's
 * personal `auth.json` — every provider credential at once — on a public machine. Here the blast
 * radius is one API key that can be scoped, capped and revoked without disturbing anything else.
 * There is no CLI, so there is also no tool-capable agent to fall back to: the assistant's rules
 * travel as a system message and the model has no tools at all.
 *
 * Deploy (you run these; they touch your account, not this repo):
 *   cd worker && bunx wrangler kv namespace create CHAT_KV      # paste the id into wrangler.toml
 *   bunx wrangler secret put CHAT_API_KEY                       # provider key, scoped + capped
 *   bunx wrangler secret put CHAT_SIGNING_KEY                   # openssl rand -hex 32
 *   bunx wrangler deploy
 * Then set PROD_ENDPOINT in src/lib/chat.js to the worker URL and CHAT_ORIGINS to the site origin.
 */
import {
  assertStrongSecret,
  buildPrompt,
  clampReply,
  importSigningKey,
  MAX_CHARS,
  MAX_TURNS,
  newNonce,
  normalizeTurns,
  numberEnv,
  originAllowed,
  resolveOrigins,
  signReply,
  tokenMatches,
  utcDay
} from '../scripts/chat-core.ts';
import { CV, RULES, SITE_FACTS } from './content.generated.ts';

/** Cloudflare's rate limiting binding: atomic at the edge, unlike anything built on KV. */
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  CHAT_API_KEY: string;
  CHAT_SIGNING_KEY: string;
  CHAT_ORIGINS: string;
  CHAT_API_URL?: string;
  CHAT_MODEL?: string;
  CHAT_TOKEN?: string;
  CHAT_RATE_PER_MIN?: string;
  CHAT_DAILY_MAX?: string;
  CHAT_DAILY_PER_CALLER?: string;
  CHAT_KV?: KVNamespace;
  RATE_LIMITER?: RateLimiter;
}

const ANSWER_TIMEOUT_MS = 60_000;
const MAX_ANSWER_TOKENS = 700;
/** 20 turns × 2000 chars plus JSON overhead; anything larger is not a conversation. */
const MAX_BODY_BYTES = 128 * 1024;

/**
 * A day counter on KV, and only a counter.
 *
 * It is NOT a hard cap: KV is read-then-write, so a concurrent burst all reads the same old value
 * and every writer stores it + 1 — an adversarial burst was measured passing 40 requests while
 * the counter moved by one. Per-caller limiting therefore uses the edge rate limiter above, and
 * the real ceiling on spend is the cap set on the API key itself. This bounds the ordinary case
 * and gives the widget a polite way to stop.
 */
async function countDay(kv: KVNamespace, key: string, limit: number): Promise<boolean> {
  const used = Number((await kv.get(key)) || 0);
  if (used >= limit) return false;
  await kv.put(key, String(used + 1), { expirationTtl: 172_800 });
  return true;
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('origin');
    const { pathname } = new URL(request.url);
    const origins = resolveOrigins(env.CHAT_ORIGINS || '', false);

    const cors: Record<string, string> = originAllowed(origin, origins)
      ? {
          'access-control-allow-origin': origin as string,
          'access-control-allow-headers': 'authorization, content-type',
          vary: 'Origin'
        }
      : {};

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (pathname !== '/health' && (pathname !== '/chat' || request.method !== 'POST')) {
      return json({ error: 'not found' }, 404, cors);
    }
    if (!originAllowed(origin, origins)) return json({ error: 'origin not allowed' }, 403, cors);

    // Checked before /health answers, so a half-configured deployment reads as down: the widget
    // probes /health first and stays unrendered rather than offering a box that cannot answer.
    let perMin: number;
    let dailyMax: number;
    let dailyPerCaller: number;
    try {
      if (!env.CHAT_KV) throw new Error('CHAT_KV binding is missing');
      if (!env.CHAT_API_KEY) throw new Error('CHAT_API_KEY is missing');
      assertStrongSecret('CHAT_SIGNING_KEY', env.CHAT_SIGNING_KEY || '');
      if (env.CHAT_TOKEN) assertStrongSecret('CHAT_TOKEN', env.CHAT_TOKEN);
      perMin = numberEnv('CHAT_RATE_PER_MIN', env.CHAT_RATE_PER_MIN, 5);
      dailyMax = numberEnv('CHAT_DAILY_MAX', env.CHAT_DAILY_MAX, 200);
      dailyPerCaller = numberEnv('CHAT_DAILY_PER_CALLER', env.CHAT_DAILY_PER_CALLER, 20);
    } catch (e) {
      console.error(`refusing to serve: ${(e as Error).message}`);
      return json({ error: 'The assistant is not configured.' }, 503, cors);
    }

    const model = env.CHAT_MODEL || 'deepseek-chat';
    if (pathname === '/health') return json({ ok: true, model }, 200, cors);

    // Set by the Cloudflare edge, not by the caller — unlike x-forwarded-for, which a client can
    // simply invent to get a fresh rate-limit bucket per request.
    const caller = request.headers.get('cf-connecting-ip') || 'unknown';
    if (env.RATE_LIMITER) {
      if (!(await env.RATE_LIMITER.limit({ key: caller })).success) {
        return json({ error: `Too many questions — up to ${perMin} per minute.` }, 429, cors);
      }
    } else if (!(await countDay(env.CHAT_KV, `rate:${caller}:${Math.floor(Date.now() / 60_000)}`, perMin))) {
      // Local fallback only. In a deployment the binding above is what holds; this branch cannot
      // survive a concurrent burst and wrangler.toml configures the binding for that reason.
      return json({ error: `Too many questions — up to ${perMin} per minute.` }, 429, cors);
    }

    if (env.CHAT_TOKEN && !(await tokenMatches(request.headers.get('authorization'), env.CHAT_TOKEN))) {
      console.warn(`rejected an unauthorized request from ${caller}`);
      return json({ error: 'unauthorized' }, 401, cors);
    }

    // Refused on the declared length, before a byte is buffered or parsed.
    if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
      return json({ error: 'request too large' }, 413, cors);
    }

    const signingKey = await importSigningKey(new TextEncoder().encode(env.CHAT_SIGNING_KEY));

    let messages;
    try {
      const body = (await request.json()) as { messages?: unknown };
      messages = await normalizeTurns(body.messages, signingKey, () =>
        console.warn(`dropped an unsigned assistant turn from ${caller}`));
    } catch (e) {
      return json({ error: `bad request: ${(e as Error).message}` }, 400, cors);
    }

    // Charged only once a run is about to start, so malformed bodies cannot burn the day. The
    // per-caller quota is charged first: a caller past their own allowance is turned away without
    // also spending the budget every other caller shares.
    if (!(await countDay(env.CHAT_KV, `caller:${utcDay(Date.now())}:${caller}`, dailyPerCaller))) {
      return json({ error: "You have reached today's question limit. Please use the contact section." }, 429, cors);
    }
    if (!(await countDay(env.CHAT_KV, `day:${utcDay(Date.now())}`, dailyMax))) {
      return json({ error: 'The assistant has reached its daily limit. Please use the contact section.' }, 503, cors);
    }

    const endpoint = `${(env.CHAT_API_URL || 'https://api.deepseek.com').replace(/\/+$/, '')}/chat/completions`;
    // bigmodel-only: GLM burns the 700-token budget on reasoning unless disabled; other endpoints reject the parameter.
    const bigmodel = new URL(endpoint).hostname.endsWith('bigmodel.cn');
    try {
      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.CHAT_API_KEY}` },
        body: JSON.stringify({
          model,
          max_tokens: MAX_ANSWER_TOKENS,
          temperature: 0.2,
          ...(bigmodel && { thinking: { type: 'disabled' } }),
          messages: [
            { role: 'system', content: RULES },
            { role: 'user', content: buildPrompt(CV, SITE_FACTS, messages, newNonce()) }
          ]
        }),
        signal: AbortSignal.timeout(ANSWER_TIMEOUT_MS)
      });

      if (!upstream.ok) {
        // The provider's body can echo request details; only the status crosses back.
        console.error(`provider answered ${upstream.status}`);
        return json({ error: 'The model did not answer.' }, 502, cors);
      }

      const data = (await upstream.json()) as any;
      // `content` only: reasoning models also return `reasoning_content`, which is thinking aloud
      // and not an answer anyone should be shown. Clamped to the same length the transcript keeps,
      // so the tag below still verifies when the turn comes back.
      const reply = clampReply(String(data?.choices?.[0]?.message?.content ?? '').trim());
      if (!reply) {
        console.error(`provider returned no answer (finish_reason ${data?.choices?.[0]?.finish_reason})`);
        return json({ error: 'The model did not answer.' }, 502, cors);
      }

      return json({ reply, sig: await signReply(reply, signingKey), model }, 200, cors);
    } catch (e) {
      console.error('provider call failed:', (e as Error).name);
      return json({ error: 'The model did not answer.' }, 502, cors);
    }
  }
};

export const LIMITS = { MAX_BODY_BYTES, MAX_ANSWER_TOKENS, MAX_TURNS, MAX_CHARS };
