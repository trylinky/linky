import {
  checkUserHasAccessToPage,
  createNewPage,
  deletePage,
  getPageBlocks,
  getPageIdBySlugOrDomain,
  getPageLayoutById,
  getPageSettings,
  getPagesForOrganizationId,
  getPageThemeById,
  updatePageLayout,
} from './service';
import type { AppBindings } from '@/env';
import { createPosthogClient } from '@/lib/posthog';
import prisma from '@/lib/prisma';
import {
  pageIdCacheTag,
  pageSlugCacheTag,
  revalidatePageCache,
} from '@/lib/revalidate';
import { isAdminUser } from '@/lib/roles';
import { optionalSession, requireSession } from '@/middleware/authenticate';
import { requireApiKey } from '@/middleware/authenticate-api-key';
import { getPageLoadHandler } from '@/modules/pages/handlers/get-page-load';
import { getPageBySlugOrDomainHandlers } from '@/modules/pages/handlers/get-page-slug-or-domain';
import { getSlugAvailabilityHandlers } from '@/modules/pages/handlers/get-slug-availability';
import { tbValidator } from '@hono/typebox-validator';
import { captureException } from '@sentry/cloudflare';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts for why the
// two aren't interchangeable when fed to tbValidator.
import { Type } from 'typebox';

// None of these three bodies had a Fastify `schema.body` registered, so
// nothing validated them at runtime — the old handlers were typed by hand
// and would 500 on a missing/malformed body (`Cannot destructure property
// 'x' of undefined`). Validating them now is strictly safer: well-formed
// requests behave exactly as before, and a missing field turns an unhandled
// 500 into a clean 400.
const createPageBodySchema = Type.Object({
  slug: Type.String(),
  themeId: Type.String(),
});

const getPageIdBodySchema = Type.Object({
  slug: Type.Optional(Type.String()),
  domain: Type.Optional(Type.String()),
});

const updatePageLayoutBodySchema = Type.Object(
  {
    newLayout: Type.Object(
      {
        sm: Type.Unknown(),
        xxs: Type.Unknown(),
      },
      { additionalProperties: true }
    ),
  },
  { additionalProperties: true }
);

const createPageFactory = createFactory<AppBindings>();
const getPageIdFactory = createFactory<AppBindings>();
// Bound to the route's literal path so `c.req.param('pageId')` below comes
// back as `string`, not `string | undefined` — see the comment on the
// factory in forms/index.ts.
const updatePageLayoutFactory = createFactory<AppBindings, '/:pageId/layout'>();

async function getCurrentUserTeamPagesHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const pages = await getPagesForOrganizationId(session.activeOrganizationId);

  return c.json(pages, 200);
}

// The handler stays inline in this same `createHandlers` call so
// `c.req.valid('json')` is inferred from the validator immediately above it
// — see the comment on getReactionsHandlers in
// reactions/handlers/get-reactions.ts for why pulling it out into a
// separately-typed named function reopens that hole.
const createPageHandlers = createPageFactory.createHandlers(
  tbValidator('json', createPageBodySchema),
  async (c) => {
    const session = requireSession(c);
    const { slug, themeId } = c.req.valid('json');

    if (!slug) {
      return c.json({ error: { message: 'Missing required fields' } }, 400);
    }

    const teamPageCount = await prisma.page.count({
      where: {
        deletedAt: null,
        organization: {
          id: session.activeOrganizationId,
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    });

    const maxNumberOfPages = 100;

    if (teamPageCount >= maxNumberOfPages) {
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          role: true,
        },
      });

      if (!isAdminUser(user)) {
        return c.json(
          {
            error: {
              message: 'You have reached the maximum number of pages',
              label: 'Please upgrade your plan to create more pages',
            },
          },
          400
        );
      }
    }

    try {
      const res = await createNewPage({
        slug,
        themeId,
        organizationId: session.activeOrganizationId,
      });

      if ('error' in res) {
        return c.json({ error: res.error }, 400);
      }

      // Clear any cached "not found" lookup for the newly-claimed slug.
      if (process.env.NEXT_PUBLIC_ROOT_DOMAIN) {
        void revalidatePageCache([
          pageSlugCacheTag(res.slug, process.env.NEXT_PUBLIC_ROOT_DOMAIN),
        ]);
      }

      return c.json({ slug: res.slug }, 200);
    } catch (error) {
      // Don't hand the raw error back to the caller — it can carry stack
      // traces and database detail.
      console.error({ err: error }, 'Failed to create page');
      captureException(error);

      return c.json(
        { error: { message: 'Sorry, there was an error creating this page' } },
        400
      );
    }
  }
);

async function deletePageHandler(c: Context<AppBindings, '/:pageId'>) {
  const session = requireSession(c);
  const pageId = c.req.param('pageId');

  const userHasAccess = await checkUserHasAccessToPage(pageId, session.user.id);

  if (!userHasAccess) {
    return c.json({}, 403);
  }

  await deletePage(pageId);

  void revalidatePageCache([pageIdCacheTag(pageId)]);

  return c.json({ success: true }, 200);
}

async function getPageLayoutHandler(
  c: Context<AppBindings, '/:pageId/layout'>
) {
  const pageId = c.req.param('pageId');
  const session = await optionalSession(c);

  const page = await getPageLayoutById(pageId);

  if (!page?.publishedAt) {
    if (session?.activeOrganizationId !== page?.organizationId) {
      return c.json({}, 404);
    }
  }

  return c.json({ xxs: page?.mobileConfig, sm: page?.config }, 200);
}

