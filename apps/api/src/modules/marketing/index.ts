import type { AppBindings } from '@/env';
import db from '@/lib/db';
import type { Context } from 'hono';
import { Hono } from 'hono';

type JsonObject = Record<string, unknown>;

const marketingRoutes = new Hono<AppBindings>();

marketingRoutes.get('/featured-pages', getFeaturedPagesHandler);

async function getFeaturedPagesHandler(c: Context<AppBindings>) {
  const pages = await db.query.page.findMany({
    where: (p, { and, isNull, isNotNull, eq }) =>
      and(isNull(p.deletedAt), isNotNull(p.publishedAt), eq(p.isFeatured, true)),
    orderBy: (p, { desc }) => [desc(p.updatedAt)],
    columns: { id: true, slug: true },
    with: { blocks: { where: (b, { eq }) => eq(b.type, 'header') } },
  });

  const featuredPages = pages
    .map((featured) => {
      const headerBlock = featured.blocks[0];

      if (!headerBlock) {
        return null;
      }

      const data = headerBlock.data as JsonObject | null;

      return {
        id: featured.id,
        slug: featured.slug,
        headerTitle: data?.title,
        headerDescription: data?.description,
      };
    })
    .filter(Boolean);

  return c.json(featuredPages, 200);
}

export default marketingRoutes;
