import { createApp } from '@/app';
import { stripeClient } from '@/lib/stripe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
  AUTH_RATE_LIMIT: {
    get: async () => null,
    put: async () => undefined,
    delete: async () => undefined,
  },
} as never;

const SECRET = 'whsec_test_secret';

describe('POST /billing/stripe-webhook', () => {
  beforeEach(() => {
    // Signature verification is pure local crypto and nothing in these two
    // cases should ever reach a Stripe API or the database — fail loudly
    // instead of silently making a real network call if that ever changes.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('unexpected real fetch call in stripe webhook test');
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('rejects a request with no signature', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', SECRET);

    const response = await createApp().request(
      '/billing/stripe-webhook',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'customer.subscription.created' }),
      },
      env
    );

    expect(response.status).toBe(400);
  });

  it('accepts a correctly signed event', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', SECRET);

    // An event type the handler ignores, so this exercises signature
    // verification and nothing else.
    const payload = JSON.stringify({
      id: 'evt_test',
      type: 'invoice.paid',
      data: { object: {} },
    });

    const header = stripeClient.webhooks.generateTestHeaderString({
      payload,
      secret: SECRET,
    });

    const response = await createApp().request(
      '/billing/stripe-webhook',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': header,
        },
        body: payload,
      },
      env
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
  });
});
