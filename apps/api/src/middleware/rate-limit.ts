import type { AppBindings } from '@/env';
import { getIpAddress } from '@/modules/analytics/utils';
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
  const { success } = await c.env.AUTH_RATE_LIMIT.limit({
    key: getIpAddress(c),
  });

  if (!success) {
    throw new HTTPException(429, { message: 'Too Many Requests' });
  }

  await next();
};
