import { handleSubscriptionCreated } from './handle-subscription-created';
import db from '@/lib/db';
import { prices } from '@/lib/plans';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { subscription, userFlag } from '@trylinky/db/schema';
import { inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sendSubscriptionUpgradedPremiumEmail = vi.fn();
const sendSubscriptionUpgradedTeamEmail = vi.fn();
vi.mock('@/modules/notifications/service', () => ({
  sendSubscriptionUpgradedPremiumEmail: (...args: unknown[]) =>
    sendSubscriptionUpgradedPremiumEmail(...args),
  sendSubscriptionUpgradedTeamEmail: (...args: unknown[]) =>
    sendSubscriptionUpgradedTeamEmail(...args),
}));
vi.mock('@/modules/slack/service', () => ({ sendSlackMessage: vi.fn() }));
vi.mock('@/lib/stripe', () => ({ stripeClient: {} }));
vi.mock('@/lib/revalidate', () => ({
  revalidatePageCache: vi.fn(async () => undefined),
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  pageSlugCacheTag: (s: string, d: string) => `page-slug-${s}-${d}`,
}));
vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

const suffix = randomUUID().slice(0, 8);
const userIds: string[] = [];
const organizationIds: string[] = [];
const subscriptionIds: string[] = [];

beforeEach(() => {
  sendSubscriptionUpgradedPremiumEmail.mockClear();
});

afterAll(async () => {
  await db.delete(userFlag).where(inArray(userFlag.userId, userIds));
  await cleanupTestData({ subscriptionIds, organizationIds, userIds });
});

describe('handleSubscriptionCreated (premium via Checkout)', () => {
  it('flips a free org to premium and emails its members', async () => {
    const owner = await createTestUser(`created-${suffix}`);
    userIds.push(owner.id);
    const org = await createTestOrganization({
      suffix: `created-${suffix}`,
      ownerId: owner.id,
    });
    organizationIds.push(org.id);
    const [row] = await db
      .insert(subscription)
      .values({
        plan: 'freeLegacy',
        status: 'canceled',
        referenceId: org.id,
        stripeCustomerId: `cus_created_${suffix}`,
      })
      .returning();
    subscriptionIds.push(row.id);

    await handleSubscriptionCreated({
      type: 'customer.subscription.created',
      data: {
        object: {
          id: `sub_created_${suffix}`,
          customer: `cus_created_${suffix}`,
          status: 'active',
          items: { data: [{ price: { id: prices.development.premium } }] },
          current_period_start: 1_800_000_000,
          current_period_end: 1_802_592_000,
          cancel_at_period_end: false,
          trial_start: null,
          trial_end: null,
          ended_at: null,
          metadata: { organizationId: org.id },
        },
      },
    } as unknown as Stripe.Event);

    const updated = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, row.id),
    });
    expect(updated?.plan).toBe('premium');
    expect(updated?.status).toBe('active');
    expect(sendSubscriptionUpgradedPremiumEmail).toHaveBeenCalledWith({
      email: owner.email,
    });
  });
});
