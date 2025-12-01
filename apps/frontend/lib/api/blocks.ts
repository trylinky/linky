import { prisma } from '@/lib/prisma';
import { blocks, Blocks } from '@trylinky/blocks';
import { JsonObject, JsonValue, UserModel } from '@trylinky/prisma/types';

export async function getBlockById(blockId: string) {
  const block = await prisma.block.findUnique({
    where: {
      id: blockId,
    },
    select: {
      id: true,
      type: true,
      data: true,
      config: true,
      page: {
        select: {
          organizationId: true,
          publishedAt: true,
        },
      },
      integration: {
        select: {
          id: true,
          type: true,
          createdAt: true,
        },
      },
    },
  });

  return block;
}

export async function createBlock(
  block: { type: string; id: string },
  pageSlug: string,
  layoutConfig?: { x: number; y: number; w: number; h: number; minW?: number; minH?: number }
) {
  const defaultData = blocks[block.type as Blocks].defaults;

  // Use a transaction to atomically create the block and update the page layout
  const newBlock = await prisma.$transaction(async (tx) => {
    // Create the block
    const createdBlock = await tx.block.create({
      data: {
        type: block.type,
        id: block.id,
        config: {},
        data: defaultData,
        page: {
          connect: {
            slug: pageSlug,
          },
        },
      },
    });

    // If layout config is provided, update the page's layout
    if (layoutConfig) {
      const page = await tx.page.findUnique({
        where: { slug: pageSlug },
        select: { config: true, mobileConfig: true },
      });

      if (page) {
        const newLayoutItem = {
          i: block.id,
          x: layoutConfig.x,
          y: layoutConfig.y,
          w: layoutConfig.w,
          h: layoutConfig.h,
          minW: layoutConfig.minW ?? 4,
          minH: layoutConfig.minH ?? 2,
        };

        const currentConfig = (page.config as JsonValue[]) ?? [];
        const currentMobileConfig = (page.mobileConfig as JsonValue[]) ?? [];

        await tx.page.update({
          where: { slug: pageSlug },
          data: {
            config: [...currentConfig, newLayoutItem],
            mobileConfig: [...currentMobileConfig, newLayoutItem],
          },
        });
      }
    }

    return createdBlock;
  });

  return newBlock;
}

export async function getEnabledBlocks(user: UserModel) {
  if (!user) {
    return [];
  }

  const enabledBlocks: Blocks[] = [];

  Object.entries(blocks).forEach(([key, block]) => {
    if (block.isBeta) {
      if (user?.role === 'admin') {
        enabledBlocks.push(key as Blocks);
      }
    } else {
      enabledBlocks.push(key as Blocks);
    }
  });

  const filteredBlocks = enabledBlocks.filter((block) => block !== 'header');

  return filteredBlocks;
}

export async function checkUserHasAccessToBlock(
  blockId: string,
  userId: string
) {
  const block = await prisma.block.count({
    where: {
      id: blockId,
      page: {
        organization: {
          members: {
            some: {
              userId,
            },
          },
        },
      },
    },
  });

  if (block > 0) {
    return true;
  }

  return false;
}

export async function deleteBlockById(id: string, userId: string) {
  const userHasAccess = await checkUserHasAccessToBlock(id, userId);

  if (!userHasAccess) {
    return new Error('User does not have access to this block');
  }

  const deletedBlock = await prisma.block.delete({
    where: {
      id,
    },
    select: {
      page: {
        select: {
          id: true,
          config: true,
        },
      },
    },
  });

  if (deletedBlock.page.config && Array.isArray(deletedBlock.page.config)) {
    await prisma.page.update({
      where: {
        id: deletedBlock.page.id,
      },
      data: {
        config: deletedBlock.page?.config?.filter(
          (blck: JsonValue) => (blck as JsonObject | null)?.i !== id
        ),
      },
    });
  }
}

export async function updateBlockData(blockId: string, newData: object) {
  const block = await prisma.block.findUnique({
    where: {
      id: blockId,
    },
    select: {
      type: true,
    },
  });

  if (!block) {
    throw new Error('Block not found');
  }
  const schema = blocks[block.type as Blocks].schema;

  if (!schema) {
    throw new Error('Block schema not found');
  }

  try {
    const parsedData = await schema.validate(newData, { strict: true });

    const updatedBlock = await prisma.block.update({
      where: {
        id: blockId,
      },
      data: {
        data: parsedData,
      },
    });

    return updatedBlock;
  } catch (error) {
    throw new Error('Error updating block data');
  }
}
