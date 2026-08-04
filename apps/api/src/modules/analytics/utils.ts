import type { AppBindings } from '@/env';
import type { Context } from 'hono';

/**
 * Resolves the client IP for abuse controls (form submission rate limiting,
 * per-IP reaction caps).
 *
 * Anything a client can set itself is unusable here. `X-Forwarded-For` is a
 * list the client contributes to: a proxy appends to it rather than replacing
 * it, so the leftmost entries are simply whatever the caller sent. Reading the
 * leftmost entry lets anyone reset their own rate limit with a header.
 *
 * Order of preference:
 *  1. `CF-Connecting-IP` — Cloudflare overwrites this on every request and
 *     strips any client-supplied value, so it cannot be forged from outside.
 *     This is the header the hosted deployment runs on.
 *  2. The *rightmost* `X-Forwarded-For` entry — appended by the reverse proxy
 *     directly in front of this app, so it is the closest thing to trustworthy
 *     for a self-hosted single-proxy setup. Earlier entries are client input.
 *  3. `X-Real-IP`, then the socket address.
 *
 * No NODE_ENV short-circuit here: the API bundle inlines process.env at build
 * time, so an env-dependent branch can get baked into production. In local dev
 * there are no proxy headers, so this already falls through to
 * DEFAULT_IP_ADDRESS below.
 */
const DEFAULT_IP_ADDRESS = '127.0.0.1';

export const getIpAddress = (c: Context<AppBindings>): string => {
  const cloudflareIp = c.req.header('cf-connecting-ip')?.trim();

  if (cloudflareIp) {
    return cloudflareIp;
  }

  const xForwardedFor = c.req.header('x-forwarded-for')?.trim();

  if (xForwardedFor) {
    const hops = xForwardedFor
      .split(',')
      .map((hop) => hop.trim())
      .filter(Boolean);

    // Nearest proxy last: everything before it is caller-supplied.
    const nearestHop = hops[hops.length - 1];

    if (nearestHop) {
      return nearestHop;
    }
  }

  return c.req.header('x-real-ip')?.trim() || DEFAULT_IP_ADDRESS;
};
