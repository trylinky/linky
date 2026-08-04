import type { AppBindings } from '@/env';
import type { Context, ValidationTargets } from 'hono';

/**
 * Context type for a handler mounted behind `tbValidator(target, schema)`.
 *
 * Handlers live in their own files (for testability, mirroring the old
 * Fastify `handlers/` layout) rather than being declared inline in the route
 * definition, so they can't rely on Hono's inference flowing from the
 * `.get(path, tbValidator(...), handler)` call site. Typing the handler's
 * parameter with the same `{ in, out }` shape `tbValidator` produces gets
 * `c.req.valid(target)` to type-check against the schema's `Static<>` type
 * with no cast required.
 */
export type ValidatedContext<
  Target extends keyof ValidationTargets,
  T,
> = Context<
  AppBindings,
  string,
  { in: { [K in Target]: T }; out: { [K in Target]: T } }
>;
