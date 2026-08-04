import {
  checkUserHasAccessToBlock,
  createBlock,
  deleteBlockById,
  getBlockById,
  getEnabledBlocks,
  updateBlockData,
} from './service';
import type { AppBindings } from '@/env';
import { createPosthogClient } from '@/lib/posthog';
import prisma from '@/lib/prisma';
import {
  blockCacheTag,
  pageIdCacheTag,
  revalidatePageCache,
} from '@/lib/revalidate';
import { optionalSession, requireSession } from '@/middleware/authenticate';
import { tbValidator } from '@hono/typebox-validator';
import { blocks } from '@trylinky/blocks';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
// Built with `typebox`, not `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts for why
// the two aren't interchangeable when fed to tbValidator.
import { Type } from 'typebox';

const UUID_PATTERN =
  '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';

/**
 * `block.type` indexes straight into the block registry, so an unknown value
 * used to throw on `blocks[type].defaults` and return a 500. Constraining it
 * to the registry keys also stops a client asking for a block the UI would
 * not offer it (see the isBeta gate in getEnabledBlocks).
 *
 * The id is client-generated so the editor can place the block optimistically
 * before the request resolves, so it has to be accepted - but it can at least
 * be required to look like the UUID the editor actually sends.
 */
const createBlockBodySchema = Type.Object(
  {
    block: Type.Object(
      {
        id: Type.String({ pattern: UUID_PATTERN }),
        type: Type.Union(Object.keys(blocks).map((key) => Type.Literal(key))),
      },
      { additionalProperties: false }
    ),
    pageSlug: Type.String({ minLength: 1, maxLength: 100 }),
  },
  { additionalProperties: false }
);

const updateBlockDataBodySchema = Type.Object({
  newData: Type.Object({}, { additionalProperties: true }),
});

// createFactory's Path type parameter has to be supplied per-route: it
// isn't known until the handler is later wired to `.post()`, so without it
// `c.req.param()` below would type as `string | undefined` instead of
// `string`. Handlers below that are plain named functions (not built via
// createFactory) get the same treatment by binding `Context`'s own Path
// parameter directly.
const addBlockFactory = createFactory<AppBindings>();
const updateBlockDataFactory = createFactory<
  AppBindings,
  '/:blockId/update-data'
>();

async function getBlockHandler(c: Context<AppBindings, '/:blockId'>) {
  const blockId = c.req.param('blockId');
  const session = requireSession(c);

  const block = await getBlockById(blockId);

  if (!block?.page.publishedAt) {
    if (session.activeOrganizationId !== block?.page.organizationId) {
      return c.json({ error: { message: 'Block not found' } }, 404);
    }
  }

  return c.json(
    { integration: block?.integration, blockData: block?.data },
    200
  );
}

// The handler stays inline in this same `createHandlers` call so
// `c.req.valid('json')` is inferred from the validator immediately above it,
// not asserted against a hand-written type — see the comment on
// getReactionsHandlers in reactions/handlers/get-reactions.ts for why pulling
// it out into a separately-typed named function reopens that hole.
const postCreateBlockHandlers = addBlockFactory.createHandlers(
  tbValidator('json', createBlockBodySchema),
  async (c) => {
    const session = requireSession(c);
    const posthog = createPosthogClient();
    const { block, pageSlug } = c.req.valid('json');

    const page = await prisma.page.findUnique({
      where: {
        deletedAt: null,
        organization: {
          id: session.activeOrganizationId,
          members: { some: { userId: session.user.id } },
        },
        slug: pageSlug,
      },
      include: { blocks: { select: { id: true } } },
    });

    if (!page) {
      return c.json({ error: { message: 'Page not found' } }, 400);
    }

    const maxNumberOfBlocks = 100;
    if (page.blocks.length >= maxNumberOfBlocks) {
      return c.json(
        {
          error: {
            message: 'You have reached the maximum number of blocks per page',
          },
        },
        400
      );
    }

    const newBlock = await createBlock(block, pageSlug);

    void revalidatePageCache([pageIdCacheTag(newBlock.pageId)]);

    posthog?.capture({
      distinctId: session.user.id,
      event: 'block-created',
      properties: {
        organizationId: session.activeOrganizationId,
        pageId: newBlock.pageId,
        blockId: newBlock.id,
        blockType: newBlock.type,
      },
    });

    // Workers kill the isolate as soon as the response is returned, taking
    // any buffered PostHog events with it. Hand the flush to waitUntil so it
    // completes after the response goes out instead of blocking it.
    if (posthog) {
      c.executionCtx.waitUntil(posthog.shutdown());
    }

    return c.json({ data: { block: newBlock } }, 200);
  }
);

