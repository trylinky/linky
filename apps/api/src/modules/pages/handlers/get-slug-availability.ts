import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { tbValidator } from '@hono/typebox-validator';
import { page } from '@trylinky/db/schema';
import { and, count, eq, isNull } from 'drizzle-orm';
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

    const [{ count: existing }] = await db
      .select({ count: count() })
      .from(page)
      .where(and(isNull(page.deletedAt), eq(page.slug, slug)));

    return c.json({ isAvailable: existing === 0 }, 200);
  }
);
