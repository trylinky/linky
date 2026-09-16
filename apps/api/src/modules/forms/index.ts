import {
  checkUserHasAccessToPage,
  deleteSubmissionById,
  getFormGroupsForPage,
  listSubmissions,
  submitFormResponse,
} from './service';
import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { getIpAddress } from '@/modules/analytics/utils';
import { tbValidator } from '@hono/typebox-validator';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { createFactory } from 'hono/factory';
// Schema built with `typebox` (the peer dependency @hono/typebox-validator
// actually type-checks against), not `@sinclair/typebox` — see the comment
// on postReactionsBodySchema in reactions/handlers/post-reactions.ts for why
// the two aren't interchangeable when fed to tbValidator.
import { Type } from 'typebox';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const postSubmissionBodySchema = Type.Object({
  // Answer values are deliberately untyped here: Fastify's AJV used to run
  // with coerceTypes, and a string|boolean union coerces booleans through
  // the string branch (true -> "true"), which broke checkbox answers.
  // TypeBox under Hono does not coerce, so that failure mode is gone — see
  // the coercion-pinning test in routes.test.ts. Per-field type and length
  // validation happens in validateAnswers; overall payload size is capped by
  // maxProperties and the bodyLimit middleware below.
  answers: Type.Record(Type.String({ maxLength: 64 }), Type.Unknown(), {
    maxProperties: 10,
  }),
  website: Type.Optional(Type.String({ maxLength: 200 })),
});

// Bound to the route's literal path so `c.req.param('blockId')` below comes
// back as `string`, not `string | undefined` — createFactory only infers
// that from its own type parameter, since it runs before the handler is
// wired to an actual route.
const factory = createFactory<AppBindings, '/:blockId/submissions'>();

// The handler stays inline in this same `createHandlers` call so
// `c.req.valid('json')` is inferred from the validator immediately above it,
// not asserted against a hand-written type — see the comment on
// getReactionsHandlers in reactions/handlers/get-reactions.ts for why pulling
// it out into a separately-typed named function reopens that hole.
const postSubmissionHandlers = factory.createHandlers(
  tbValidator('json', postSubmissionBodySchema),
  async (c) => {
    const blockId = c.req.param('blockId');
    const { answers, website } = c.req.valid('json');

    try {
      const result = await submitFormResponse({
        blockId,
        answers,
        honeypot: website ?? '',
        ipAddress: getIpAddress(c),
      });

      switch (result.status) {
        case 'ok':
          return c.json({ success: true }, 200);
        case 'not-found':
          return c.json({ error: { message: 'Form not found' } }, 404);
        case 'rate-limited':
          return c.json(
            {
              error: {
                message: 'Too many submissions. Please try again later.',
              },
            },
            429
          );
        case 'invalid':
          return c.json(
            { error: { message: 'Validation failed', fields: result.errors } },
            400
          );
      }
    } catch {
      return c.json(
        { error: { message: 'Sorry, there was an error submitting the form' } },
        500
      );
    }
  }
);

const formsRoutes = new Hono<AppBindings>();

// Public endpoint: visitors submit form responses. No auth — the service
// gates on published page + honeypot + per-IP rate limit.
//
// Fastify's route-level `bodyLimit: 65536` has no direct Hono equivalent, so
// this uses Hono's built-in `bodyLimit` middleware rather than a manual
// `content-length` header check: `content-length` is client-supplied and is
// simply absent on chunked requests, so a header-only check can be skipped
// by a client that doesn't send one. Hono's middleware falls back to
// counting bytes off the actual request stream (aborting mid-read once the
// cap is exceeded) whenever `content-length` is missing or
// `transfer-encoding` is chunked, so it enforces the cap instead of trusting
// a client-supplied header.
formsRoutes.post(
  '/:blockId/submissions',
  bodyLimit({
    maxSize: 65536,
    onError: (c) => c.json({ error: { message: 'Payload too large' } }, 413),
  }),
  ...postSubmissionHandlers
);

formsRoutes.get('/page/:pageId', async (c) => {
  const session = requireSession(c);
  const pageId = c.req.param('pageId');

  if (!(await checkUserHasAccessToPage(pageId, session.user.id))) {
    return c.json({ error: { message: 'Page not found' } }, 404);
  }

  return c.json({ groups: await getFormGroupsForPage(pageId) }, 200);
});

formsRoutes.get('/page/:pageId/submissions', async (c) => {
  const session = requireSession(c);
  const pageId = c.req.param('pageId');
  const blockId = c.req.query('blockId');
  const cursor = c.req.query('cursor');

  if (!blockId) {
    return c.json({ error: { message: 'blockId is required' } }, 400);
  }

  if (cursor && !UUID_REGEX.test(cursor)) {
    return c.json({ error: { message: 'Invalid cursor' } }, 400);
  }

  if (!(await checkUserHasAccessToPage(pageId, session.user.id))) {
    return c.json({ error: { message: 'Page not found' } }, 404);
  }

  return c.json(await listSubmissions(pageId, blockId, cursor), 200);
});

formsRoutes.delete('/submissions/:submissionId', async (c) => {
  const session = requireSession(c);

  const deleted = await deleteSubmissionById(
    c.req.param('submissionId'),
    session.user.id
  );

  if (!deleted) {
    return c.json({ error: { message: 'Submission not found' } }, 404);
  }

  return c.json({ success: true }, 200);
});

export default formsRoutes;
