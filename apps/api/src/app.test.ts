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

describe('ported modules — batch 1', () => {
  it('rejects an unauthenticated flags read', async () => {
    const response = await createApp().request('/flags/me', {}, env);
    expect(response.status).toBe(401);
  });

  it('404s a reaction read for an unknown page', async () => {
    const response = await createApp().request(
      '/reactions?pageId=00000000-0000-0000-0000-000000000000',
      {},
      env
    );
    expect(response.status).toBe(404);
  });

  it('400s a reaction read with no pageId', async () => {
    const response = await createApp().request('/reactions', {}, env);
    expect(response.status).toBe(400);
  });
});

describe('ported modules — batch 3', () => {
  // The brief sketched this as `/pages/slug-availability` — the real
  // Fastify registration (and the port) mounts it under `/internal/`.
  it('serves slug availability for an unclaimed slug', async () => {
    const response = await createApp().request(
      '/pages/internal/slug-availability?slug=definitely-not-taken-abcdef',
      {},
      env
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ isAvailable: true });
  });

  it('requires an internal API key to load a page by id', async () => {
    const response = await createApp().request(
      '/pages/00000000-0000-0000-0000-000000000000/internal/load',
      {},
      env
    );

    expect(response.status).toBe(401);
  });

  it('requires a session to list organizations', async () => {
    const response = await createApp().request('/organizations/me', {}, env);
    expect(response.status).toBe(401);
  });

  it('requires a session to list integrations', async () => {
    const response = await createApp().request('/integrations/me', {}, env);
    expect(response.status).toBe(401);
  });
});

describe('ported modules — batch 4', () => {
  it('requires a session to upload an asset', async () => {
    const response = await createApp().request(
      '/assets/upload',
      { method: 'POST' },
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires a session to read page analytics', async () => {
    const response = await createApp().request(
      '/analytics/pages/00000000-0000-0000-0000-000000000000',
      {},
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires the internal API key to create an orchestration', async () => {
    const response = await createApp().request(
      '/orchestrators/create',
      { method: 'POST' },
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires the internal API key to validate an orchestration', async () => {
    const response = await createApp().request(
      '/orchestrators/validate',
      { method: 'POST' },
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires the internal API key to run the TikTok orchestrator', async () => {
    const response = await createApp().request(
      '/orchestrators/tiktok/create',
      { method: 'POST' },
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires a session to start the TikTok OAuth redirect', async () => {
    const response = await createApp().request(
      '/services/tiktok?blockId=00000000-0000-0000-0000-000000000000',
      {},
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires a session to start the Instagram OAuth redirect (legacy)', async () => {
    const response = await createApp().request(
      '/services/instagram?blockId=00000000-0000-0000-0000-000000000000',
      {},
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires a session to start the Instagram OAuth redirect (v2)', async () => {
    const response = await createApp().request(
      '/services/instagram/v2?blockId=00000000-0000-0000-0000-000000000000',
      {},
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires a session to start the Threads OAuth redirect', async () => {
    const response = await createApp().request(
      '/services/threads?blockId=00000000-0000-0000-0000-000000000000',
      {},
      env
    );
    expect(response.status).toBe(401);
  });

  it('requires a session to start the Spotify OAuth redirect', async () => {
    const response = await createApp().request(
      '/services/spotify?blockId=00000000-0000-0000-0000-000000000000',
      {},
      env
    );
    expect(response.status).toBe(401);
  });
});
