import { FastifyRequest } from 'fastify';

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
 * there are no proxy headers, so request.ip already resolves to 127.0.0.1 via
 * the fallback chain.
 */
const DEFAULT_IP_ADDRESS = '127.0.0.1';

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return value?.trim() || null;
}

export const getIpAddress = (request: FastifyRequest): string => {
  const cloudflareIp = firstHeaderValue(request.headers['cf-connecting-ip']);

  if (cloudflareIp) {
    return cloudflareIp;
  }

  const xForwardedFor = firstHeaderValue(request.headers['x-forwarded-for']);

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

  const xRealIp = firstHeaderValue(request.headers['x-real-ip']);

  if (xRealIp) {
    return xRealIp;
  }

  return request.ip || DEFAULT_IP_ADDRESS;
};
