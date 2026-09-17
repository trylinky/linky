import db from '@/lib/db';
import { prices } from '@/lib/plans';
import { createPosthogClient } from '@/lib/posthog';
import { pageIdCacheTag, revalidatePageCache } from '@/lib/revalidate';
import { resolveTier } from '@/modules/billing/entitlements';
import { captureMessage } from '@sentry/cloudflare';
import type { Plan, Tier } from '@trylinky/common/billing';
import { VerificationRequestStatus } from '@trylinky/db';
import {
  member,
  page,
  subscription,
  userFlag,
  verificationRequest,
} from '@trylinky/db/schema';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import type Stripe from 'stripe';

export const FREE_DOWNGRADE_NOTICE_FLAG = 'showFreeDowngradeNotice';

const PLAN_KEPT_ON_ROW_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function planFromPriceId(priceId: string): Plan | null {
  for (const env of [prices.development, prices.production]) {
    for (const [plan, id] of Object.entries(env)) {
      if (id === priceId) {
        return plan as Plan;
      }
    }
  }
  return null;
}

/**
 * A trial that ended without ever being paid: Stripe ended the subscription
 * at (or within a minute of) the trial end. Used to pick the right email.
 */
export function isUnconvertedTrial(
  sub: Pick<Stripe.Subscription, 'trial_end' | 'ended_at'>
): boolean {
  if (sub.trial_end == null || sub.ended_at == null) {
    return false;
  }
  return sub.ended_at <= sub.trial_end + 60;
}

function toDate(seconds: number | null | undefined): Date | null {
  return seconds == null ? null : new Date(seconds * 1000);
}

/**
 * Mirror a Stripe subscription into the org's Subscription row. Idempotent:
 * every field is derived from the Stripe object, so duplicate or
 * out-of-order webhooks converge on the same row.
 *
 * Returns the tier transition so callers can react (emails, cache), or null
 * when the subscription cannot be attributed to an organisation.
 */
export async function syncSubscriptionFromStripe(
  sub: Stripe.Subscription
): Promise<{ organizationId: string; previousTier: Tier; tier: Tier } | null> {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  // Set by Checkout-created subscriptions (subscription_data.metadata); signup trials have no metadata and fall through to the id lookups.
  const orgIdFromMetadata = sub.metadata?.organizationId;

  const existing =
    (orgIdFromMetadata
      ? await db.query.subscription.findFirst({
          where: (s, { eq }) => eq(s.referenceId, orgIdFromMetadata),
        })
      : undefined) ??
    (await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.stripeSubscriptionId, sub.id),
    })) ??
    (await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.stripeCustomerId, customerId),
    }));

  if (!existing) {
    return null;
  }

  const priceId = sub.items?.data?.[0]?.price?.id;
  const planFromPrice = priceId ? planFromPriceId(priceId) : null;

  const statusKeepsPlan = PLAN_KEPT_ON_ROW_STATUSES.has(sub.status);

  if (statusKeepsPlan && priceId && !planFromPrice) {
    // Price-config drift (a price id not in lib/plans.ts) must never
    // downgrade a paying org. Keep the plan the row already has and shout.
    captureMessage(
      `Unknown Stripe price ${priceId} on subscription ${sub.id}; keeping plan ${existing.plan}`
    );
  }

  // A canceled/unpaid subscription is recorded as freeLegacy so the row
  // reads correctly even to code that only looks at `plan`.
  const plan: Plan = statusKeepsPlan
    ? (planFromPrice ?? (existing.plan as Plan))
    : 'freeLegacy';

  const previousTier = resolveTier(existing);

  const [updated] = await db
    .update(subscription)
    .set({
      plan,
      status: sub.status,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
      periodStart: toDate(sub.current_period_start),
      periodEnd: toDate(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      trialStart: toDate(sub.trial_start),
      trialEnd: toDate(sub.trial_end),
    })
    .where(eq(subscription.id, existing.id))
    .returning();

  const tier = resolveTier(updated);
  const organizationId = existing.referenceId;

  if (tier !== previousTier) {
    if (tier === 'free') {
      await applyDowngradeSideEffects(organizationId);
    }

    const pages = await db
      .select({ id: page.id })
      .from(page)
      .where(
        and(eq(page.organizationId, organizationId), isNull(page.deletedAt))
      );
    void revalidatePageCache(pages.map((p) => pageIdCacheTag(p.id)));

    if (tier !== 'free') {
      const posthog = createPosthogClient();
      posthog?.capture({
        distinctId: organizationId,
        event: 'subscription-activated',
        properties: { plan, fromStatus: existing.status, organizationId },
      });
      if (posthog) void posthog.shutdown();
    }
  }

  return { organizationId, previousTier, tier };
}

/**
 * Everything that changes in the product when an org drops to Free:
 * badges come off, pending verification requests are cancelled, and every
 * member sees the one-time "you're on Free now" notice. Safe to call twice.
 */
export async function applyDowngradeSideEffects(organizationId: string) {
  const orgPageIds = db
    .select({ id: page.id })
    .from(page)
    .where(eq(page.organizationId, organizationId));

  await db
    .update(page)
    .set({ verifiedAt: null })
    .where(
      and(
        eq(page.organizationId, organizationId),
        isNull(page.deletedAt),
        isNotNull(page.verifiedAt)
      )
    );

  await db
    .update(verificationRequest)
    .set({ status: VerificationRequestStatus.CANCELLED })
    .where(
      and(
        eq(verificationRequest.status, VerificationRequestStatus.PENDING),
        inArray(verificationRequest.pageId, orgPageIds)
      )
    );

  const members = await db
    .select({ userId: member.userId })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  for (const { userId } of members) {
    const existingFlag = await db.query.userFlag.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.userId, userId), eq(f.key, FREE_DOWNGRADE_NOTICE_FLAG)),
      columns: { id: true },
    });

    if (existingFlag) {
      await db
        .update(userFlag)
        .set({ value: true })
        .where(eq(userFlag.id, existingFlag.id));
    } else {
      await db
        .insert(userFlag)
        .values({ userId, key: FREE_DOWNGRADE_NOTICE_FLAG, value: true });
    }
  }
}
