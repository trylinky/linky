import {
  checkUserHasAccessToPage,
  createNewPage,
  deletePage,
  getPageBlocks,
  updatePageLayout,
} from './service';
import db from '@/lib/db';
import {
  cleanupTestData,
  createTestBlock,
  createTestOrganization,
  createTestPage,
  createTestTheme,
  createTestUser,
} from '@/test/fixtures';
import { block, page } from '@trylinky/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const suffix = randomUUID().slice(0, 8);

let ownerId: string;
let strangerId: string;
let organizationId: string;
let themeId: string;

// Ids of every page/theme this file creates, gathered as tests run so
// cleanup can delete them all afterward. createNewPage/deletePage create
// pages outside of createTestPage, so their ids are pushed on manually.
const pageIds: string[] = [];
const themeIds: string[] = [];

beforeAll(async () => {
  ownerId = (await createTestUser(`pages-svc-owner-${suffix}`)).id;
  strangerId = (await createTestUser(`pages-svc-stranger-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `pages-svc-${suffix}`, ownerId })
  ).id;
  const theme = await createTestTheme({ createdById: ownerId, organizationId });
  themeId = theme.id;
  themeIds.push(themeId);
});

afterAll(async () => {
  await cleanupTestData({
    pageIds,
    organizationIds: [organizationId],
    userIds: [ownerId, strangerId],
    themeIds,
  });
});

describe('createNewPage', () => {
  it('creates the page and a header block whose id matches the layout entry', async () => {
    const slug = `pages_svc_create_${suffix}`;

    const result = await createNewPage({ slug, themeId, organizationId });

    expect(result).toEqual({ slug });
    expect('error' in result).toBe(false);

    const [createdPage] = await db
      .select()
      .from(page)
      .where(eq(page.slug, slug));
    expect(createdPage).toBeTruthy();
    pageIds.push(createdPage.id);

    const layout = createdPage.config as Array<{ i: string }>;
    expect(layout).toHaveLength(1);

    const headerBlockId = layout[0].i;

    const blocks = await db
      .select()
      .from(block)
      .where(eq(block.pageId, createdPage.id));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe(headerBlockId);
    expect(blocks[0].type).toBe('header');

    // The mobile layout carries the same header entry.
    expect((createdPage.mobileConfig as Array<{ i: string }>)[0].i).toBe(
      headerBlockId
    );
  });

  it('returns an error object for a slug that already exists', async () => {
    const slug = `pages_svc_dup_${suffix}`;

    const first = await createNewPage({ slug, themeId, organizationId });
    expect('error' in first).toBe(false);
    if (!('error' in first)) {
      const [createdPage] = await db
        .select()
        .from(page)
        .where(eq(page.slug, slug));
      pageIds.push(createdPage.id);
    }

    const second = await createNewPage({ slug, themeId, organizationId });
    expect(second).toEqual({
      error: {
        message: 'Page with this slug already exists',
        field: 'pageSlug',
      },
    });
  });
});

describe('deletePage', () => {
  it('soft-deletes the page, prefixes its slug, and removes its blocks', async () => {
    const testPage = await createTestPage({
      organizationId,
      suffix: `pages-svc-delete-${suffix}`,
    });
    pageIds.push(testPage.id);
    const testBlock = await createTestBlock({
      pageId: testPage.id,
      type: 'content',
    });

    const result = await deletePage(testPage.id);
    expect(result).toBe(true);

    const [updated] = await db
      .select()
      .from(page)
      .where(eq(page.id, testPage.id));
    expect(updated.deletedAt).not.toBeNull();
    expect(updated.slug.startsWith('DELETED-')).toBe(true);
    expect(updated.slug.endsWith(testPage.slug)).toBe(true);

    const remainingBlocks = await db
      .select()
      .from(block)
      .where(eq(block.id, testBlock.id));
    expect(remainingBlocks).toHaveLength(0);
  });

  it('returns false for a page that is already deleted', async () => {
    const testPage = await createTestPage({
      organizationId,
      suffix: `pages-svc-delete-twice-${suffix}`,
    });
    pageIds.push(testPage.id);

    expect(await deletePage(testPage.id)).toBe(true);
    expect(await deletePage(testPage.id)).toBe(false);
  });
});

describe('checkUserHasAccessToPage', () => {
  it('is true for an org member and false for a stranger', async () => {
    const testPage = await createTestPage({
      organizationId,
      suffix: `pages-svc-access-${suffix}`,
    });
    pageIds.push(testPage.id);

    expect(await checkUserHasAccessToPage(testPage.id, ownerId)).toBe(true);
    expect(await checkUserHasAccessToPage(testPage.id, strangerId)).toBe(false);
  });
});

describe('getPageBlocks', () => {
  it('returns blocks ordered by createdAt ascending', async () => {
    const testPage = await createTestPage({
      organizationId,
      suffix: `pages-svc-blocks-${suffix}`,
    });
    pageIds.push(testPage.id);

    const first = await createTestBlock({
      pageId: testPage.id,
      type: 'content',
    });
    const second = await createTestBlock({
      pageId: testPage.id,
      type: 'content',
    });
    const third = await createTestBlock({
      pageId: testPage.id,
      type: 'content',
    });

    const result = await getPageBlocks(testPage.id);

    expect(result).toBeTruthy();
    expect(result!.blocks.map((b) => b.id)).toEqual([
      first.id,
      second.id,
      third.id,
    ]);
  });

  it('returns null for a deleted page', async () => {
    const testPage = await createTestPage({
      organizationId,
      suffix: `pages-svc-blocks-deleted-${suffix}`,
    });
    pageIds.push(testPage.id);

    expect(await deletePage(testPage.id)).toBe(true);
    expect(await getPageBlocks(testPage.id)).toBeNull();
  });
});

describe('updatePageLayout', () => {
  it('filters out layout entries whose id is not a real block on the page', async () => {
    const testPage = await createTestPage({
      organizationId,
      suffix: `pages-svc-layout-${suffix}`,
    });
    pageIds.push(testPage.id);

    const realBlock = await createTestBlock({
      pageId: testPage.id,
      type: 'content',
    });

    const newLayout = {
      sm: [
        { i: realBlock.id, x: 0, y: 0, w: 12, h: 6 },
        { i: 'not-a-real-block-id', x: 0, y: 6, w: 12, h: 6 },
      ],
      xxs: [{ i: 'also-not-real', x: 0, y: 0, w: 12, h: 6 }],
    };

    const result = await updatePageLayout(testPage.id, newLayout);

    expect(result.id).toBe(testPage.id);
    expect(result.sm).toEqual([{ i: realBlock.id, x: 0, y: 0, w: 12, h: 6 }]);
    expect(result.xxs).toEqual([]);

    const [stored] = await db
      .select()
      .from(page)
      .where(and(eq(page.id, testPage.id), isNull(page.deletedAt)));
    expect(stored.config).toEqual([
      { i: realBlock.id, x: 0, y: 0, w: 12, h: 6 },
    ]);
    expect(stored.mobileConfig).toEqual([]);
  });
});
