import { createApp } from '@/app';
import db from '@/lib/db';
import { cleanupTestData, createTestBlock, createTestOrganization, createTestPage } from '@/test/fixtures';
import { page } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const suffix = randomUUID().slice(0, 8);

const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
} as unknown as Parameters<ReturnType<typeof createApp>['request']>[2];

let app: ReturnType<typeof createApp>;
let organizationId: string;
let pageId: string;
let pageSlug: string;

beforeAll(async () => {
  organizationId = (await createTestOrganization({ suffix: `marketing-${suffix}` })).id;
  const testPage = await createTestPage({ organizationId, suffix: `marketing-${suffix}` });
  pageId = testPage.id;
  pageSlug = testPage.slug;

  await db.update(page).set({ isFeatured: true }).where(eq(page.id, pageId));

  await createTestBlock({
    pageId,
    type: 'header',
    data: { title: 'A featured headline', description: 'A featured description' },
  });

  app = createApp();
});

afterAll(async () => {
  await cleanupTestData({ pageIds: [pageId], organizationIds: [organizationId] });
});

describe('GET /marketing/featured-pages', () => {
  it('returns featured, published pages with their header title and description', async () => {
    const response = await app.request('/marketing/featured-pages', {}, env);

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      id: string;
      slug: string;
      headerTitle: string;
      headerDescription: string;
    }[];

    const found = body.find((entry) => entry.id === pageId);

    expect(found).toEqual({
      id: pageId,
      slug: pageSlug,
      headerTitle: 'A featured headline',
      headerDescription: 'A featured description',
    });
  });
});
