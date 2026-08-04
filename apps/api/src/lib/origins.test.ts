import { corsMiddleware } from '@/middleware/cors';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The CORS policy is security-critical: reflecting an arbitrary origin *with*
// credentials would let any website read a logged-in user's data. These tests
// pin both halves of the policy — trusted origins keep credentials, everything
// else (notably user custom domains) is allowed but never credentialed.

const TRUSTED = 'https://app.example.com';
const CUSTOM_DOMAIN = 'https://someones-custom-domain.com';

function buildApp(trustedOrigins: string[]) {
  vi.stubEnv('TRUSTED_ORIGINS', trustedOrigins.join(','));
  vi.stubEnv('APP_FRONTEND_URL', '');

  const app = new Hono();
  app.use('*', corsMiddleware);
  app.get('/ping', (c) => c.json({ ping: 'pong' }));

  return app;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('CORS policy', () => {
  it('allows credentials for a trusted first-party origin', async () => {
    const app = buildApp([TRUSTED]);

    const response = await app.request('/ping', {
      headers: { origin: TRUSTED },
    });

    expect(response.headers.get('access-control-allow-origin')).toBe(TRUSTED);
    expect(response.headers.get('access-control-allow-credentials')).toBe(
      'true'
    );
  });

  it('never allows credentials for an untrusted origin', async () => {
    const app = buildApp([TRUSTED]);

    const response = await app.request('/ping', {
      headers: { origin: 'https://evil.example.com' },
    });

    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('still serves custom domains, just without credentials', async () => {
    // Published pages live on user-owned domains we cannot enumerate. They must
    // keep reaching public endpoints (reactions, form submissions) — those need
    // no session, so a non-credentialed allow is enough.
    const app = buildApp([TRUSTED]);

    const response = await app.request('/ping', {
      headers: { origin: CUSTOM_DOMAIN },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      CUSTOM_DOMAIN
    );
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('does not allow credentials on an untrusted preflight', async () => {
    const app = buildApp([TRUSTED]);

    const response = await app.request('/ping', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://evil.example.com',
        'access-control-request-method': 'DELETE',
      },
    });

    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('varies on origin so a credentialed response is never cached for another origin', async () => {
    const app = buildApp([TRUSTED]);

    const response = await app.request('/ping', {
      headers: { origin: TRUSTED },
    });

    expect(String(response.headers.get('vary'))).toContain('Origin');
  });
});

// The trusted-origins list is computed per call rather than at module load
// (see getTrustedOrigins in ./origins), so isolating a case from the next one
// only requires stubbing env vars — no module reload needed.
function loadOrigins(env: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(env)) {
    vi.stubEnv(key, value);
  }

  return import('./origins');
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
    const { isTrustedOrigin, getTrustedOrigins } = await loadOrigins({
      TRUSTED_ORIGINS: 'https://links.mysite.com, https://mysite.com',
      APP_FRONTEND_URL: undefined,
    });

    expect(isTrustedOrigin('https://links.mysite.com')).toBe(true);
    expect(isTrustedOrigin('https://mysite.com')).toBe(true);
    // Configured origins replace the hosted defaults rather than adding to them
    expect(getTrustedOrigins()).not.toContain('https://lin.ky');
  });

  it('normalises configured entries to a bare origin', async () => {
    const { isTrustedOrigin } = await loadOrigins({
      TRUSTED_ORIGINS: 'https://mysite.com/some/path',
      APP_FRONTEND_URL: undefined,
    });

    expect(isTrustedOrigin('https://mysite.com')).toBe(true);
  });

  it('ignores unparseable entries instead of trusting them', async () => {
    const { getTrustedOrigins } = await loadOrigins({
      TRUSTED_ORIGINS: 'not a url,,https://ok.example.com',
      APP_FRONTEND_URL: undefined,
    });

    expect(getTrustedOrigins()).toEqual(['https://ok.example.com']);
  });

  it('treats a missing Origin header as trusted (non-browser callers)', async () => {
    const { isTrustedOrigin } = await loadOrigins({
      APP_FRONTEND_URL: 'https://app.example.com',
      TRUSTED_ORIGINS: undefined,
    });

    expect(isTrustedOrigin(undefined)).toBe(true);
  });
});

describe('lazy evaluation', () => {
  it('reads the environment at call time, not at module load', async () => {
    // On Workers, module scope can run before env is populated. If the list
    // were computed at import, it would be permanently empty.
    vi.resetModules();
    const previous = { ...process.env };
    delete process.env.APP_FRONTEND_URL;
    delete process.env.TRUSTED_ORIGINS;

    const { isTrustedOrigin } = await import('./origins');

    process.env.APP_FRONTEND_URL = 'https://app.example.com';

    try {
      expect(isTrustedOrigin('https://app.example.com')).toBe(true);
    } finally {
      process.env = previous;
    }
  });
});
