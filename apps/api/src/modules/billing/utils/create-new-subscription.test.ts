import { createNewSubscription } from './create-new-subscription';
import { cleanupTestData, createTestOrganization } from '@/test/fixtures';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/stripe', () => ({ stripeClient: {} }));

const suffix = randomUUID().slice(0, 8);

const organizationIds: string[] = [];
const subscriptionIds: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(async () => {
  await cleanupTestData({ subscriptionIds, organizationIds });
});

describe('createNewSubscription', () => {
  it('inserts a 5-seat active row for a team plan when a stripe subscription id is supplied', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const org = await createTestOrganization({ suffix: `sub-team-${suffix}` });
    organizationIds.push(org.id);

    const created = await createNewSubscription({
      plan: 'team',
      stripeCustomerId: `cus_${suffix}_team`,
      stripeSubscriptionId: `sub_${suffix}_team`,
      referenceId: org.id,
      periodStart: new Date(),
      periodEnd: new Date(),
    });

    expect(created).toBeDefined();
    subscriptionIds.push(created!.id);

    expect(created).toMatchObject({
      plan: 'team',
      referenceId: org.id,
      stripeSubscriptionId: `sub_${suffix}_team`,
      status: 'active',
      seats: 5,
    });
  });

  it('inserts a 1-seat active row for a premium plan when a stripe subscription id is supplied', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const org = await createTestOrganization({
      suffix: `sub-premium-${suffix}`,
    });
    organizationIds.push(org.id);

    const created = await createNewSubscription({
      plan: 'premium',
      stripeCustomerId: `cus_${suffix}_premium`,
      stripeSubscriptionId: `sub_${suffix}_premium`,
      referenceId: org.id,
      periodStart: new Date(),
      periodEnd: new Date(),
    });

    expect(created).toBeDefined();
    subscriptionIds.push(created!.id);

    expect(created).toMatchObject({
      plan: 'premium',
      referenceId: org.id,
      stripeSubscriptionId: `sub_${suffix}_premium`,
      status: 'active',
      seats: 1,
    });
  });
});
