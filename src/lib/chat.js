/**
 * Transport for the chat widget. The page is static and holds no key: it talks to a proxy
 * (scripts/chat-proxy.ts) that runs opencode locally.
 *
 * PROD_ENDPOINT is empty because no proxy is hosted yet, so the widget is dev-only. Point it at
 * a deployed proxy and the widget goes live everywhere — that is the whole production switch.
 *
 * The ?chat= and localStorage overrides are honoured on localhost only: on the published site
 * they would let a crafted link point the visitor's chat at someone else's server under
 * Fadhlillah's domain.
 */

const PROD_ENDPOINT = '';
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
    return body.reply;
  } finally {
    clearTimeout(timer);
  }
}
