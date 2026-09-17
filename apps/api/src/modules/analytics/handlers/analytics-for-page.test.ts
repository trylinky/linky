import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { page, subscription } from '@trylinky/db/schema';
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
  userId = (await createTestUser(`an-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `an-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'canceled',
      referenceId: organizationId,
      stripeCustomerId: `cus_an_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  const [row] = await db
    .insert(page)
    .values({
      slug: `an-page-${suffix}`,
      config: [],
      publishedAt: new Date(),
      organizationId,
      // Older than the 3-day minimum so only the plan gate can block it.
      createdAt: new Date(Date.now() - 10 * 86_400_000),
    })
    .returning();
  pageId = row.id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => vi.unstubAllEnvs());

describe('GET /analytics/pages/:pageId', () => {
  it('returns 402 for a free org before any Tinybird call', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    // The global fetch tripwire would throw if the handler reached Tinybird.
    const response = await createApp().request(
      `/analytics/pages/${pageId}`,
      {},
      testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
    );

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.feature).toBe('analytics');
  });
});
