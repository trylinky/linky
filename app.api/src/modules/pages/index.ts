'use strict';

import {
  createPageSchema,
  deletePageSchema,
  getCurrentUserTeamPagesSchema,
  getPageBlocksSchema,
  getPageLayoutSchema,
  getPageSettingsSchema,
  getPageThemeSchema,
  updatePageLayoutSchema,
} from './schemas';
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
import { createPosthogClient } from '@/lib/posthog';
import prisma from '@/lib/prisma';
import {
  getPageLoadHandler,
  getPageLoadSchema,
} from '@/modules/pages/handlers/get-page-load';
import { getPageBySlugOrDomainSchema } from '@/modules/pages/handlers/get-page-slug-or-domain';
import { getPageBySlugOrDomainHandler } from '@/modules/pages/handlers/get-page-slug-or-domain';
import {
  getSlugAvailabilityHandler,
  getSlugAvailabilitySchema,
} from '@/modules/pages/handlers/get-slug-availability';
import { FastifyInstance, FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';

export default async function pagesRoutes(fastify: FastifyInstance, opts: any) {
  fastify.get(
    '/me',
    { schema: getCurrentUserTeamPagesSchema },
    getCurrentUserTeamPagesHandler
  );

  fastify.post('/', { schema: createPageSchema }, createPageHandler);

  fastify.delete('/:pageId', { schema: deletePageSchema }, deletePageHandler);

  fastify.get(
    '/:pageId/layout',
    { schema: getPageLayoutSchema },
    getPageLayoutHandler
  );

  fastify.post(
    '/:pageId/layout',
    { schema: updatePageLayoutSchema },
    updatePageLayoutHandler
  );

  fastify.get(
    '/:pageId/settings',
    { schema: getPageSettingsSchema },
    getPageSettingsHandler
  );

  fastify.get(
    '/:pageId/theme',
    { schema: getPageThemeSchema },
    getPageThemeHandler
  );

  fastify.get(
    '/:pageId/blocks',
    { schema: getPageBlocksSchema },
    getPageBlocksHandler
  );

  fastify.get(
    '/:pageId/internal/load',
    { schema: getPageLoadSchema },
    getPageLoadHandler
  );

  fastify.get(
    '/internal/slug-or-domain',
    { schema: getPageBySlugOrDomainSchema },
    getPageBySlugOrDomainHandler
  );

  fastify.get(
    '/internal/slug-availability',
    { schema: getSlugAvailabilitySchema },
    getSlugAvailabilityHandler
  );

  fastify.post('/get-page-id', getPageIdHandler);
}

async function getPageLayoutHandler(
  request: FastifyRequest<{ Params: { pageId: string } }>,
  response: FastifyReply
) {
  const { pageId } = request.params;

  const session = await request.server.authenticate(request, response, {
    throwError: false,
  });

  const page = await getPageLayoutById(pageId);

  if (!page?.publishedAt) {
    if (session?.activeOrganizationId !== page?.organizationId) {
      return response.status(404).send({});
    }
  }

  return response.status(200).send({
    xxs: page?.mobileConfig,
    sm: page?.config,
  });
}

async function getPageThemeHandler(
  request: FastifyRequest<{ Params: { pageId: string } }>,
  response: FastifyReply
) {
  const { pageId } = request.params;

  const session = await request.server.authenticate(request, response, {
    throwError: false,
  });

  const page = await getPageThemeById(pageId);

  if (!page?.publishedAt) {
    if (session?.activeOrganizationId !== page?.organizationId) {
      return response.status(404).send({});
    }
  }

  return response.status(200).send(page);
}

async function getPageIdHandler(
  request: FastifyRequest<{ Body: { slug: string; domain: string } }>,
  response: FastifyReply
) {
  const { slug, domain } = request.body;

  if (!slug && !domain) {
    return response.status(400).send({
      error: {
        message: 'Slug or domain is required',
      },
    });
  }

  const pageId = await getPageIdBySlugOrDomain(slug, domain);

  return response.status(200).send({ pageId });
}

async function getPageBlocksHandler(
  request: FastifyRequest<{ Params: { pageId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response, {
    throwError: false,
  });

  const { pageId } = request.params;

  if (!pageId) {
    return response.status(400).send({});
  }

  const page = await getPageBlocks(pageId);

  if (!page) {
    return response.status(404).send({});
  }

  let currentUserIsOwner = false;

  if (
    session?.user.id &&
    page?.organizationId === session?.activeOrganizationId
  ) {
    currentUserIsOwner = true;
  }

  if (page.publishedAt == null && !currentUserIsOwner) {
    return response.status(404).send({});
  }

  return response.status(200).send({
    blocks: page.blocks,
    currentUserIsOwner,
  });
}

async function getCurrentUserTeamPagesHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const pages = await getPagesForOrganizationId(session.activeOrganizationId);

  return response.status(200).send(pages);
}

export async function getPageSettingsHandler(
  request: FastifyRequest<{ Params: { pageId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const { pageId } = request.params;

  const page = await getPageSettings(pageId);

  if (!page) {
    return response.status(404).send({});
  }

  let currentUserIsOwner = false;

  if (
    session?.user.id &&
    page?.organizationId === session?.activeOrganizationId
  ) {
    currentUserIsOwner = true;
  }

  if (page.publishedAt == null && !currentUserIsOwner) {
    return response.status(404).send({});
  }

  return response.status(200).send(page);
}

async function updatePageLayoutHandler(
  request: FastifyRequest<{
    Params: { pageId: string };
    Body: { newLayout: any };
  }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const posthog = createPosthogClient();

  const { pageId } = request.params;

  const userHasAccess = await checkUserHasAccessToPage(pageId, session.user.id);

  if (!userHasAccess) {
    return response.status(403).send({});
  }

  const { newLayout } = request.body;

  const updatedPage = await updatePageLayout(pageId, newLayout);

  posthog?.capture({
    distinctId: session.user.id,
    event: 'page-layout-updated',
    properties: {
      pageId,
    },
  });

  return response.status(200).send(updatedPage);
}

async function createPageHandler(
  request: FastifyRequest<{ Body: { slug: string; themeId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  /**
   * CHECK USER HAS ACTIVE PLAN
   */
  const { slug, themeId } = request.body;

  if (!slug) {
    return response.status(400).send({
      error: {
        message: 'Missing required fields',
      },
    });
  }

  const teamPages = await prisma.page.findMany({
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
    include: {
      organization: {
        select: {
          members: {
            select: {
              role: true,
            },
          },
        },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  const maxNumberOfPages = 100;

  if (teamPages.length >= maxNumberOfPages) {
    if (user?.role !== 'ADMIN') {
      return response.status(400).send({
        error: {
          message: 'You have reached the maximum number of pages',
          label: 'Please upgrade your plan to create more pages',
        },
      });
    }
  }

  try {
    const res = await createNewPage({
      slug,
      themeId,
      userId: session.user.id,
      organizationId: session.activeOrganizationId,
    });

    if ('error' in res) {
      return response.status(400).send({
        error: res.error,
      });
    }

    return response.status(200).send({
      slug: res.slug,
    });
  } catch (error) {
    return response.status(400).send(error);
  }
}

async function deletePageHandler(
  request: FastifyRequest<{ Params: { pageId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const { pageId } = request.params;

  const userHasAccess = await checkUserHasAccessToPage(pageId, session.user.id);

  if (!userHasAccess) {
    return response.status(403).send({});
  }

  await deletePage(pageId);

  return response.status(200).send({
    success: true,
  });
}
