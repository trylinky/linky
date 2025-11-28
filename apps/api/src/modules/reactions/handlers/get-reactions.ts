import prisma from '@/lib/prisma';
import { getIpAddress } from '@/modules/analytics/utils';
import { getReactionsForPageId } from '@/modules/reactions/service';
import { Static, Type } from '@fastify/type-provider-typebox';
import { FastifyRequest, FastifyReply } from 'fastify';

export const getReactionsSchema = {
  querystring: Type.Object({
    pageId: Type.String(),
  }),
  response: {
    200: Type.Object({
      total: Type.Record(Type.String(), Type.Number()),
      current: Type.Record(Type.String(), Type.Number()),
    }),
  },
};

export async function getReactionsHandler(
  request: FastifyRequest<{
    Querystring: Static<typeof getReactionsSchema.querystring>;
  }>,
  response: FastifyReply
): Promise<Static<(typeof getReactionsSchema.response)[200]>> {
  const { pageId } = request.query;

  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
    },
  });

  if (!page) {
    return response.status(404).send({
      error: {
        message: 'Page not found',
      },
    });
  }

  const ipAddress = await getIpAddress(request);

  const reactions = await getReactionsForPageId({ pageId, ipAddress });

  return response.status(200).send(reactions);
}
