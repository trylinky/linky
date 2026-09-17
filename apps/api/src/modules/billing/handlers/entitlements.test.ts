import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { subscription } from '@trylinky/db/schema';
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

const suffix = randomUUID().slice(0, 8);

let organizationId: string;
let userId: string;
let subscriptionId: string;

beforeAll(async () => {
  userId = (await createTestUser(`ent-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `ent-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      status: 'trialing',
      referenceId: organizationId,
      stripeCustomerId: `cus_ent_${suffix}`,
      trialEnd: new Date(Date.now() + 5 * 86_400_000),
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
  vi.unstubAllEnvs();
});

describe('GET /billing/entitlements', () => {
  it('returns 401 without a session', async () => {
    const response = await createApp().request(
      '/billing/entitlements',
      {},
      testEnv()
    );

    expect(response.status).toBe(401);
  });

  it('returns the active org entitlements with trial info', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await createApp().request(
      '/billing/entitlements',
      {},
      testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, any>;
    expect(body.tier).toBe('premium');
    expect(body.trial.active).toBe(true);
    expect(body.trial.daysLeft).toBe(5);
    expect(body.limits.blocksPerPage).toBe(100);
  });
});