async function getEnabledBlocksHandler(c: Context<AppBindings>) {
  const session = await optionalSession(c);

  if (!session?.user) {
    return c.json([], 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!dbUser) {
    return c.json([], 401);
  }

  return c.json(await getEnabledBlocks(dbUser), 200);
}

async function deleteBlockHandler(c: Context<AppBindings, '/:blockId'>) {
  const session = requireSession(c);
  const posthog = createPosthogClient();
  const blockId = c.req.param('blockId');

  const block = await prisma.block.findUnique({
    where: {
      id: blockId,
      page: {
        organization: {
          id: session.activeOrganizationId,
          members: { some: { userId: session.user.id } },
        },
      },
    },
    include: { page: true },
  });

  if (!block) {
    return c.json({ error: { message: 'Block not found' } }, 400);
  }

  if (block.type === 'header') {
    return c.json(
      { error: { message: 'You cannot delete the header block' } },
      400
    );
  }

  try {
    await deleteBlockById(blockId, session.user.id);

    void revalidatePageCache([
      pageIdCacheTag(block.pageId),
      blockCacheTag(blockId),
    ]);

    posthog?.capture({
      distinctId: session.user.id,
      event: 'block-deleted',
      properties: {
        organizationId: session.activeOrganizationId,
        pageId: block.pageId,
        blockId: block.id,
        blockType: block.type,
      },
    });

    // Workers kill the isolate as soon as the response is returned, taking
    // any buffered PostHog events with it. Hand the flush to waitUntil so it
    // completes after the response goes out instead of blocking it.
    if (posthog) {
      c.executionCtx.waitUntil(posthog.shutdown());
    }

    return c.json({ message: 'Block deleted' }, 200);
  } catch {
    return c.json(
      { error: { message: 'Sorry, there was an error deleting this block' } },
      400
    );
  }
}

// See the comment on postCreateBlockHandlers above for why this handler
// stays inline in its own `createHandlers` call.
const updateBlockDataHandlers = updateBlockDataFactory.createHandlers(
  tbValidator('json', updateBlockDataBodySchema),
  async (c) => {
    const session = requireSession(c);
    const blockId = c.req.param('blockId');
    const { newData } = c.req.valid('json');

    const hasAccess = await checkUserHasAccessToBlock(blockId, session.user.id);

    if (!hasAccess) {
      return c.json({}, 401);
    }

    try {
      const updatedBlock = await updateBlockData(blockId, newData);

      void revalidatePageCache([
        pageIdCacheTag(updatedBlock.pageId),
        blockCacheTag(blockId),
      ]);

      return c.json(
        { id: updatedBlock.id, updatedAt: updatedBlock.updatedAt },
        200
      );
    } catch {
      return c.json({ error: { message: 'Error updating block data' } }, 400);
    }
  }
);

const blocksRoutes = new Hono<AppBindings>();

blocksRoutes.post('/add', ...postCreateBlockHandlers);
blocksRoutes.get('/:blockId', getBlockHandler);
blocksRoutes.delete('/:blockId', deleteBlockHandler);
blocksRoutes.get('/enabled-blocks', getEnabledBlocksHandler);
blocksRoutes.post('/:blockId/update-data', ...updateBlockDataHandlers);

export default blocksRoutes;
