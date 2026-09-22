/**
 * Transport for the chat widget. The page is static and holds no key: on the published site it
 * talks to the Cloudflare Worker in worker/chat.ts; on localhost it defaults to the dev proxy
 * (scripts/chat-proxy.ts).
 *
 * PROD_ENDPOINT is the production switch and the kill switch: empty it and rebuild, or delete the
 * worker, and the /health probe fails so the widget never renders.
 *
 * The ?chat= and localStorage overrides are honoured on localhost only: on the published site
 * they would let a crafted link point the visitor's chat at someone else's server under
 * Fadhlillah's domain.
 */

const PROD_ENDPOINT = 'https://bio-chat.fadhlillah2.workers.dev';
const DEV_ENDPOINT = 'http://127.0.0.1:4317';
const PROBE_TIMEOUT_MS = 2000;
const ASK_TIMEOUT_MS = 120000;

const trim = (url) => url.replace(/\/+$/, '');

const isLocal = () =>
  ['localhost', '127.0.0.1', '[::1]', '::1'].includes(window.location.hostname);

export function resolveEndpoint() {
  if (!isLocal()) return PROD_ENDPOINT ? trim(PROD_ENDPOINT) : null;
  try {
    const fromQuery = new URLSearchParams(window.location.search).get('chat');
    if (fromQuery) return trim(fromQuery);
    const stored = window.localStorage.getItem('chat-endpoint');
    if (stored) return trim(stored);
  } catch (e) {
    // private mode: fall through to the default
  }
  return DEV_ENDPOINT;
}

/** Resolves to the proxy's model name, or null when nothing is listening — the widget then stays unrendered. */
export async function probe(endpoint) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint + '/health', { signal: ctrl.signal });
    if (!res.ok) return null;
    const body = await res.json();
    return body && body.ok ? body.model || '' : null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * No Authorization header on purpose. The proxy accepts CHAT_TOKEN for a private deployment, but
 * this file ships to every visitor: a token pasted here would be readable in devtools and would
 * protect nothing. A public deployment is guarded by the origin allowlist, the per-IP rate limit
 * and the daily cap instead — and a token, if one is used, belongs in the proxy in front, not here.
 */
export async function ask(endpoint, messages, signal) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ASK_TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => ctrl.abort(), { once: true });
  try {
    const res = await fetch(endpoint + '/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: ctrl.signal
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'The chat service returned an error.');
    // `sig` is the proxy's tag over this exact reply. It is carried back with the turn so the
    // proxy can tell its own words from an assistant turn someone typed into the request.
    return { reply: body.reply, sig: body.sig };
  } finally {
    clearTimeout(timer);
  }
}
