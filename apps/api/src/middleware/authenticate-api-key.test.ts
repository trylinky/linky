import { requireApiKey } from './authenticate-api-key';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

const KEY = 'internal-api-key-value';

function buildApp() {
  const app = new Hono();
  app.use('/protected', requireApiKey);
  app.get('/protected', (c) => c.json({ ok: true }));
  return app;
}

describe('requireApiKey', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts the correct key', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);
    const response = await buildApp().request('/protected', {
      headers: { 'x-api-key': KEY },
    });

    expect(response.status).toBe(200);
  });

  it('rejects a wrong key with a 401', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);
    const response = await buildApp().request('/protected', {
      headers: { 'x-api-key': 'not-the-key' },
    });

    expect(response.status).toBe(401);
  });

  it('rejects when the header is absent', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);
    const response = await buildApp().request('/protected');

    expect(response.status).toBe(401);
  });

  it('rejects rather than allowing everything when no key is configured', async () => {
    vi.stubEnv('INTERNAL_API_KEY', '');
    const response = await buildApp().request('/protected', {
      headers: { 'x-api-key': '' },
    });

    expect(response.status).toBe(401);
  });

  it('rejects a key of a different length without leaking timing', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);
    const response = await buildApp().request('/protected', {
      headers: { 'x-api-key': 'short' },
    });

    expect(response.status).toBe(401);
  });
});
