import {
  checkUserHasAccessToBlock,
  createBlock,
  deleteBlockById,
  updateBlockData,
} from './service';
import db from '@/lib/db';
import {
  cleanupTestData,
  createTestBlock,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { page } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const suffix = randomUUID().slice(0, 8);

let ownerId: string;
let strangerId: string;
let noAccessUserId: string;
let organizationId: string;
let strangerOrgId: string;
let pageId: string;
let strangerPageId: string;
let blockId: string;

// Pages created outside of the top-level fixtures (per-test doomed pages)
// are pushed here so afterAll can clean them up too.
const pageIds: string[] = [];

beforeAll(async () => {
  ownerId = (await createTestUser(`blocks-svc-owner-${suffix}`)).id;
  strangerId = (await createTestUser(`blocks-svc-stranger-${suffix}`)).id;
  noAccessUserId = (await createTestUser(`blocks-svc-noaccess-${suffix}`)).id;

  organizationId = (
    await createTestOrganization({ suffix: `blocks-svc-${suffix}`, ownerId })
  ).id;
  strangerOrgId = (
    await createTestOrganization({
      suffix: `blocks-svc-stranger-${suffix}`,
      ownerId: strangerId,
    })
  ).id;

  const testPage = await createTestPage({
    organizationId,
    suffix: `blocks-svc-${suffix}`,
  });
  pageId = testPage.id;
  pageIds.push(pageId);

  const strangerTestPage = await createTestPage({
    organizationId: strangerOrgId,
    suffix: `blocks-svc-stranger-${suffix}`,
  });
  strangerPageId = strangerTestPage.id;
  pageIds.push(strangerPageId);

  blockId = (await createTestBlock({ pageId, type: 'content' })).id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds,
    organizationIds: [organizationId, strangerOrgId],
    userIds: [ownerId, strangerId, noAccessUserId],
  });
});

describe('createBlock', () => {
  it("creates the block on the slug's page", async () => {
    const targetPage = await createTestPage({
      organizationId,
      suffix: `blocks-svc-create-${suffix}`,
    });
    pageIds.push(targetPage.id);

    const id = randomUUID();
    const created = await createBlock({ type: 'content', id }, targetPage.slug);

    expect(created.id).toBe(id);
    expect(created.pageId).toBe(targetPage.id);
    expect(created.type).toBe('content');
  });

  it('throws for an unknown slug', async () => {
    await expect(
      createBlock(
        { type: 'content', id: randomUUID() },
        `no-such-slug-${suffix}`
      )
    ).rejects.toThrow();
  });
});

describe('checkUserHasAccessToBlock', () => {
  it('returns true for a member of the owning organization', async () => {
    expect(await checkUserHasAccessToBlock(blockId, ownerId)).toBe(true);
  });

  it('returns false for a user with no organizations at all', async () => {
    expect(await checkUserHasAccessToBlock(blockId, noAccessUserId)).toBe(
      false
    );
  });

  it('returns false for a stranger who owns a different page', async () => {
    // Regression guard for the db-predicates aliasing bug: without aliasing
    // the inner tables, owning ANY page would grant access to EVERY page.
    expect(await checkUserHasAccessToBlock(blockId, strangerId)).toBe(false);
  });
});

describe('deleteBlockById', () => {
  it("removes the block and strips its entry from the page's config", async () => {
    const doomedPage = await createTestPage({
      organizationId,
      suffix: `blocks-svc-delete-${suffix}`,
    });
    pageIds.push(doomedPage.id);

    const doomedBlock = await createTestBlock({
      pageId: doomedPage.id,
      type: 'content',
    });
    const survivingEntry = { i: 'unrelated-entry', x: 0, y: 1, w: 1, h: 1 };

    await db
      .update(page)
      .set({
        config: [{ i: doomedBlock.id, x: 0, y: 0, w: 1, h: 1 }, survivingEntry],
      })
      .where(eq(page.id, doomedPage.id));

    await deleteBlockById(doomedBlock.id, ownerId);

    const remainingBlock = await db.query.block.findFirst({
      where: (b, { eq }) => eq(b.id, doomedBlock.id),
    });
    expect(remainingBlock).toBeUndefined();

    const updatedPage = await db.query.page.findFirst({
      where: (p, { eq }) => eq(p.id, doomedPage.id),
    });
    expect(updatedPage?.config).toEqual([survivingEntry]);
  });

  it('throws for a stranger and leaves the block in place', async () => {
    const doomedPage = await createTestPage({
      organizationId,
      suffix: `blocks-svc-delete-stranger-${suffix}`,
    });
    pageIds.push(doomedPage.id);

    const doomedBlock = await createTestBlock({
      pageId: doomedPage.id,
      type: 'content',
    });

    await expect(deleteBlockById(doomedBlock.id, strangerId)).rejects.toThrow();

    const stillThere = await db.query.block.findFirst({
      where: (b, { eq }) => eq(b.id, doomedBlock.id),
    });
    expect(stillThere).toBeTruthy();
  });
});

describe('updateBlockData', () => {
  it('validates the new data via the block schema and persists it', async () => {
    const contentBlock = await createTestBlock({ pageId, type: 'content' });

    const updated = await updateBlockData(contentBlock.id, {
      content: 'Hello world',
    });
    expect(updated.data).toEqual({ content: 'Hello world' });

    const persisted = await db.query.block.findFirst({
      where: (b, { eq }) => eq(b.id, contentBlock.id),
    });
    expect(persisted?.data).toEqual({ content: 'Hello world' });
  });

  it('throws when the data fails the schema and leaves the row unchanged', async () => {
    const contentBlock = await createTestBlock({
      pageId,
      type: 'content',
      data: { content: 'Original' },
    });

    await expect(updateBlockData(contentBlock.id, {})).rejects.toThrow();

    const persisted = await db.query.block.findFirst({
      where: (b, { eq }) => eq(b.id, contentBlock.id),
    });
    expect(persisted?.data).toEqual({ content: 'Original' });
  });

  it('throws for an unknown block id', async () => {
    await expect(
      updateBlockData(randomUUID(), { content: 'x' })
    ).rejects.toThrow();
  });
});
