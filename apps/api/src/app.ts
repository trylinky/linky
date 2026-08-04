import type { AppBindings } from '@/env';
import { createAuth } from '@/lib/auth';
import { resolveSession } from '@/middleware/authenticate';
import { cacheControl } from '@/middleware/cache-control';
import { corsMiddleware } from '@/middleware/cors';
import { requireAuthRateLimit } from '@/middleware/rate-limit';
import { requestContext } from '@/middleware/request-context';
import { timing } from '@/middleware/timing';
import blocksRoutes from '@/modules/blocks';
import coreRoutes from '@/modules/core';
import flagsRoutes from '@/modules/flags';
import formsRoutes from '@/modules/forms';
import marketingRoutes from '@/modules/marketing';
import reactionsRoutes from '@/modules/reactions';
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
  app.on(['GET', 'POST'], '/api/auth/*', requireAuthRateLimit, (c) =>
    createAuth().handler(c.req.raw)
  );

  app.route('/', coreRoutes);
  app.route('/marketing', marketingRoutes);
  app.route('/themes', themesRoutes);
  app.route('/reactions', reactionsRoutes);
  app.route('/flags', flagsRoutes);
  app.route('/blocks', blocksRoutes);
  app.route('/forms', formsRoutes);

  return app;
}
