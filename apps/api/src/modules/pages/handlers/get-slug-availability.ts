import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { tbValidator } from '@hono/typebox-validator';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox`: @hono/typebox-validator
// peer-depends on `typebox`, and feeding it a `@sinclair/typebox` schema
// still type-checks and validates at runtime, but every property in
// `c.req.valid()` silently comes back optional. See the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts.
import { Type } from 'typebox';

const factory = createFactory<AppBindings>();

export const getSlugAvailabilityQuerySchema = Type.Object({
  slug: Type.String(),
});

// The handler stays inline in this same `createHandlers` call so
// `c.req.valid('query')` is inferred from the validator immediately above it,
// not asserted against a hand-written type — see the comment on
// getReactionsHandlers in reactions/handlers/get-reactions.ts for why pulling
// it out into a separately-typed named function reopens that hole.
export const getSlugAvailabilityHandlers = factory.createHandlers(
  tbValidator('query', getSlugAvailabilityQuerySchema),
  async (c) => {
    const { slug } = c.req.valid('query');

    const count = await prisma.page.count({
      where: {
        deletedAt: null,
        slug,
      },
    });

    return c.json({ isAvailable: count === 0 }, 200);
  }
);
