import { requireAuthRateLimit, requireStrictAuthRateLimit } from './rate-limit';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

function buildApp(success: boolean) {
  const app = new Hono();
  app.use('/protected', requireAuthRateLimit);
  app.get('/protected', (c) => c.json({ ok: true }));

  const fakeBinding = {
    limit: async () => ({ success }),
  };

  return () =>
    app.request(
      '/protected',
      { headers: { 'cf-connecting-ip': '203.0.113.1' } },
      { AUTH_RATE_LIMIT: fakeBinding }
    );
}

describe('requireAuthRateLimit', () => {
  it('returns 429 when the binding reports the limit was hit', async () => {
    const response = await buildApp(false)();

    expect(response.status).toBe(429);
  });

  it('passes through when the binding reports the request is within limit', async () => {
    const response = await buildApp(true)();

    expect(response.status).toBe(200);
  });
});

function buildStrictApp(success: boolean) {
  const app = new Hono();
  app.use('/protected', requireStrictAuthRateLimit);
  app.get('/protected', (c) => c.json({ ok: true }));

  const fakeBinding = {
    limit: async () => ({ success }),
  };

  return () =>
    app.request(
      '/protected',
      { headers: { 'cf-connecting-ip': '203.0.113.1' } },
      { AUTH_STRICT_RATE_LIMIT: fakeBinding }
    );
}

describe('requireStrictAuthRateLimit', () => {
  it('returns 429 when the binding reports the limit was hit', async () => {
    const response = await buildStrictApp(false)();

    expect(response.status).toBe(429);
  });

  it('passes through when the binding reports the request is within limit', async () => {
    const response = await buildStrictApp(true)();

    expect(response.status).toBe(200);
  });
});
