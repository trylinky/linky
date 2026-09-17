import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { member, subscription } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const create = vi.fn(async () => ({
  url: 'https://checkout.stripe.com/c/pay/cs_test',
}));
vi.mock('@/lib/stripe', () => ({
  stripeClient: {
    checkout: {
      sessions: { create: (...a: unknown[]) => create(...(a as [])) },
    },
  },
}));
vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let memberUserId: string;
let subscriptionId: string;

beforeAll(async () => {
  userId = (await createTestUser(`up-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `up-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'canceled',
      referenceId: organizationId,
      stripeCustomerId: `cus_up_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  memberUserId = (await createTestUser(`up-member-${suffix}`)).id;
  await db
    .insert(member)
    .values({ userId: memberUserId, organizationId, role: 'member' });
});

afterAll(async () => {
  await cleanupTestData({
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId, memberUserId],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  create.mockClear();
});

const post = () =>
  createApp().request(
    '/billing/upgrade/premium',
    { method: 'POST' },
    testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
  );

describe('POST /billing/upgrade/premium', () => {
  it('creates a Checkout session for the org customer and returns its url', async () => {
    vi.stubEnv('APP_FRONTEND_URL', 'https://lin.ky');

    const response = await post();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_test',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: `cus_up_${suffix}`,
        subscription_data: { metadata: { organizationId } },
        success_url: 'https://lin.ky/edit?showPremiumOnboarding=true',
      })
    );
  });

  it('refuses a member who cannot manage billing', async () => {
    const response = await createApp().request(
      '/billing/upgrade/premium',
      { method: 'POST' },
      testEnv({
        user: { id: memberUserId },
        activeOrganizationId: organizationId,
      })
    );

    expect(response.status).toBe(403);
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses when the org is already entitled', async () => {
    await db
      .update(subscription)
      .set({ plan: 'premium', status: 'active' })
      .where(eq(subscription.id, subscriptionId));

    const response = await post();

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
