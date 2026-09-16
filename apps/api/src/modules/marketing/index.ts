import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { Prisma } from '@trylinky/prisma';
import type { Context } from 'hono';
import { Hono } from 'hono';

type JsonObject = Prisma.JsonObject;

const marketingRoutes = new Hono<AppBindings>();

marketingRoutes.get('/featured-pages', getFeaturedPagesHandler);

async function getFeaturedPagesHandler(c: Context<AppBindings>) {
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

  return c.json(featuredPages, 200);
}

export default marketingRoutes;
