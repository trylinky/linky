import { getIpAddress } from '@/modules/analytics/utils';
import { reactToResource } from '@/modules/reactions/service';
import { Type } from '@fastify/type-provider-typebox';
import { FastifyRequest, FastifyReply } from 'fastify';

export const postReactionsSchema = {
  body: Type.Object({
    pageId: Type.String(),
    increment: Type.Number(),
  }),
  response: {
    200: Type.Object({
      total: Type.Record(Type.String(), Type.Number()),
      current: Type.Record(Type.String(), Type.Number()),
    }),
  },
};

export async function postReactionsHandler(
  request: FastifyRequest<{ Body: { pageId: string; increment: number } }>,
  response: FastifyReply
) {
  const { pageId, increment } = request.body;

  const ipAddress = getIpAddress(request);

  const reactions = await reactToResource(pageId, increment, ipAddress);

  return response.status(200).send(reactions);
}
