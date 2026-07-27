import cors, { FastifyCorsOptions } from '@fastify/cors';
import Fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The CORS policy is security-critical: reflecting an arbitrary origin *with*
// credentials would let any website read a logged-in user's data. These tests
// pin both halves of the policy — trusted origins keep credentials, everything
// else (notably user custom domains) is allowed but never credentialed.

const TRUSTED = 'https://app.example.com';
const CUSTOM_DOMAIN = 'https://someones-custom-domain.com';

async function buildApp(trustedOrigins: string[]): Promise<FastifyInstance> {
  const app = Fastify();

  await app.register(
    cors,
    () =>
      async (request: FastifyRequest): Promise<FastifyCorsOptions> => {
        const origin = request.headers.origin;

        return {
          origin: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
          exposedHeaders: ['Content-Length'],
          credentials: !origin || trustedOrigins.includes(origin),
          maxAge: 86400,
        };
      }
  );

  app.get('/ping', async () => ({ ping: 'pong' }));
  await app.ready();

  return app;
}

let app: FastifyInstance;

afterEach(async () => {
  await app?.close();
});

describe('CORS policy', () => {
  it('allows credentials for a trusted first-party origin', async () => {
    app = await buildApp([TRUSTED]);

    const response = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { origin: TRUSTED },
    });

    expect(response.headers['access-control-allow-origin']).toBe(TRUSTED);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('never allows credentials for an untrusted origin', async () => {
    app = await buildApp([TRUSTED]);

    const response = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { origin: 'https://evil.example.com' },
    });

    expect(
      response.headers['access-control-allow-credentials']
    ).toBeUndefined();
  });

  it('still serves custom domains, just without credentials', async () => {
    // Published pages live on user-owned domains we cannot enumerate. They must
    // keep reaching public endpoints (reactions, form submissions) — those need
    // no session, so a non-credentialed allow is enough.
    app = await buildApp([TRUSTED]);

    const response = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { origin: CUSTOM_DOMAIN },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(CUSTOM_DOMAIN);
    expect(
      response.headers['access-control-allow-credentials']
    ).toBeUndefined();
  });

  it('does not allow credentials on an untrusted preflight', async () => {
    app = await buildApp([TRUSTED]);

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/ping',
      headers: {
        origin: 'https://evil.example.com',
        'access-control-request-method': 'DELETE',
      },
    });

    expect(
      response.headers['access-control-allow-credentials']
    ).toBeUndefined();
  });

  it('varies on origin so a credentialed response is never cached for another origin', async () => {
    app = await buildApp([TRUSTED]);

    const response = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { origin: TRUSTED },
    });

    expect(String(response.headers.vary)).toContain('Origin');
  });
});

// The list is built once at module load from the environment, so each case
// needs a fresh module registry.
async function loadOrigins(env: Record<string, string | undefined>) {
  vi.resetModules();

  const previous = { ...process.env };
  Object.assign(process.env, env);

  try {
    return await import('./origins');
  } finally {
    process.env = previous;
  }
}

describe('trusted origin resolution', () => {
  it('trusts the paired frontend origin', async () => {
    const { isTrustedOrigin } = await loadOrigins({
      APP_FRONTEND_URL: 'https://app.example.com',
      TRUSTED_ORIGINS: undefined,
    });

    expect(isTrustedOrigin('https://app.example.com')).toBe(true);
    expect(isTrustedOrigin('https://evil.example.com')).toBe(false);
  });

  it('keeps the hosted origins trusted regardless of NODE_ENV', async () => {
    // The bundler inlines process.env, so NODE_ENV must not decide this.
    const { isTrustedOrigin } = await loadOrigins({
      APP_FRONTEND_URL: 'https://lin.ky',
      TRUSTED_ORIGINS: undefined,
      NODE_ENV: 'development',
    });

    expect(isTrustedOrigin('https://lin.ky')).toBe(true);
    expect(isTrustedOrigin('https://admin.lin.ky')).toBe(true);
  });

  it('does not trust localhost when the app runs on a real domain', async () => {
    const { isTrustedOrigin } = await loadOrigins({
      APP_FRONTEND_URL: 'https://lin.ky',
      TRUSTED_ORIGINS: undefined,
    });

    expect(isTrustedOrigin('http://localhost:3000')).toBe(false);
  });

  it('trusts the local dev ports when the app itself is on localhost', async () => {
    const { isTrustedOrigin } = await loadOrigins({
      APP_FRONTEND_URL: 'http://localhost:3000',
      TRUSTED_ORIGINS: undefined,
    });

    expect(isTrustedOrigin('http://localhost:3000')).toBe(true);
    expect(isTrustedOrigin('http://localhost:3002')).toBe(true);
    expect(isTrustedOrigin('https://lin.ky')).toBe(false);
  });

  it('lets a self-hosted deployment define its own origins', async () => {
    const { isTrustedOrigin, trustedOrigins } = await loadOrigins({
      TRUSTED_ORIGINS: 'https://links.mysite.com, https://mysite.com',
      APP_FRONTEND_URL: undefined,
    });

    expect(isTrustedOrigin('https://links.mysite.com')).toBe(true);
    expect(isTrustedOrigin('https://mysite.com')).toBe(true);
    // Configured origins replace the hosted defaults rather than adding to them
    expect(trustedOrigins).not.toContain('https://lin.ky');
  });

  it('normalises configured entries to a bare origin', async () => {
    const { isTrustedOrigin } = await loadOrigins({
      TRUSTED_ORIGINS: 'https://mysite.com/some/path',
      APP_FRONTEND_URL: undefined,
    });

    expect(isTrustedOrigin('https://mysite.com')).toBe(true);
  });

  it('ignores unparseable entries instead of trusting them', async () => {
    const { trustedOrigins } = await loadOrigins({
      TRUSTED_ORIGINS: 'not a url,,https://ok.example.com',
      APP_FRONTEND_URL: undefined,
    });

    expect(trustedOrigins).toEqual(['https://ok.example.com']);
  });

  it('treats a missing Origin header as trusted (non-browser callers)', async () => {
    const { isTrustedOrigin } = await loadOrigins({
      APP_FRONTEND_URL: 'https://app.example.com',
      TRUSTED_ORIGINS: undefined,
    });

    expect(isTrustedOrigin(undefined)).toBe(true);
  });
});
