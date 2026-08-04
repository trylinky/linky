import type { ValidatedContext } from '@/lib/hono-context';
import prisma from '@/lib/prisma';
import { getIpAddress } from '@/modules/analytics/utils';
import { getReactionsForPageId } from '@/modules/reactions/service';
import { Static, Type } from '@sinclair/typebox';

export const getReactionsQuerySchema = Type.Object({
  pageId: Type.String(),
});

export async function getReactionsHandler(
  c: ValidatedContext<'query', Static<typeof getReactionsQuerySchema>>
) {
  const { pageId } = c.req.valid('query');

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    // Existence check only — the full row drags large JSON columns along.
    select: { id: true },
  });

  if (!page) {
    return c.json({ error: { message: 'Page not found' } }, 404);
  }

  const reactions = await getReactionsForPageId({
    pageId,
    ipAddress: getIpAddress(c),
  });

  return c.json(reactions, 200);
}
