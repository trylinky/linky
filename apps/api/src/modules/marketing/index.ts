import prisma from '../../lib/prisma';
import { JsonObject } from '@prisma/client/runtime/library';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export default async function marketingRoutes(fastify: FastifyInstance) {
  fastify.get('/featured-pages', {
    handler: getFeaturedPagesHandler,
  });
}

async function getFeaturedPagesHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const pages = await prisma.page.findMany({
    where: {
      deletedAt: null,
      publishedAt: {
        not: null,
      },
      isFeatured: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    select: {
      id: true,
      slug: true,
      blocks: {
        where: {
          type: 'header',
        },
      },
    },
  });

  const featuredPages = pages
    .map((page) => {
      const headerBlock = page.blocks.find(
        (block) => block.type === 'header'
      ) as unknown as JsonObject;

      if (!headerBlock) {
        return null;
      }

      return {
        id: page.id,
        slug: page.slug,
        headerTitle: (headerBlock?.data as JsonObject)?.title,
        headerDescription: (headerBlock?.data as JsonObject)?.description,
      };
    })
    .filter(Boolean);

  return response.status(200).send(featuredPages);
}
