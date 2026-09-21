/**
 * Run worker/chat.ts locally, so the deployed path can be exercised before it is deployed.
 *
 * Wrangler would do this too, but it is another install and it cannot be driven from the repo's
 * own checks. The KV binding is replaced by an in-memory stand-in; everything else — the gates,
 * the prompt assembly, the provider call — is the same code the worker runs.
 *
 *   CHAT_API_KEY=… CHAT_SIGNING_KEY=… bun scripts/chat-worker-dev.ts
 */
import worker, { type Env } from '../worker/chat.ts';
import { numberEnv } from './chat-core.ts';

const PORT = numberEnv('CHAT_PORT', process.env.CHAT_PORT, 4318);

/** Enough of KVNamespace for this worker: get, put with a TTL, and nothing else. */
const memoryKv = () => {
  const store = new Map<string, { value: string; expires: number }>();
  return {
    async get(key: string) {
      const hit = store.get(key);
      if (!hit || hit.expires < Date.now()) return null;
      return hit.value;
    },
    async put(key: string, value: string, options?: { expirationTtl?: number }) {
      store.set(key, { value, expires: Date.now() + (options?.expirationTtl ?? 60) * 1000 });
    }
  } as unknown as KVNamespace;
};

const env: Env = {
  CHAT_API_KEY: process.env.CHAT_API_KEY || '',
  CHAT_SIGNING_KEY: process.env.CHAT_SIGNING_KEY || '',
  CHAT_ORIGINS: process.env.CHAT_ORIGINS || 'http://localhost:5173',
  CHAT_API_URL: process.env.CHAT_API_URL,
  CHAT_MODEL: process.env.CHAT_MODEL,
  CHAT_TOKEN: process.env.CHAT_TOKEN,
  CHAT_RATE_PER_MIN: process.env.CHAT_RATE_PER_MIN,
  CHAT_DAILY_MAX: process.env.CHAT_DAILY_MAX,
  CHAT_KV: memoryKv()
};

const server = Bun.serve({
  hostname: '127.0.0.1',
  port: PORT,
  maxRequestBodySize: 128 * 1024,
  idleTimeout: 10,
  fetch: (request) =>
    worker.fetch(
      // the deployed worker reads the caller from the Cloudflare edge header; locally every
      // request is the same caller, which is what a single developer's machine actually is
      new Request(request, { headers: { ...Object.fromEntries(request.headers), 'cf-connecting-ip': '127.0.0.1' } }),
      env
    )
});

console.log(`worker (local) on http://127.0.0.1:${server.port} · model ${env.CHAT_MODEL || 'deepseek-chat'} · KV in memory`);
console.log(`origins ${env.CHAT_ORIGINS}${env.CHAT_TOKEN ? ' · token required' : ''}`);
