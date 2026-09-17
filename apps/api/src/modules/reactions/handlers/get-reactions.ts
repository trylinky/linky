import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { getIpAddress } from '@/modules/analytics/utils';
import { getReactionsForPageId } from '@/modules/reactions/service';
import { tbValidator } from '@hono/typebox-validator';
import { createFactory } from 'hono/factory';
// Schema built with `typebox` (the peer dependency @hono/typebox-validator
// actually type-checks against), not `@sinclair/typebox` — see the comment
// on postReactionsBodySchema for why the two aren't interchangeable here.
import { Type } from 'typebox';

const factory = createFactory<AppBindings>();

export const getReactionsQuerySchema = Type.Object({
  pageId: Type.String(),
});

// The handler is inlined here, in the same `createHandlers` call as its
// validator, rather than declared as a separately-typed named function. That
// keeps `c.req.valid('query')` inferred from the validator actually wired
// above it instead of asserted against a type written by hand — pulling the
// handler back out into its own annotated function reopens exactly the
// validator/handler mismatch this structure exists to prevent (verified in
// task-12-report.md, "Fix round 1").
export const getReactionsHandlers = factory.createHandlers(
  tbValidator('query', getReactionsQuerySchema),
  async (c) => {
    const { pageId } = c.req.valid('query');

    const row = await db.query.page.findFirst({
      where: (p, { eq }) => eq(p.id, pageId),
      // Existence check only — the full row drags large JSON columns along.
      columns: { id: true },
    });

    if (!row) {
      return c.json({ error: { message: 'Page not found' } }, 404);
    }

    const reactions = await getReactionsForPageId({
      pageId,
      ipAddress: getIpAddress(c),
    });

    return c.json(reactions, 200);
  }
);
