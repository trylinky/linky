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

/**
 * Restores the 3-per-10s tier better-auth's own rate limiting used to apply
 * to `/sign-in*` and `/sign-up*` (per IP and per path, via
 * getDefaultSpecialRules() — see the comment in wrangler.jsonc). Mounted in
 * app.ts in front of those two prefixes specifically, in addition to (not
 * instead of) `requireAuthRateLimit`'s flat 100-per-10s covering the rest of
 * `/api/auth/*`.
 *
 * Not applied to `/change-password` or `/change-email`, the other two
 * paths in better-auth's same tier: both require `sensitiveSessionMiddleware`
 * (an already-authenticated session), so the anonymous abuse this restores
 * protection against — unauthenticated email-bombing and sign-in
 * enumeration — doesn't apply to them the same way. Not applied to the
 * 3-per-60s tier (request-password-reset, send-verification-email,
 * forget-password*, email-otp/*) either: forget-password* and email-otp/*
 * only exist under the `email-otp` plugin, which this app doesn't install,
 * so they 404 regardless; request-password-reset and send-verification-email
 * are registered but immediately throw BAD_REQUEST before any side effect,
 * because this app configures neither `emailAndPassword.sendResetPassword`
 * nor `emailVerification.sendVerificationEmail` — unlike sign-in/magic-link,
 * which really does dispatch a Resend email through the active magicLink
 * plugin.
 */
export const requireStrictAuthRateLimit: MiddlewareHandler<
  AppBindings
> = async (c, next) => {
  const { success } = await c.env.AUTH_STRICT_RATE_LIMIT.limit({
    key: getIpAddress(c),
  });

  if (!success) {
    throw new HTTPException(429, { message: 'Too Many Requests' });
  }

  await next();
};
