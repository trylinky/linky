import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { subscription } from '@trylinky/db/schema';
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

const retrieve = vi.fn(async () => ({
  deleted: false,
  invoice_settings: { default_payment_method: 'pm_test' },
}));
vi.mock('@/lib/stripe', () => ({
  stripeClient: { customers: { retrieve: () => retrieve() } },
}));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let subscriptionId: string;

beforeAll(async () => {
  userId = (await createTestUser(`elig-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `elig-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'active',
      referenceId: organizationId,
      stripeCustomerId: `cus_elig_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
});

afterAll(async () => {
  await cleanupTestData({
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => {
  retrieve.mockClear();
});

const get = () =>
  createApp().request(
    '/billing/upgrade-eligibility',
    {},
    testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
  );

describe('GET /billing/upgrade-eligibility', () => {
  it('sends a legacy free organisation straight to checkout', async () => {
    const response = await get();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({
      canUpgrade: true,
      nextPlan: 'premium',
      nextStep: 'checkout',
      message: null,
      currentPlan: 'freeLegacy',
    });
    // A legacy free org has no trial and no payment method to add.
    expect(retrieve).not.toHaveBeenCalled();
  });

  it('still asks Stripe about a premium trial row', async () => {
    await db
      .update(subscription)
      .set({ plan: 'premium', status: 'trialing' })
      .where(eq(subscription.id, subscriptionId));

    const response = await get();

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({
      nextStep: 'completeTrial',
      currentPlan: 'premium',
    });
    expect(retrieve).toHaveBeenCalledTimes(1);
  });
});
