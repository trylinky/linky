import { createApp } from './app';
import { describe, expect, it } from 'vitest';

const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
  // Cloudflare's native Rate Limiting binding, not KV — see the comment on
  // `AUTH_RATE_LIMIT` in env.ts. `limit()` always succeeds here so these
  // tests aren't rate-limited against each other.
  AUTH_RATE_LIMIT: {
    limit: async () => ({ success: true }),
  },
} as unknown as Parameters<ReturnType<typeof createApp>['request']>[2];

describe('app shell', () => {
  it('serves the root message', async () => {
    const response = await createApp().request('/', {}, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: 'Welcome to the Linky API',
    });
  });

  it('serves ping', async () => {
    const response = await createApp().request('/ping', {}, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ping: 'pong' });
  });

  it('defaults to no-store so nothing is cached by accident', async () => {
    const response = await createApp().request('/ping', {}, env);

    expect(response.headers.get('cache-control')).toBe(
      'no-store, must-revalidate'
    );
  });

  it('returns 401 from /session/me without a session', async () => {
    const response = await createApp().request('/session/me', {}, env);

    expect(response.status).toBe(401);
  });

  it('returns 404 for an unknown path', async () => {
    const response = await createApp().request('/nope', {}, env);

    expect(response.status).toBe(404);
  });
});
