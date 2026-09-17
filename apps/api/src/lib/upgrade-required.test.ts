import { upgradeRequired } from './upgrade-required';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

describe('upgradeRequired', () => {
  it('returns the shared 402 shape for a feature', async () => {
    const app = new Hono();
    app.get('/x', (c) => upgradeRequired(c as never, 'blocks'));

    const response = await app.request('/x');

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'UPGRADE_REQUIRED',
        feature: 'blocks',
        message: "You've used your 5 free blocks",
        label: 'Upgrade to Premium to add more blocks',
      },
    });
  });
});
