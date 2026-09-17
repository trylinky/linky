import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { subscription, verificationRequest } from '@trylinky/db/schema';
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

vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let subscriptionId: string;
let pageId: string;

beforeAll(async () => {
  userId = (await createTestUser(`vr-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `vr-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      status: 'active',
      referenceId: organizationId,
      stripeCustomerId: `cus_vr_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  pageId = (await createTestPage({ organizationId, suffix: `vr-${suffix}` }))
    .id;
});

afterAll(async () => {
  await db
    .delete(verificationRequest)
    .where(eq(verificationRequest.pageId, pageId));
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => vi.unstubAllEnvs());

const post = () =>
  createApp().request(
    '/verification-requests',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pageId, requestedPageTitle: 'My Page' }),
    },
    testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
  );

describe('POST /verification-requests', () => {
  it('creates a pending request for a premium org', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await post();

    expect(response.status).toBe(200);
    const request = await db.query.verificationRequest.findFirst({
      where: (r, { eq }) => eq(r.pageId, pageId),
    });
    expect(request?.status).toBe('PENDING');
  });

  it('refuses a duplicate while one is pending', async () => {
    const response = await post();

    expect(response.status).toBe(400);
  });

  it('returns 402 once the org is free', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');
    await db
      .delete(verificationRequest)
      .where(eq(verificationRequest.pageId, pageId));
    await db
      .update(subscription)
      .set({ plan: 'freeLegacy', status: 'canceled' })
      .where(eq(subscription.id, subscriptionId));

    const response = await post();

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.feature).toBe('verification');
  });
});
