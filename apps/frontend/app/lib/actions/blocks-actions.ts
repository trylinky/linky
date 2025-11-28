'use server';

import { getSession } from '@/app/lib/auth';
import {
  createBlock as createBlockService,
  deleteBlockById,
  getBlockById,
  updateBlockData as updateBlockDataService,
  checkUserHasAccessToBlock,
} from '@/lib/api/blocks';
import { createPosthogClient } from '@/lib/posthog';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function addBlock(
  block: { type: string; id: string },
  pageSlug: string
) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId || !user?.id) {
    return { error: { message: 'Unauthorized' } };
  }

  const posthog = createPosthogClient();

  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      organization: {
        id: sessionData.activeOrganizationId,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      slug: pageSlug,
    },
    include: {
      blocks: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!page) {
    return { error: { message: 'Page not found' } };
  }

  const maxNumberOfBlocks = 100;
  if (page.blocks.length >= maxNumberOfBlocks) {
    return {
      error: {
        message: 'You have reached the maximum number of blocks per page',
      },
    };
  }

  const newBlock = await createBlockService(block, pageSlug);

  posthog?.capture({
    distinctId: user.id,
    event: 'block-created',
    properties: {
      organizationId: sessionData.activeOrganizationId,
      pageId: newBlock.pageId,
      blockId: newBlock.id,
      blockType: newBlock.type,
    },
  });

  return { data: { block: newBlock } };
}

export async function deleteBlock(blockId: string) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user } = session?.data ?? {};

  if (!session || !user?.id) {
    return { error: { message: 'Unauthorized' } };
  }

  const result = await deleteBlockById(blockId, user.id);

  if (result instanceof Error) {
    return { error: { message: result.message } };
  }

  return { success: true };
}

export async function getBlock(blockId: string) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user } = session?.data ?? {};

  if (!session || !user?.id) {
    return null;
  }

  const hasAccess = await checkUserHasAccessToBlock(blockId, user.id);

  if (!hasAccess) {
    return null;
  }

  const block = await getBlockById(blockId);

  if (!block) {
    return null;
  }

  return {
    blockData: block.data,
    integration: block.integration,
  };
}

export async function updateBlockData(blockId: string, newData: object) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user } = session?.data ?? {};

  if (!session || !user?.id) {
    return { error: { message: 'Unauthorized' } };
  }

  const hasAccess = await checkUserHasAccessToBlock(blockId, user.id);

  if (!hasAccess) {
    return { error: { message: 'Unauthorized' } };
  }

  try {
    const updatedBlock = await updateBlockDataService(blockId, newData);
    return { data: updatedBlock };
  } catch (error) {
    return { error: { message: 'Failed to update block data' } };
  }
}
