import {
  applyDowngradeSideEffects,
  isUnconvertedTrial,
  planFromPriceId,
  syncSubscriptionFromStripe,
} from './sync-subscription';
import db from '@/lib/db';
import { prices } from '@/lib/plans';
import {
  cleanupTestData,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import {
  page,
  subscription,
  userFlag,
  verificationRequest,
} from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/revalidate', () => ({
  revalidatePageCache: vi.fn(async () => undefined),
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  pageSlugCacheTag: (slug: string, domain: string) =>
    `page-slug-${slug}-${domain}`,
}));
vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));
vi.mock('@sentry/cloudflare', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let subscriptionId: string;
let pageId: string;

beforeAll(async () => {
  userId = (await createTestUser(`sync-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `sync-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      status: 'trialing',
      referenceId: organizationId,
      stripeCustomerId: `cus_sync_${suffix}`,
      stripeSubscriptionId: `sub_sync_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  pageId = (await createTestPage({ organizationId, suffix: `sync-${suffix}` }))
    .id;
  await db
    .update(page)
    .set({ verifiedAt: new Date() })
    .where(eq(page.id, pageId));
  await db.insert(verificationRequest).values({
    pageId,
    requestedByUserId: userId,
    requestedPageTitle: 'x',
  });
});

afterAll(async () => {
  await db
    .delete(verificationRequest)
    .where(eq(verificationRequest.pageId, pageId));
  await db.delete(userFlag).where(eq(userFlag.userId, userId));
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

describe('planFromPriceId', () => {
  it('maps every known price in both environments', () => {
    expect(planFromPriceId(prices.development.premium)).toBe('premium');
    expect(planFromPriceId(prices.production.team)).toBe('team');
    expect(planFromPriceId(prices.production.freeLegacy)).toBe('freeLegacy');
    expect(planFromPriceId('price_unknown')).toBeNull();
  });
});

describe('isUnconvertedTrial', () => {
  const t = 1_800_000_000;
  it('is true when the subscription ended at the trial end', () => {
    expect(isUnconvertedTrial({ trial_end: t, ended_at: t })).toBe(true);
    expect(isUnconvertedTrial({ trial_end: t, ended_at: t + 30 })).toBe(true);
  });
  it('is false when it ran on after the trial or never had one', () => {
    expect(isUnconvertedTrial({ trial_end: t, ended_at: t + 86_400 })).toBe(
      false
    );
    expect(isUnconvertedTrial({ trial_end: null, ended_at: t })).toBe(false);
    expect(isUnconvertedTrial({ trial_end: t, ended_at: null })).toBe(false);
  });
});

describe('syncSubscriptionFromStripe', () => {
  const stripeSub = (over: Record<string, unknown>) =>
    ({
      id: `sub_sync_${suffix}`,
      customer: `cus_sync_${suffix}`,
      status: 'active',
      items: { data: [{ price: { id: prices.development.premium } }] },
      current_period_start: 1_800_000_000,
      current_period_end: 1_802_592_000,
      cancel_at_period_end: false,
      trial_start: null,
      trial_end: null,
      ended_at: null,
      metadata: { organizationId },
      ...over,
    }) as never;

  it('mirrors an activation and reports the tier change', async () => {
    const result = await syncSubscriptionFromStripe(stripeSub({}));

    expect(result).toEqual({
      organizationId,
      previousTier: 'premium',
      tier: 'premium',
    });
    const row = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, subscriptionId),
    });
    expect(row?.status).toBe('active');
    expect(row?.periodEnd?.getTime()).toBe(1_802_592_000 * 1000);
  });

  it('keeps the current plan when the price id is unknown and the status is entitled', async () => {
    const result = await syncSubscriptionFromStripe(
      stripeSub({ items: { data: [{ price: { id: 'price_unmapped' } }] } })
    );

    expect(result?.tier).toBe('premium');
    const row = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, subscriptionId),
    });
    expect(row?.plan).toBe('premium');
  });

  it('downgrades to free on cancellation and applies side effects', async () => {
    const result = await syncSubscriptionFromStripe(
      stripeSub({ status: 'canceled', ended_at: 1_802_592_000 })
    );

    expect(result?.tier).toBe('free');
    const row = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, subscriptionId),
    });
    expect(row?.plan).toBe('freeLegacy');
    expect(row?.status).toBe('canceled');

    const pageRow = await db.query.page.findFirst({
      where: (p, { eq }) => eq(p.id, pageId),
    });
    expect(pageRow?.verifiedAt).toBeNull();
    const request = await db.query.verificationRequest.findFirst({
      where: (r, { eq }) => eq(r.pageId, pageId),
    });
    expect(request?.status).toBe('CANCELLED');
    const flag = await db.query.userFlag.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.userId, userId), eq(f.key, 'showFreeDowngradeNotice')),
    });
    expect(flag?.value).toBe(true);
  });

  it('returns null for a subscription it cannot attribute to an org', async () => {
    const result = await syncSubscriptionFromStripe(
      stripeSub({ id: 'sub_nope', customer: 'cus_nope', metadata: {} })
    );

    expect(result).toBeNull();
  });
});

describe('applyDowngradeSideEffects', () => {
  it('is idempotent', async () => {
    await applyDowngradeSideEffects(organizationId);
    await applyDowngradeSideEffects(organizationId);
    const flags = await db
      .select()
      .from(userFlag)
      .where(eq(userFlag.userId, userId));
    expect(
      flags.filter((f) => f.key === 'showFreeDowngradeNotice')
    ).toHaveLength(1);
  });

  it('can be dismissed through POST /flags/hide-free-downgrade-notice', async () => {
    const { createApp } = await import('@/app');
    const { testEnv } = await import('@/test/env');
    const response = await createApp().request(
      '/flags/hide-free-downgrade-notice',
      { method: 'POST' },
      testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
    );
    expect(response.status).toBe(200);
    const flag = await db.query.userFlag.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.userId, userId), eq(f.key, 'showFreeDowngradeNotice')),
    });
    expect(flag?.value).toBe(false);
  });
});
