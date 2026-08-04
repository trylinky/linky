import type { AuthenticatedSession } from '@/middleware/authenticate';

export interface Env {
  HYPERDRIVE: { connectionString: string };
  // Cloudflare's native Rate Limiting binding (wrangler.jsonc's `ratelimits`
  // entry) — not a KV namespace. See the comment on `rateLimit` in
  // lib/auth.ts for why KV doesn't work for this.
  AUTH_RATE_LIMIT: RateLimit;
  // Restores better-auth's dropped 3-per-10s tier for the sign-in/sign-up
  // prefixes — see the comment in middleware/rate-limit.ts.
  AUTH_STRICT_RATE_LIMIT: RateLimit;
}

export interface Variables {
  session: AuthenticatedSession | null;
}

export type AppBindings = { Bindings: Env; Variables: Variables };
