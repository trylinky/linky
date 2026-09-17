import { handleSubscriptionDeleted } from './handle-subscription-deleted';
import db from '@/lib/db';
import { prices } from '@/lib/plans';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { member, subscription, userFlag } from '@trylinky/db/schema';
import { inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sendSubscriptionDeletedEmail = vi.fn();
const sendTrialEndedEmail = vi.fn();
const sendSlackMessage = vi.fn();

vi.mock('@/modules/notifications/service', () => ({
  sendSubscriptionDeletedEmail: (...args: unknown[]) =>
    sendSubscriptionDeletedEmail(...args),
  sendTrialEndedEmail: (...args: unknown[]) => sendTrialEndedEmail(...args),
}));
vi.mock('@/modules/slack/service', () => ({
  sendSlackMessage: (...args: unknown[]) => sendSlackMessage(...args),
}));
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

function fakeEvent({
  id,
  customer,
  comment = null,
  trialEnd = null,
  endedAt = 1_805_000_000,
}: {
  id: string;
  customer: string;
  comment?: string | null;
  trialEnd?: number | null;
  endedAt?: number;
}): Stripe.Event {
  return {
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id,
        customer,
        status: 'canceled',
        items: { data: [{ price: { id: prices.development.premium } }] },
        current_period_start: 1_800_000_000,
        current_period_end: endedAt,
        cancel_at_period_end: false,
        trial_start: trialEnd ? 1_800_000_000 : null,
        trial_end: trialEnd,
        ended_at: endedAt,
        cancellation_details: { comment },
        metadata: {},
      },
    },
  } as unknown as Stripe.Event;
}

async function seed(label: string, status: string) {
  const owner = await createTestUser(`del-${label}-${suffix}`);
  userIds.push(owner.id);
  const org = await createTestOrganization({
    suffix: `del-${label}-${suffix}`,
    ownerId: owner.id,
  });
  organizationIds.push(org.id);
  const stripeSubscriptionId = `sub_${suffix}_${label}`;
  const stripeCustomerId = `cus_${suffix}_${label}`;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      referenceId: org.id,
      stripeCustomerId,
      stripeSubscriptionId,
      status,
    })
    .returning();
  subscriptionIds.push(sub.id);
  return { owner, org, sub, stripeSubscriptionId, stripeCustomerId };
}

beforeEach(() => {
  sendSubscriptionDeletedEmail.mockClear();
  sendTrialEndedEmail.mockClear();
  sendSlackMessage.mockClear();
});

afterAll(async () => {
  await db.delete(userFlag).where(inArray(userFlag.userId, userIds));
  await cleanupTestData({ subscriptionIds, organizationIds, userIds });
});

describe('handleSubscriptionDeleted', () => {
  it('cancels the subscription and emails only members with an email', async () => {
    const { owner, org, sub, stripeSubscriptionId, stripeCustomerId } =
      await seed('with-email', 'active');
    const withoutEmail = await createTestUser(`del-without-email-${suffix}`, {
      email: null,
    });
    userIds.push(withoutEmail.id);
    await db.insert(member).values({
      userId: withoutEmail.id,
      organizationId: org.id,
      role: 'member',
    });

    await handleSubscriptionDeleted(
      fakeEvent({ id: stripeSubscriptionId, customer: stripeCustomerId })
    );

    const updated = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, sub.id),
    });
    expect(updated?.status).toBe('canceled');
    expect(updated?.plan).toBe('freeLegacy');
    expect(sendSubscriptionDeletedEmail).toHaveBeenCalledTimes(1);
    expect(sendSubscriptionDeletedEmail).toHaveBeenCalledWith(owner.email);
    expect(sendTrialEndedEmail).not.toHaveBeenCalled();
  });

  it('sends the trial-ended email for an unconverted trial', async () => {
    const { owner, stripeSubscriptionId, stripeCustomerId } = await seed(
      'trial',
      'trialing'
    );

    await handleSubscriptionDeleted(
      fakeEvent({
        id: stripeSubscriptionId,
        customer: stripeCustomerId,
        trialEnd: 1_801_209_600,
        endedAt: 1_801_209_600,
      })
    );

    expect(sendTrialEndedEmail).toHaveBeenCalledWith(owner.email);
    expect(sendSubscriptionDeletedEmail).not.toHaveBeenCalled();
    const flag = await db.query.userFlag.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.userId, owner.id), eq(f.key, 'showFreeDowngradeNotice')),
    });
    expect(flag?.value).toBe(true);
  });

  it('sends no email when the subscription was auto-upgraded to team', async () => {
    const { sub, stripeSubscriptionId, stripeCustomerId } = await seed(
      'upgraded',
      'active'
    );

    await handleSubscriptionDeleted(
      fakeEvent({
        id: stripeSubscriptionId,
        customer: stripeCustomerId,
        comment: 'LINKY_AUTO_UPGRADED_TO_TEAM',
      })
    );

    const updated = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, sub.id),
    });
    expect(updated?.status).toBe('canceled');
    expect(updated?.plan).toBe('freeLegacy');
    expect(sendSubscriptionDeletedEmail).not.toHaveBeenCalled();
    expect(sendTrialEndedEmail).not.toHaveBeenCalled();
  });
});
