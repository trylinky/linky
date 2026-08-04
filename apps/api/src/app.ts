import type { AppBindings } from '@/env';
import { createAuth } from '@/lib/auth';
import { resolveSession } from '@/middleware/authenticate';
import { cacheControl } from '@/middleware/cache-control';
import { corsMiddleware } from '@/middleware/cors';
import {
  requireAuthRateLimit,
  requireStrictAuthRateLimit,
} from '@/middleware/rate-limit';
import { requestContext } from '@/middleware/request-context';
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
import { Hono } from 'hono';

export function createApp() {
  const app = new Hono<AppBindings>();

  // Order matters: requestContext must be first, because everything below it
  // (including session resolution) reads the per-request Prisma client and
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
    (c) => createAuth().handler(c.req.raw)
  );
  app.on(
    ['GET', 'POST'],
    '/api/auth/sign-up/*',
    requireStrictAuthRateLimit,
    requireAuthRateLimit,
    (c) => createAuth().handler(c.req.raw)
  );
  app.on(['GET', 'POST'], '/api/auth/*', requireAuthRateLimit, (c) =>
    createAuth().handler(c.req.raw)
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
  app.route('/services/tiktok', tiktokServiceRoutes);
  app.route('/services/instagram', instagramServiceRoutes);
  app.route('/services/threads', threadsServiceRoutes);
  app.route('/services/spotify', spotifyServiceRoutes);

  return app;
}
