import type { AppBindings } from '@/env';
import { resolveSession } from '@/middleware/authenticate';
import { cacheControl } from '@/middleware/cache-control';
import { corsMiddleware } from '@/middleware/cors';
import {
  requireAuthRateLimit,
  requireStrictAuthRateLimit,
} from '@/middleware/rate-limit';
import { getAuth, requestContext } from '@/middleware/request-context';
import { timing } from '@/middleware/timing';
import analyticsRoutes from '@/modules/analytics';
import assetsRoutes from '@/modules/assets';
import billingRoutes from '@/modules/billing';
import blocksRoutes from '@/modules/blocks';
import coreRoutes from '@/modules/core';
import flagsRoutes from '@/modules/flags';
import formsRoutes from '@/modules/forms';
import integrationsRoutes from '@/modules/integrations';
import marketingRoutes from '@/modules/marketing';
import orchestratorsRoutes from '@/modules/orchestrators';
import organizationsRoutes from '@/modules/organizations';
import pagesRoutes from '@/modules/pages';
import reactionsRoutes from '@/modules/reactions';
import instagramServiceRoutes from '@/modules/services/instagram';
import spotifyServiceRoutes from '@/modules/services/spotify';
import threadsServiceRoutes from '@/modules/services/threads';
import tiktokServiceRoutes from '@/modules/services/tiktok';
import themesRoutes from '@/modules/themes';
import verificationRoutes from '@/modules/verification';
import { Hono } from 'hono';

export function createApp() {
  const app = new Hono<AppBindings>();

  // Order matters: requestContext must be first, because everything below it
  // (including session resolution) reads the per-request database client and
  // better-auth instance out of the AsyncLocalStorage scope it establishes.
  app.use('*', requestContext);
  app.use('*', corsMiddleware);
  app.use('*', cacheControl);
  app.use('*', timing);
  app.use('*', resolveSession);

  // better-auth speaks the Fetch API natively, so this is a direct handoff —
  // no header or body reconstruction needed. Rate-limited by Cloudflare's
  // native Rate Limiting binding; this does not apply to the rest of the API.
  //
  // The sign-in/sign-up prefixes are registered before the general
  // `/api/auth/*` wildcard and carry an additional, stricter limit — Hono
  // resolves competing patterns by registration order (see the blocks
  // module's regression test for what happens when that's gotten backwards),
  // so the more specific routes must come first or they're dead code. See
  // requireStrictAuthRateLimit's comment for why these two prefixes and not
  // others.
  app.on(
    ['GET', 'POST'],
    '/api/auth/sign-in/*',
    requireStrictAuthRateLimit,
    requireAuthRateLimit,
    (c) => getAuth().handler(c.req.raw)
  );
  app.on(
    ['GET', 'POST'],
    '/api/auth/sign-up/*',
    requireStrictAuthRateLimit,
    requireAuthRateLimit,
    (c) => getAuth().handler(c.req.raw)
  );
  // Session lookups are exempt from the per-IP auth limit. Server-rendered
  // apps (lin.ky on Vercel, the admin app) resolve the session from their own
  // servers, so lookups for many different visitors share a few Vercel egress
  // IPs; a per-IP bucket turned traffic spikes into spurious logouts, because
  // callers treat a 429 here as "no session". The lookup only reads the
  // caller's own signed cookie (an invalid signature is rejected before any
  // database read), so it carries none of the abuse risk the limit exists
  // for. Only GET is exempt, and it must be registered before the wildcard.
  app.get('/api/auth/get-session', (c) => getAuth().handler(c.req.raw));
  app.on(['GET', 'POST'], '/api/auth/*', requireAuthRateLimit, (c) =>
    getAuth().handler(c.req.raw)
  );

  app.route('/', coreRoutes);
  app.route('/marketing', marketingRoutes);
  app.route('/themes', themesRoutes);
  app.route('/reactions', reactionsRoutes);
  app.route('/flags', flagsRoutes);
  app.route('/billing', billingRoutes);
  app.route('/blocks', blocksRoutes);
  app.route('/forms', formsRoutes);
  app.route('/pages', pagesRoutes);
  app.route('/integrations', integrationsRoutes);
  app.route('/organizations', organizationsRoutes);
  app.route('/assets', assetsRoutes);
  app.route('/orchestrators', orchestratorsRoutes);
  app.route('/analytics', analyticsRoutes);
  app.route('/verification-requests', verificationRoutes);
  app.route('/services/tiktok', tiktokServiceRoutes);
  app.route('/services/instagram', instagramServiceRoutes);
  app.route('/services/threads', threadsServiceRoutes);
  app.route('/services/spotify', spotifyServiceRoutes);

  return app;
}
