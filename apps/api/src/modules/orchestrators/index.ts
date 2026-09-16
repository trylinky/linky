import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { requireSession } from '@/middleware/authenticate';
import { requireApiKey } from '@/middleware/authenticate-api-key';
import { orchestrateTikTok } from '@/modules/orchestrators/tiktok';
import { tbValidator } from '@hono/typebox-validator';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts for why the
// two aren't interchangeable when fed to tbValidator.
import { Type } from 'typebox';

const createOrchestratorBodySchema = Type.Object({
  type: Type.Literal('TIKTOK'),
});

const validateOrchestratorBodySchema = Type.Object({
  orchestrationId: Type.String(),
  type: Type.Literal('TIKTOK'),
});

const tikTokOrchestratorBodySchema = Type.Object({
  orchestrationId: Type.String(),
});

const createOrchestratorFactory = createFactory<AppBindings>();
const validateOrchestratorFactory = createFactory<AppBindings>();
const tikTokOrchestratorFactory = createFactory<AppBindings>();

// The handler stays inline in this same `createHandlers` call so
// `c.req.valid('json')` is inferred from the validator immediately above it
// — see the comment on getReactionsHandlers in
// reactions/handlers/get-reactions.ts for why pulling it out into a
// separately-typed named function reopens that hole.
const createOrchestratorHandlers = createOrchestratorFactory.createHandlers(
  tbValidator('json', createOrchestratorBodySchema),
  async (c) => {
    const { type } = c.req.valid('json');

    const newOrchestrator = await prisma.orchestration.create({
      data: {
        expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        type,
      },
      select: {
        id: true,
      },
    });

    return c.json({ id: newOrchestrator.id }, 200);
  }
);

// See the comment on createOrchestratorHandlers above for why this handler
// stays inline in its own `createHandlers` call.
const validateOrchestratorHandlers = validateOrchestratorFactory.createHandlers(
  tbValidator('json', validateOrchestratorBodySchema),
  async (c) => {
    const { type, orchestrationId } = c.req.valid('json');

    const orchestration = await prisma.orchestration.findUnique({
      where: {
        id: orchestrationId,
        type: type,
        pageGeneratedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!orchestration) {
      return c.json({ error: 'Orchestration not found' }, 400);
    }

    return c.json({ valid: true }, 200);
  }
);

// See the comment on createOrchestratorHandlers above for why this handler
// stays inline in its own `createHandlers` call.
//
// This route authenticates with both `requireApiKey` (server-to-server,
// applied at the mount site below) and a real user session — the old
// handler called Fastify's `authenticateApiKey` *and* `authenticate`, and
// `orchestrateTikTok` needs the session's `organizationId`/`user.id` to
// build the new page, so both checks are preserved here.
const tikTokOrchestratorHandlers = tikTokOrchestratorFactory.createHandlers(
  tbValidator('json', tikTokOrchestratorBodySchema),
  async (c) => {
    const session = requireSession(c);
    const { orchestrationId } = c.req.valid('json');

    const { error, data } = await orchestrateTikTok({
      orchestrationId,
      organizationId: session.activeOrganizationId,
      userId: session.user.id,
    });

    if (error) {
      return c.json({ error }, 400);
    }

    return c.json({ pageSlug: data?.pageSlug }, 200);
  }
);

const orchestratorsRoutes = new Hono<AppBindings>();

orchestratorsRoutes.post(
  '/create',
  requireApiKey,
  ...createOrchestratorHandlers
);

orchestratorsRoutes.post(
  '/validate',
  requireApiKey,
  ...validateOrchestratorHandlers
);

orchestratorsRoutes.post(
  '/tiktok/create',
  requireApiKey,
  ...tikTokOrchestratorHandlers
);

export default orchestratorsRoutes;
