import { handleSubscriptionDeleted } from './handle-subscription-deleted';
import db from '@/lib/db';
import { cleanupTestData, createTestOrganization, createTestUser } from '@/test/fixtures';
import { member, subscription } from '@trylinky/db/schema';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type Stripe from 'stripe';

const sendSubscriptionDeletedEmail = vi.fn();
const sendSlackMessage = vi.fn();

vi.mock('@/modules/notifications/service', () => ({
  sendSubscriptionDeletedEmail: (...args: unknown[]) => sendSubscriptionDeletedEmail(...args),
}));

vi.mock('@/modules/slack/service', () => ({
  sendSlackMessage: (...args: unknown[]) => sendSlackMessage(...args),
}));

const suffix = randomUUID().slice(0, 8);

const userIds: string[] = [];
const organizationIds: string[] = [];
const subscriptionIds: string[] = [];

function fakeEvent({
  id,
  customer,
  comment,
}: {
  id: string;
  customer: string;
  comment: string | null;
}): Stripe.Event {
  return {
    data: {
      object: {
        id,
        customer,
        cancellation_details: { comment },
      },
    },
  } as unknown as Stripe.Event;
}

beforeEach(() => {
  sendSubscriptionDeletedEmail.mockClear();
  sendSlackMessage.mockClear();
});

afterAll(async () => {
  await cleanupTestData({ subscriptionIds, organizationIds, userIds });
});

describe('handleSubscriptionDeleted', () => {
  it('cancels the subscription and emails only members with an email', async () => {
    const withEmail = await createTestUser(`del-with-email-${suffix}`);
    const withoutEmail = await createTestUser(`del-without-email-${suffix}`, { email: null });
    userIds.push(withEmail.id, withoutEmail.id);

    const org = await createTestOrganization({ suffix: `del-${suffix}`, ownerId: withEmail.id });
    organizationIds.push(org.id);
    await db.insert(member).values({ userId: withoutEmail.id, organizationId: org.id, role: 'member' });

    const stripeSubscriptionId = `sub_${suffix}_del`;
    const stripeCustomerId = `cus_${suffix}_del`;

    const [sub] = await db
      .insert(subscription)
      .values({
        plan: 'premium',
        referenceId: org.id,
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'active',
      })
      .returning();
    subscriptionIds.push(sub.id);

    await handleSubscriptionDeleted(
      fakeEvent({ id: stripeSubscriptionId, customer: stripeCustomerId, comment: null })
    );

    const updated = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, sub.id),
    });

    expect(updated?.status).toBe('canceled');
    expect(updated?.plan).toBe('freeLegacy');

    expect(sendSubscriptionDeletedEmail).toHaveBeenCalledTimes(1);
    expect(sendSubscriptionDeletedEmail).toHaveBeenCalledWith(withEmail.email);
  });

  it('sends no email when the subscription was auto-upgraded to team', async () => {
    const owner = await createTestUser(`del-upgraded-${suffix}`);
    userIds.push(owner.id);

    const org = await createTestOrganization({ suffix: `del-upgraded-${suffix}`, ownerId: owner.id });
    organizationIds.push(org.id);

    const stripeSubscriptionId = `sub_${suffix}_upgraded`;
    const stripeCustomerId = `cus_${suffix}_upgraded`;

    const [sub] = await db
      .insert(subscription)
      .values({
        plan: 'premium',
        referenceId: org.id,
        stripeCustomerId,
        stripeSubscriptionId,
        status: 'active',
      })
      .returning();
    subscriptionIds.push(sub.id);

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
  });
});
