import { getIpAddress } from '@/modules/analytics/utils';
import {
  DEFAULT_REACTION_TYPE,
  REACTION_TYPES,
  ReactionType,
  reactToResource,
} from '@/modules/reactions/service';
import { Type } from '@fastify/type-provider-typebox';
import { FastifyRequest, FastifyReply } from 'fastify';

export const postReactionsSchema = {
  body: Type.Object({
    pageId: Type.String(),
    increment: Type.Number(),
    reactionType: Type.Optional(
      Type.Union(REACTION_TYPES.map((type) => Type.Literal(type)))
    ),
  }),
  response: {
    200: Type.Object({
      total: Type.Record(Type.String(), Type.Number()),
      current: Type.Record(Type.String(), Type.Number()),
    }),
  },
};

export async function postReactionsHandler(
  request: FastifyRequest<{
    Body: { pageId: string; increment: number; reactionType?: ReactionType };
  }>,
  response: FastifyReply
) {
  const { pageId, increment, reactionType } = request.body;

  const ipAddress = getIpAddress(request);

  const reactions = await reactToResource(
    pageId,
    increment,
    ipAddress,
    reactionType ?? DEFAULT_REACTION_TYPE
  );

  return response.status(200).send(reactions);
}
