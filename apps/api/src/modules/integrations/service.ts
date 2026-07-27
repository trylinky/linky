import prisma from '@/lib/prisma';
import {
  blockCacheTag,
  pageIdCacheTag,
  revalidatePageCache,
} from '@/lib/revalidate';

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
  const block = await prisma.block.findFirst({
    where: {
      id: blockId,
      page: {
        organization: {
          members: {
            some: { userId },
          },
        },
      },
    },
    select: { id: true, pageId: true },
  });

  if (!block) {
    return false;
  }

  await prisma.block.update({
    where: { id: block.id },
    data: { integrationId },
  });

  void revalidatePageCache([
    blockCacheTag(block.id),
    pageIdCacheTag(block.pageId),
  ]);

  return true;
}

export async function getIntegrationsForOrganizationId(organizationId: string) {
  const integrations = await prisma.integration.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      displayName: true,
      blocks: {
        select: {
          page: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return integrations;
}

export async function disconnectIntegration(integrationId: string) {
  await prisma.integration.update({
    where: {
      id: integrationId,
    },
    data: {
      deletedAt: new Date(),
      encryptedConfig: null,
    },
  });

  await prisma.block.updateMany({
    where: {
      integrationId,
    },
    data: {
      integrationId: null,
    },
  });

  return {
    sucess: true,
  };
}
