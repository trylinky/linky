import type { AppBindings } from '@/env';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Guards /api/auth/* with Cloudflare's native Rate Limiting binding
 * (wrangler.jsonc's `ratelimits` entry). This replaces better-auth's own
 * rate limiting, which is disabled in lib/auth.ts — see the comment there
 * for why KV-backed storage doesn't work for a 10s window.
 */
export const requireAuthRateLimit: MiddlewareHandler<AppBindings> = async (
  c,
  next
) => {
  // TODO(Task 12): switch to the shared getIpAddress() once it is ported to
  // Hono (currently src/modules/analytics/utils.ts, which still takes a
  // FastifyRequest). That helper has the correct precedence — CF-Connecting-IP
  // first, since Cloudflare overwrites it and strips any client-supplied
  // value, then the *rightmost* X-Forwarded-For hop. Duplicating that whole
  // chain here for an interim middleware isn't worth a second, divergent
  // copy of security-relevant IP resolution — Cloudflare always sets
  // cf-connecting-ip in production, so the plain fallback below only matters
  // for local dev, where sharing one bucket is fine.
  const key = c.req.header('cf-connecting-ip') ?? 'unknown';

  const { success } = await c.env.AUTH_RATE_LIMIT.limit({ key });

  if (!success) {
    throw new HTTPException(429, { message: 'Too Many Requests' });
  }

  await next();
};
