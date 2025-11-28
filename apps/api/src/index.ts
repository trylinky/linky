import { auth } from './lib/auth';
import prisma from './lib/prisma';
import './lib/sentry';
import blocksRoutes from './modules/blocks';
import { coreRoutes } from './modules/core';
import marketingRoutes from './modules/marketing';
import pagesRoutes from './modules/pages';
import tiktokServiceRoutes from './modules/services/tiktok';
import { authenticateDecorator } from '@/decorators/authenticate';
import { trustedOrigins } from '@/lib/origins';
import analyticsRoutes from '@/modules/analytics';
import assetsRoutes from '@/modules/assets';
import billingRoutes from '@/modules/billing';
import flagsRoutes from '@/modules/flags';
import integrationsRoutes from '@/modules/integrations';
import orchestratorsRoutes from '@/modules/orchestrators';
import organizationsRoutes from '@/modules/organizations';
import reactionsRoutes from '@/modules/reactions';
import instagramServiceRoutes from '@/modules/services/instagram';
import spotifyServiceRoutes from '@/modules/services/spotify';
import threadsServiceRoutes from '@/modules/services/threads';
import themesRoutes from '@/modules/themes';
import cors from '@fastify/cors';
import fastifyExpress from '@fastify/express';
import fastifyMultipart from '@fastify/multipart';
import fastifySensible from '@fastify/sensible';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import * as Sentry from '@sentry/node';
import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import FastifyBetterAuth from 'fastify-better-auth';
import fastifyRawBody from 'fastify-raw-body';

export const fastify: FastifyInstance =
  Fastify().withTypeProvider<TypeBoxTypeProvider>();

await fastify.register(fastifyExpress);
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

await fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  exposedHeaders: ['Content-Length'], // Expose specific headers
  credentials: true,
  maxAge: 86400, // Cache preflight response for 24 hours
});

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
fastify.register(organizationsRoutes, { prefix: '/organizations' });
fastify.register(billingRoutes, { prefix: '/billing' });

fastify.register(tiktokServiceRoutes as any, { prefix: '/services/tiktok' });
fastify.register(instagramServiceRoutes, { prefix: '/services/instagram' });
fastify.register(threadsServiceRoutes, { prefix: '/services/threads' });
fastify.register(spotifyServiceRoutes, {
  prefix: '/services/spotify',
});

// fastify.register(FastifyBetterAuth, { auth });

fastify.decorate('authenticate', authenticateDecorator);

Sentry.setupFastifyErrorHandler(fastify);

fastify.addHook('onRequest', async (request, reply) => {
  request.startTime = Date.now();
});

fastify.addHook('onResponse', async (request, reply) => {
  if (request.startTime) {
    const responseTime = Date.now() - request.startTime;
    if (responseTime > 200) {
      console.log(`Request to ${request.raw.url} took ${responseTime}ms`);
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
      fastify.log.error('Authentication Error:', error);
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
