import { auth } from './lib/auth';
import prisma from './lib/prisma';
import './lib/sentry';
import blocksRoutes from './modules/blocks';
import { coreRoutes } from './modules/core';
import marketingRoutes from './modules/marketing';
import pagesRoutes from './modules/pages';
import tiktokServiceRoutes from './modules/services/tiktok';
import { authenticateDecorator } from '@/decorators/authenticate';
import { authenticateApiKeyDecorator } from '@/decorators/authenticate-api-key';
import { isTrustedOrigin } from '@/lib/origins';
import analyticsRoutes from '@/modules/analytics';
import assetsRoutes from '@/modules/assets';
import billingRoutes from '@/modules/billing';
import flagsRoutes from '@/modules/flags';
import formsRoutes from '@/modules/forms';
import integrationsRoutes from '@/modules/integrations';
import orchestratorsRoutes from '@/modules/orchestrators';
import organizationsRoutes from '@/modules/organizations';
import reactionsRoutes from '@/modules/reactions';
import instagramServiceRoutes from '@/modules/services/instagram';
import spotifyServiceRoutes from '@/modules/services/spotify';
import threadsServiceRoutes from '@/modules/services/threads';
import themesRoutes from '@/modules/themes';
import fastifyCompress from '@fastify/compress';
import cors, { FastifyCorsOptions } from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifySensible from '@fastify/sensible';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import * as Sentry from '@sentry/node';
import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import fastifyRawBody from 'fastify-raw-body';

export const fastify: FastifyInstance = Fastify({
  /**
   * Fastify's logger defaults to false, which makes `fastify.log.*` a silent
   * no-op — the boot failure handler and the /api/auth error branch were both
   * writing to nowhere.
   *
   * Per-request logging stays off so this doesn't suddenly add two lines per
   * request to the hosted deployment's log volume; the slow-request hook below
   * already covers the interesting case. Set LOG_REQUESTS=true to turn it on.
   */
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: {
      paths: [
        'req.headers.cookie',
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        'res.headers["set-cookie"]',
      ],
      censor: '[redacted]',
    },
  },
  disableRequestLogging: process.env.LOG_REQUESTS !== 'true',
}).withTypeProvider<TypeBoxTypeProvider>();

await fastify.register(fastifyCompress);
await fastify.register(fastifySensible);

await fastify.register(fastifyRawBody, {
  field: 'rawBody',
  global: false, // Only enable for specific routes
  encoding: 'utf8', // Set the encoding for the raw body
  runFirst: true,
});

await fastify.register(fastifyMultipart, {
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * CORS is decided per request, because the API serves two different kinds of
 * caller:
 *
 *  - First-party app surfaces (the editor, admin, marketing) are in
 *    `trustedOrigins` and need credentialed requests so the session cookie is
 *    sent and the response is readable.
 *
 *  - Public pages on user custom domains, whose origin we can't enumerate.
 *    These only ever call session-free endpoints (reactions, form
 *    submissions), so they get CORS *without* credentials.
 *
 * Reflecting the origin without credentials is safe: no cookie is attached, so
 * an untrusted caller can only reach data that is already public. Echoing an
 * arbitrary origin *with* credentials would let any site read a logged-in
 * user's data.
 */
await fastify.register(
  cors,
  () =>
    async (request: FastifyRequest): Promise<FastifyCorsOptions> => ({
      origin: true, // reflect; @fastify/cors also sets `Vary: Origin`
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      exposedHeaders: ['Content-Length'], // Expose specific headers
      credentials: isTrustedOrigin(request.headers.origin),
      maxAge: 86400, // Cache preflight response for 24 hours
    })
);

fastify.register(coreRoutes);
fastify.register(marketingRoutes, { prefix: '/marketing' });
fastify.register(blocksRoutes, { prefix: '/blocks' });
fastify.register(pagesRoutes, { prefix: '/pages' });
fastify.register(themesRoutes, { prefix: '/themes' });

fastify.register(integrationsRoutes, { prefix: '/integrations' });
fastify.register(reactionsRoutes, { prefix: '/reactions' });
fastify.register(assetsRoutes, { prefix: '/assets' });
fastify.register(orchestratorsRoutes, { prefix: '/orchestrators' });
fastify.register(analyticsRoutes, { prefix: '/analytics' });
fastify.register(flagsRoutes, { prefix: '/flags' });
fastify.register(formsRoutes, { prefix: '/forms' });
fastify.register(organizationsRoutes, { prefix: '/organizations' });
fastify.register(billingRoutes, { prefix: '/billing' });

fastify.register(tiktokServiceRoutes as any, { prefix: '/services/tiktok' });
fastify.register(instagramServiceRoutes, { prefix: '/services/instagram' });
fastify.register(threadsServiceRoutes, { prefix: '/services/threads' });
fastify.register(spotifyServiceRoutes, {
  prefix: '/services/spotify',
});

fastify.decorate('authenticate', authenticateDecorator);
fastify.decorate('authenticateApiKey', authenticateApiKeyDecorator);

Sentry.setupFastifyErrorHandler(fastify);

fastify.addHook('onSend', async (request, reply) => {
  // Default to no-store, but let individual routes opt into caching by
  // setting their own Cache-Control header.
  if (!reply.getHeader('Cache-Control')) {
    reply.header('Cache-Control', 'no-store, must-revalidate');
  }
});

fastify.addHook('onRequest', async (request) => {
  request.startTime = Date.now();
});

fastify.addHook('onResponse', async (request) => {
  if (request.startTime) {
    const responseTime = Date.now() - request.startTime;
    if (responseTime > 200) {
      request.log.warn({ url: request.raw.url, responseTime }, 'Slow request');
    }
  }
});

fastify.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  async handler(request, reply) {
    try {
      // Construct request URL
      const url = new URL(request.url, `http://${request.headers.host}`);

      // Convert Fastify headers to standard Headers object
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, value.toString());
      });
      // Create Fetch API-compatible request
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });
      // Process authentication request
      const response = await auth.handler(req);
      // Forward response to client
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      reply.send(response.body ? await response.text() : null);
    } catch (error) {
      fastify.log.error({ err: error }, 'Authentication Error');
      reply.status(500).send({
        error: 'Internal authentication error',
        code: 'AUTH_FAILURE',
      });
    }
  },
});

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

    if (!prisma) {
      throw new Error('Prisma client not found');
    }

    void (await prisma
      .$connect()
      .then(async () => {
        await fastify.listen({ port, host: '0.0.0.0' });
      })
      .then(() => {
        console.info(`App listening on ${port}`);
      }));
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
