import { disconnectIntegration, getIntegrationsForOrganizationId, linkIntegrationToBlock } from './service';
import db from '@/lib/db';
import {
  cleanupTestData,
  createTestBlock,
  createTestIntegration,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { block, integration } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/revalidate', () => ({
  blockCacheTag: (id: string) => `block-${id}`,
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  revalidatePageCache: vi.fn(),
}));

const suffix = randomUUID().slice(0, 8);

let userId: string;
let strangerId: string;
let organizationId: string;
let pageId: string;
let blockId: string;
let integrationId: string;

const extraPageIds: string[] = [];
const extraIntegrationIds: string[] = [];

beforeAll(async () => {
  userId = (await createTestUser(`int-${suffix}`)).id;
  strangerId = (await createTestUser(`int-stranger-${suffix}`)).id;
  organizationId = (await createTestOrganization({ suffix: `int-${suffix}`, ownerId: userId })).id;
  pageId = (await createTestPage({ organizationId, suffix: `int-${suffix}` })).id;
  blockId = (await createTestBlock({ pageId, type: 'spotify-playing-now' })).id;
  integrationId = (await createTestIntegration({ organizationId, type: 'spotify' })).id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId, ...extraPageIds],
    integrationIds: [integrationId, ...extraIntegrationIds],
    organizationIds: [organizationId],
    userIds: [userId, strangerId],
  });
});

const readIntegrationId = async () =>
  (
    await db.query.block.findFirst({
      where: (b, { eq }) => eq(b.id, blockId),
      columns: { integrationId: true },
    })
  )?.integrationId;

describe('linkIntegrationToBlock', () => {
  it('links the integration to a block the user can reach', async () => {
    await expect(linkIntegrationToBlock({ blockId, integrationId, userId })).resolves.toBe(true);
    expect(await readIntegrationId()).toBe(integrationId);
  });

  it('writes nothing when the block belongs to someone else', async () => {
    // The blockId reaches this function from an OAuth `state` value that
    // originated in a caller-supplied query string, and block ids are
    // public. An unscoped update let any signed-in user attach their own
    // integration to another user's block.
    await db.update(block).set({ integrationId: null }).where(eq(block.id, blockId));

    await expect(
      linkIntegrationToBlock({ blockId, integrationId, userId: strangerId })
    ).resolves.toBe(false);
    expect(await readIntegrationId()).toBeNull();
  });
});

describe('getIntegrationsForOrganizationId', () => {
  it('returns only non-deleted integrations for the organization, in the legacy shape', async () => {
    const shapePage = await createTestPage({ organizationId, suffix: `int-shape-${suffix}` });
    extraPageIds.push(shapePage.id);

    const activeIntegration = await createTestIntegration({ organizationId, type: 'threads' });
    extraIntegrationIds.push(activeIntegration.id);

    await createTestBlock({
      pageId: shapePage.id,
      type: 'threads-feed',
      integrationId: activeIntegration.id,
    });

    const deletedIntegration = await createTestIntegration({ organizationId, type: 'instagram' });
    extraIntegrationIds.push(deletedIntegration.id);
    await db
      .update(integration)
      .set({ deletedAt: new Date() })
      .where(eq(integration.id, deletedIntegration.id));

    const result = await getIntegrationsForOrganizationId(organizationId);

    const found = result.find((row) => row.id === activeIntegration.id);

    expect(found).toEqual({
      id: activeIntegration.id,
      createdAt: activeIntegration.createdAt,
      type: 'threads',
      displayName: activeIntegration.displayName,
      blocks: [{ page: { id: shapePage.id, slug: shapePage.slug } }],
    });

    expect(result.some((row) => row.id === deletedIntegration.id)).toBe(false);
  });
});

describe('disconnectIntegration', () => {
  it('soft-deletes the integration, clears its config, and unlinks its blocks', async () => {
    const targetIntegration = await createTestIntegration({ organizationId, type: 'spotify' });
    extraIntegrationIds.push(targetIntegration.id);
    await db
      .update(integration)
      .set({ encryptedConfig: 'secret' })
      .where(eq(integration.id, targetIntegration.id));

    const targetPage = await createTestPage({ organizationId, suffix: `int-disconnect-${suffix}` });
    extraPageIds.push(targetPage.id);
    const linkedBlock = await createTestBlock({
      pageId: targetPage.id,
      type: 'spotify-playing-now',
      integrationId: targetIntegration.id,
    });

    await expect(disconnectIntegration(targetIntegration.id)).resolves.toEqual({ sucess: true });

    const updatedIntegration = await db.query.integration.findFirst({
      where: (i, { eq }) => eq(i.id, targetIntegration.id),
      columns: { deletedAt: true, encryptedConfig: true },
    });
    expect(updatedIntegration?.deletedAt).not.toBeNull();
    expect(updatedIntegration?.encryptedConfig).toBeNull();

    const updatedBlock = await db.query.block.findFirst({
      where: (b, { eq }) => eq(b.id, linkedBlock.id),
      columns: { integrationId: true },
    });
    expect(updatedBlock?.integrationId).toBeNull();
  });
});
