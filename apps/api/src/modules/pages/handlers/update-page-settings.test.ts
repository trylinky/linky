import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
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
let slug: string;
const pageIds: string[] = [];

beforeAll(async () => {
  userId = (await createTestUser(`ps-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `ps-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'canceled',
      referenceId: organizationId,
      stripeCustomerId: `cus_ps_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  const testPage = await createTestPage({
    organizationId,
    suffix: `ps-${suffix}`,
  });
  pageId = testPage.id;
  slug = testPage.slug;
  pageIds.push(pageId);
});

afterAll(async () => {
  await cleanupTestData({
    pageIds,
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => vi.unstubAllEnvs());

const post = (body: unknown) =>
  createApp().request(
    `/pages/${pageId}/settings`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
  );

const currentPage = () =>
  db.query.page.findFirst({ where: (p, { eq }) => eq(p.id, pageId) });

describe('POST /pages/:pageId/settings', () => {
  it('updates the title and keeps the page published', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await post({
      pageSlug: slug,
      metaTitle: 'New title',
      published: true,
    });

    expect(response.status).toBe(200);
    const row = await currentPage();
    expect(row?.metaTitle).toBe('New title');
    expect(row?.publishedAt).not.toBeNull();
  });

  it('refuses to unpublish on the free tier', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await post({
      pageSlug: slug,
      metaTitle: 'New title',
      published: false,
    });

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.feature).toBe('privatePages');
    expect((await currentPage())?.publishedAt).not.toBeNull();
  });

  it('rejects a slug already in use with a field error', async () => {
    const other = await createTestPage({
      organizationId,
      suffix: `ps-other-${suffix}`,
    });
    pageIds.push(other.id);

    const response = await post({
      pageSlug: other.slug,
      metaTitle: 'x',
      published: true,
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.field).toBe('pageSlug');
  });
});
