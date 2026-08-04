import type { AuthenticatedSession } from '@/middleware/authenticate';

export interface Env {
  HYPERDRIVE: { connectionString: string };
  // Cloudflare's native Rate Limiting binding (wrangler.jsonc's `ratelimits`
  // entry) — not a KV namespace. See the comment on `rateLimit` in
  // lib/auth.ts for why KV doesn't work for this.
  AUTH_RATE_LIMIT: RateLimit;
}

export interface Variables {
  session: AuthenticatedSession | null;
}

export type AppBindings = { Bindings: Env; Variables: Variables };
