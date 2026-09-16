import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import {
  blockCacheTag,
  pageIdCacheTag,
  revalidatePageCache,
} from '@/lib/revalidate';
import { requireSession } from '@/middleware/authenticate';
import {
  disconnectIntegration,
  getIntegrationsForOrganizationId,
} from '@/modules/integrations/service';
import { tbValidator } from '@hono/typebox-validator';
import { captureException } from '@sentry/cloudflare';
import { Blocks, blocks } from '@trylinky/blocks';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts for why the
// two aren't interchangeable when fed to tbValidator.
import { Type } from 'typebox';

// The old Fastify schemas declared these bodies as plain-object properties
// with no `required` list, so a missing field passed schema validation and
// only surfaced as a Prisma error deep in the handler. Requiring them here
// is a safe tightening: every real caller already sends them.
const disconnectIntegrationBodySchema = Type.Object({
  integrationId: Type.String(),
});

const connectBlockBodySchema = Type.Object({
  integrationId: Type.String(),
  blockId: Type.String(),
});

const disconnectBlockBodySchema = Type.Object({
  blockId: Type.String(),
});

const disconnectIntegrationFactory = createFactory<AppBindings>();
const connectBlockFactory = createFactory<AppBindings>();
const disconnectBlockFactory = createFactory<AppBindings>();

async function getCurrentUserTeamIntegrationsHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  if (!session.activeOrganizationId) {
    return c.json({ error: 'No organization found' }, 400);
  }

  const integrations = await getIntegrationsForOrganizationId(
    session.activeOrganizationId
  );

  return c.json(integrations, 200);
}

// The handler stays inline in this same `createHandlers` call so
// `c.req.valid('json')` is inferred from the validator immediately above it
// — see the comment on getReactionsHandlers in
// reactions/handlers/get-reactions.ts for why pulling it out into a
// separately-typed named function reopens that hole.
const disconnectIntegrationHandlers =
  disconnectIntegrationFactory.createHandlers(
    tbValidator('json', disconnectIntegrationBodySchema),
    async (c) => {
      const session = requireSession(c);
      const { integrationId } = c.req.valid('json');

      const integration = await prisma.integration.findUnique({
        where: {
          id: integrationId,
          organization: {
            id: session.activeOrganizationId,
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
        select: {
          type: true,
        },
      });

      if (!integration) {
        return c.json({ error: 'Integration not found' }, 400);
      }

      try {
        const linkedBlocks = await prisma.block.findMany({
          where: { integrationId },
          select: { id: true, pageId: true },
        });

        await disconnectIntegration(integrationId);

        void revalidatePageCache([
          ...linkedBlocks.map((block) => blockCacheTag(block.id)),
          ...[...new Set(linkedBlocks.map((block) => block.pageId))].map(
            pageIdCacheTag
          ),
        ]);

        return c.json({ success: true }, 200);
      } catch (error) {
        captureException(error);

        return c.json({ error: 'Failed to disconnect integration' }, 500);
      }
    }
  );

// See the comment on disconnectIntegrationHandlers above for why this
// handler stays inline in its own `createHandlers` call.
const connectBlockHandlers = connectBlockFactory.createHandlers(
  tbValidator('json', connectBlockBodySchema),
  async (c) => {
    const session = requireSession(c);
    const { integrationId, blockId } = c.req.valid('json');

    const integration = await prisma.integration.findUnique({
      where: {
        id: integrationId,
        deletedAt: null,
        organization: {
          id: session.activeOrganizationId,
        },
      },
    });

    if (!integration) {
      return c.json({ error: 'Integration not found' }, 400);
    }

    const block = await prisma.block.findUnique({
      where: {
        id: blockId,
        page: {
          organizationId: session.activeOrganizationId,
        },
      },
    });

    if (!block) {
      return c.json({ error: 'Block not found' }, 400);
    }

    const allowedIntegrationForBlock =
      blocks[block.type as Blocks].integrationType;

    if (allowedIntegrationForBlock !== integration.type) {
      return c.json({ error: 'Invalid integration for block' }, 400);
    }

    try {
      await prisma.block.update({
        where: {
          id: blockId,
        },
        data: {
          integration: {
            connect: {
              id: integrationId,
            },
          },
        },
      });

      void revalidatePageCache([
        blockCacheTag(blockId),
        pageIdCacheTag(block.pageId),
      ]);

      return c.json({ success: true }, 200);
    } catch (error) {
      captureException(error);

      return c.json({ error: 'Failed to connect block to integration' }, 500);
    }
  }
);

// See the comment on disconnectIntegrationHandlers above for why this
// handler stays inline in its own `createHandlers` call.
const disconnectBlockHandlers = disconnectBlockFactory.createHandlers(
  tbValidator('json', disconnectBlockBodySchema),
  async (c) => {
    const session = requireSession(c);
    const { blockId } = c.req.valid('json');

    const block = await prisma.block.findUnique({
      where: {
        id: blockId,
        page: {
          organizationId: session.activeOrganizationId,
        },
      },
    });

    if (!block) {
      return c.json({ error: 'Block not found' }, 400);
    }

    await prisma.block.update({
      where: {
        id: blockId,
      },
      data: {
        integration: {
          disconnect: true,
        },
      },
    });

    void revalidatePageCache([
      blockCacheTag(blockId),
      pageIdCacheTag(block.pageId),
    ]);

    return c.json({ success: true }, 200);
  }
);

const integrationsRoutes = new Hono<AppBindings>();

integrationsRoutes.get('/me', getCurrentUserTeamIntegrationsHandler);

integrationsRoutes.post('/disconnect', ...disconnectIntegrationHandlers);

integrationsRoutes.post('/connect-block', ...connectBlockHandlers);

integrationsRoutes.post('/disconnect-block', ...disconnectBlockHandlers);

export default integrationsRoutes;
