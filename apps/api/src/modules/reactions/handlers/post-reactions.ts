import type { ValidatedContext } from '@/lib/hono-context';
import { getIpAddress } from '@/modules/analytics/utils';
import {
  DEFAULT_REACTION_TYPE,
  MAX_ALLOWED_REACTIONS_PER_IP,
  REACTION_TYPES,
  reactToResource,
} from '@/modules/reactions/service';
import { Static, Type } from '@sinclair/typebox';

export const postReactionsBodySchema = Type.Object({
  pageId: Type.String(),
  // A whole number of clicks, never more than one visitor's entire
  // allowance. The client debounces clicks into a single request, so values
  // above 1 are legitimate — unbounded ones are not. The service clamps
  // against the allowance already used; this just rejects absurd input at
  // the edge.
  increment: Type.Integer({
    minimum: 1,
    maximum: MAX_ALLOWED_REACTIONS_PER_IP,
  }),
  reactionType: Type.Optional(
    Type.Union(REACTION_TYPES.map((type) => Type.Literal(type)))
  ),
});

export async function postReactionsHandler(
  c: ValidatedContext<'json', Static<typeof postReactionsBodySchema>>
) {
  const { pageId, increment, reactionType } = c.req.valid('json');

  const ipAddress = getIpAddress(c);

  const reactions = await reactToResource(
    pageId,
    increment,
    ipAddress,
    reactionType ?? DEFAULT_REACTION_TYPE
  );

  return c.json(reactions, 200);
}
