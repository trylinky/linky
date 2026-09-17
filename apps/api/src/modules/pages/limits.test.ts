import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestBlock,
  createTestOrganization,
  createTestPage,
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

vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));
vi.mock('@/lib/revalidate', () => ({
  revalidatePageCache: vi.fn(async () => undefined),
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  pageSlugCacheTag: (slug: string, domain: string) =>
    `page-slug-${slug}-${domain}`,
}));

const suffix = randomUUID().slice(0, 8);

let organizationId: string;
let userId: string;
let subscriptionId: string;
let pageId: string;
let pageSlug: string;

beforeAll(async () => {
  userId = (await createTestUser(`lim-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `lim-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'canceled',
      referenceId: organizationId,
      stripeCustomerId: `cus_lim_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;

  const testPage = await createTestPage({
    organizationId,
    suffix: `lim-${suffix}`,
  });
  pageId = testPage.id;
  pageSlug = testPage.slug;
  for (let i = 0; i < 6; i += 1) {
    await createTestBlock({ pageId, type: 'content' });
  }
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const session = () => ({
  user: { id: userId },
  activeOrganizationId: organizationId,
});

const addBlock = () =>
  createApp().request(
    '/blocks/add',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        block: { id: randomUUID(), type: 'content' },
        pageSlug,
      }),
    },
    testEnv(session())
  );

describe('free plan limits', () => {
  it('refuses a second page with 402 UPGRADE_REQUIRED', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await createApp().request(
      '/pages',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The gate fires before any insert, so the theme id never has to exist.
        body: JSON.stringify({
          slug: `lim-second-${suffix}`,
          themeId: 'unused',
        }),
      },
      testEnv(session())
    );

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.code).toBe('UPGRADE_REQUIRED');
    expect(body.error.feature).toBe('pages');
  });

  it('refuses a seventh block with 402 UPGRADE_REQUIRED', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await addBlock();

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.feature).toBe('blocks');
  });

  it('allows the same block add when the paywall is not enforced', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'false');

    const response = await addBlock();

    expect(response.status).toBe(200);
  });
});