// The handler stays inline in this same `createHandlers` call — see the
// comment on createPageHandlers above.
const updatePageLayoutHandlers = updatePageLayoutFactory.createHandlers(
  tbValidator('json', updatePageLayoutBodySchema),
  async (c) => {
    const session = requireSession(c);
    const posthog = createPosthogClient();
    const pageId = c.req.param('pageId');

    const userHasAccess = await checkUserHasAccessToPage(
      pageId,
      session.user.id
    );

    if (!userHasAccess) {
      return c.json({}, 403);
    }

    const { newLayout } = c.req.valid('json');

    const updatedPage = await updatePageLayout(pageId, newLayout);

    void revalidatePageCache([pageIdCacheTag(pageId)]);

    posthog?.capture({
      distinctId: session.user.id,
      event: 'page-layout-updated',
      properties: {
        pageId,
      },
    });

    // Workers kill the isolate as soon as the response is returned, taking
    // any buffered PostHog events with it. Hand the flush to waitUntil so it
    // completes after the response goes out instead of blocking it.
    if (posthog) {
      c.executionCtx.waitUntil(posthog.shutdown());
    }

    return c.json(updatedPage, 200);
  }
);

async function getPageSettingsHandler(
  c: Context<AppBindings, '/:pageId/settings'>
) {
  const session = requireSession(c);
  const pageId = c.req.param('pageId');

  const page = await getPageSettings(pageId);

  if (!page) {
    return c.json({}, 404);
  }

  const currentUserIsOwner =
    Boolean(session.user.id) &&
    page.organizationId === session.activeOrganizationId;

  if (page.publishedAt == null && !currentUserIsOwner) {
    return c.json({}, 404);
  }

  // `organizationId` drives the ownership check above but was never part of
  // the response — the old Fastify response schema didn't list it and
  // silently stripped it. Hono has no such trimming step, so it has to be
  // dropped by hand here instead.
  const { organizationId: _organizationId, ...rest } = page;

  return c.json(rest, 200);
}

async function getPageThemeHandler(c: Context<AppBindings, '/:pageId/theme'>) {
  const pageId = c.req.param('pageId');
  const session = await optionalSession(c);

  const page = await getPageThemeById(pageId);

  if (!page?.publishedAt) {
    if (session?.activeOrganizationId !== page?.organizationId) {
      return c.json({}, 404);
    }
  }

  // `organizationId` is only needed for the ownership check above — the old
  // Fastify response schema (theme, backgroundImage, teamId, publishedAt)
  // never listed it, so it never reached the client. Return the same subset
  // by hand rather than spreading `page`.
  return c.json({ theme: page?.theme, publishedAt: page?.publishedAt }, 200);
}

async function getPageBlocksHandler(
  c: Context<AppBindings, '/:pageId/blocks'>
) {
  const session = await optionalSession(c);
  const pageId = c.req.param('pageId');

  if (!pageId) {
    return c.json({}, 400);
  }

  const page = await getPageBlocks(pageId);

  if (!page) {
    return c.json({}, 404);
  }

  let currentUserIsOwner = false;

  if (
    session?.user.id &&
    page.organizationId === session.activeOrganizationId
  ) {
    currentUserIsOwner = true;
  }

  if (page.publishedAt == null && !currentUserIsOwner) {
    return c.json({}, 404);
  }

  return c.json(
    {
      blocks: page.blocks,
      currentUserIsOwner,
    },
    200
  );
}

// The handler stays inline in this same `createHandlers` call — see the
// comment on createPageHandlers above.
const getPageIdHandlers = getPageIdFactory.createHandlers(
  tbValidator('json', getPageIdBodySchema),
  async (c) => {
    const { slug, domain } = c.req.valid('json');

    if (!slug && !domain) {
      return c.json(
        {
          error: {
            message: 'Slug or domain is required',
          },
        },
        400
      );
    }

    const pageId = await getPageIdBySlugOrDomain(slug ?? '', domain ?? '');

    return c.json({ pageId }, 200);
  }
);

const pagesRoutes = new Hono<AppBindings>();

pagesRoutes.get('/me', getCurrentUserTeamPagesHandler);

pagesRoutes.post('/', ...createPageHandlers);

pagesRoutes.delete('/:pageId', deletePageHandler);

pagesRoutes.get('/:pageId/layout', getPageLayoutHandler);

pagesRoutes.post('/:pageId/layout', ...updatePageLayoutHandlers);

pagesRoutes.get('/:pageId/settings', getPageSettingsHandler);

pagesRoutes.get('/:pageId/theme', getPageThemeHandler);

pagesRoutes.get('/:pageId/blocks', getPageBlocksHandler);

pagesRoutes.get('/:pageId/internal/load', requireApiKey, getPageLoadHandler);

// Server-to-server only, same as above — `requireApiKey` is applied at the
// mount site rather than baked into `getPageBySlugOrDomainHandlers`,
// matching how `bodyLimit` is applied at forms' submission route mount.
pagesRoutes.get(
  '/internal/slug-or-domain',
  requireApiKey,
  ...getPageBySlugOrDomainHandlers
);

pagesRoutes.get('/internal/slug-availability', ...getSlugAvailabilityHandlers);

pagesRoutes.post('/get-page-id', ...getPageIdHandlers);

export default pagesRoutes;
