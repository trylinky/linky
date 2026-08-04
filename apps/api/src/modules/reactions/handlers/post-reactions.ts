import type { AppBindings } from '@/env';
import { getIpAddress } from '@/modules/analytics/utils';
import {
  DEFAULT_REACTION_TYPE,
  MAX_ALLOWED_REACTIONS_PER_IP,
  REACTION_TYPES,
  reactToResource,
} from '@/modules/reactions/service';
import { tbValidator } from '@hono/typebox-validator';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox`: @hono/typebox-validator
// peer-depends on `typebox` (a newer, differently-branded rewrite by the
// same author) and its `Static<T>` only recognizes that package's schema
// types. Feed it an `@sinclair/typebox` schema instead and it still
// type-checks and validates at runtime, but every property in `c.req.valid()`
// silently comes back optional — required-field checks fall through the
// TypeScript side entirely while looking correct. Verified in
// task-12-report.md, "Fix round 1".
import { Type } from 'typebox';

const factory = createFactory<AppBindings>();

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

// See the comment in get-reactions.ts: the handler stays inline in this
// same `createHandlers` call so `c.req.valid('json')` is inferred from the
// validator immediately above it, not asserted against a hand-written type.
export const postReactionsHandlers = factory.createHandlers(
  tbValidator('json', postReactionsBodySchema),
  async (c) => {
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
);
