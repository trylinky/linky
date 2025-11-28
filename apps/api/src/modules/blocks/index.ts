'use strict';

import {
  deleteBlockSchema,
  getBlockSchema,
  getEnabledBlockSchema,
  updateBlockDataSchema,
} from './schemas';
import {
  checkUserHasAccessToBlock,
  createBlock,
  deleteBlockById,
  getBlockById,
  getEnabledBlocks,
  updateBlockData,
} from './service';
import { createPosthogClient } from '@/lib/posthog';
import prisma from '@/lib/prisma';
import { FastifyInstance, FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';

export default async function blocksRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  fastify.post('/add', postCreateBlockHandler);
  fastify.get('/:blockId', { schema: getBlockSchema }, getBlockHandler);
  fastify.delete(
    '/:blockId',
    { schema: deleteBlockSchema },
    deleteBlockHandler
  );
  fastify.get(
    '/enabled-blocks',
    { schema: getEnabledBlockSchema },
    getEnabledBlocksHandler
  );
  fastify.post(
    '/:blockId/update-data',
    { schema: updateBlockDataSchema },
    updateBlockDataHandler
  );
}

async function getBlockHandler(
  request: FastifyRequest<{ Params: { blockId: string } }>,
  response: FastifyReply
) {
  const { blockId } = request.params;

  const session = await request.server.authenticate(request, response);

  const block = await getBlockById(blockId);

  if (!block?.page.publishedAt) {
    if (session?.activeOrganizationId !== block?.page.organizationId) {
      return response.status(404).send({
        error: {
          message: 'Block not found',
        },
      });
    }
  }

  return response.status(200).send({
    integration: block?.integration,
    blockData: block?.data,
  });
}

async function postCreateBlockHandler(
  request: FastifyRequest<{
    Body: { block: { type: string; id: string }; pageSlug: string };
  }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const posthog = createPosthogClient();

  if (!session?.user) {
    return response.status(401).send({
      error: {
        message: 'Unauthorized',
      },
    });
  }

  const { block, pageSlug } = request.body;

  if (!block || !pageSlug) {
    return response.status(400).send({
      error: {
        message: 'Missing required fields',
      },
    });
  }

  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      organization: {
        id: session.currentOrganizationId,
        members: {
          some: {
            userId: session.user.id,
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
    return response.status(400).send({
      error: {
        message: 'Page not found',
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  const maxNumberOfBlocks = 100;
  if (page.blocks.length >= maxNumberOfBlocks) {
    return response.status(400).send({
      error: {
        message: 'You have reached the maximum number of blocks per page',
      },
    });
  }

  const newBlock = await createBlock(block, pageSlug);

  posthog?.capture({
    distinctId: session.user.id,
    event: 'block-created',
    properties: {
      organizationId: session.activeOrganizationId,
      pageId: newBlock.pageId,
      blockId: newBlock.id,
      blockType: newBlock.type,
    },
  });

  return response.status(200).send({
    data: {
      block: newBlock,
    },
  });
}

async function getEnabledBlocksHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response, {
    throwError: false,
  });

  if (!session?.user) {
    return response.status(401).send([]);
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!dbUser) {
    return response.status(401).send([]);
  }

  const enabledBlocks = await getEnabledBlocks(dbUser);

  return response.status(200).send(enabledBlocks);
}

async function deleteBlockHandler(
  request: FastifyRequest<{ Params: { blockId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const posthog = createPosthogClient();

  const { blockId } = request.params;

  const block = await prisma.block.findUnique({
    where: {
      id: blockId,
      page: {
        organization: {
          id: session.activeOrganizationId,
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    },
    include: {
      page: true,
    },
  });

  if (!block) {
    return response.status(400).send({
      error: {
        message: 'Block not found',
      },
    });
  }

  if (block.type === 'header') {
    return response.status(400).send({
      error: {
        message: 'You cannot delete the header block',
      },
    });
  }

  try {
    await deleteBlockById(blockId, session.user.id);

    posthog?.capture({
      distinctId: session.user.id,
      event: 'block-deleted',
      properties: {
        organizationId: session.activeOrganizationId,
        pageId: block.pageId,
        blockId: block.id,
        blockType: block.type,
      },
    });

    return response.status(200).send({
      message: 'Block deleted',
    });
  } catch (error) {
    return response.status(400).send({
      error: {
        message: 'Sorry, there was an error deleting this block',
      },
    });
  }
}

async function updateBlockDataHandler(
  request: FastifyRequest<{
    Params: { blockId: string };
    Body: { newData: object };
  }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const { blockId } = request.params;

  const { newData } = request.body;

  const hasAccess = await checkUserHasAccessToBlock(blockId, session.user.id);

  if (!hasAccess) {
    return response.status(401).send({});
  }

  try {
    const updatedBlock = await updateBlockData(blockId, newData);

    return response.status(200).send({
      id: updatedBlock.id,
      updatedAt: updatedBlock.updatedAt,
    });
  } catch (error) {
    return response.status(400).send({
      error: {
        message: 'Error updating block data',
      },
    });
  }
}
