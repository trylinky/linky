import db from '@/lib/db';
import { pageOwnedByUser } from '@/lib/db-predicates';
import {
  blockCacheTag,
  pageIdCacheTag,
  revalidatePageCache,
} from '@/lib/revalidate';
import { block, integration } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Attaches a newly connected integration to the block the OAuth flow began
 * from.
 *
 * The block id travels through the OAuth `state` parameter, but it originates
 * from a query string the caller supplies, so it has to be scoped to the caller
 * before anything is written. Block ids are public — /pages/:pageId/blocks
 * returns them for any published page — so without this scoping any signed-in
 * user could start a connect flow against someone else's block id and end up
 * with their own integration rendering on a page they do not own.
 *
 * Returns false when the block is not one the user can reach, in which case
 * nothing is written.
 */
export async function linkIntegrationToBlock({
  blockId,
  integrationId,
  userId,
}: {
  blockId: string;
  integrationId: string;
  userId: string;
}): Promise<boolean> {
  const target = await db.query.block.findFirst({
    where: (b, { and, eq }) =>
      and(eq(b.id, blockId), pageOwnedByUser(b.pageId, userId)),
    columns: { id: true, pageId: true },
  });

  if (!target) {
    return false;
  }

  await db.update(block).set({ integrationId }).where(eq(block.id, target.id));

  void revalidatePageCache([
    blockCacheTag(target.id),
    pageIdCacheTag(target.pageId),
  ]);

  return true;
}

export async function getIntegrationsForOrganizationId(organizationId: string) {
  const rows = await db.query.integration.findMany({
    where: (i, { and, eq, isNull }) =>
      and(eq(i.organizationId, organizationId), isNull(i.deletedAt)),
    columns: { id: true, createdAt: true, type: true, displayName: true },
    with: {
      blocks: {
        columns: {},
        with: { page: { columns: { id: true, slug: true } } },
      },
    },
  });

  return rows;
}

export async function disconnectIntegration(integrationId: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(integration)
      .set({ deletedAt: new Date(), encryptedConfig: null })
      .where(eq(integration.id, integrationId));

    await tx
      .update(block)
      .set({ integrationId: null })
      .where(eq(block.integrationId, integrationId));
  });

  return {
    sucess: true,
  };
}
