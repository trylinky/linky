import prisma from '../../lib/prisma';
import { isReservedSlug } from '@/lib/slugs';
import { isForbiddenSlug } from '@/lib/slugs';
import { regexSlug } from '@/lib/slugs';
import { makeId } from '@/modules/pages/utils';
import { captureException } from '@sentry/node';
import { headerBlockDefaults } from '@trylinky/blocks';
import { randomUUID } from 'crypto';

export async function getPageLayoutById(pageId: string) {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
    },
    select: {
      config: true,
      mobileConfig: true,
      publishedAt: true,
      organizationId: true,
    },
  });

  return page;
}

export async function getPageThemeById(pageId: string) {
  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      id: pageId,
    },
    select: {
      theme: true,
      publishedAt: true,
      organizationId: true,
    },
  });

  return page;
}

export async function getPageIdBySlugOrDomain(slug: string, domain: string) {
  if (!slug && !domain) {
    return null;
  }

  const page = await prisma.page.findFirst({
    where: {
      slug,
      customDomain: domain ? decodeURIComponent(domain) : undefined,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  return page?.id;
}

export async function getPageBlocks(pageId: string) {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
      deletedAt: null,
    },
    select: {
      organizationId: true,
      publishedAt: true,
      blocks: {
        select: {
          id: true,
          data: true,
          type: true,
          config: true,
          integrationId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  return page;
}

export async function getPagesForOrganizationId(organizationId: string) {
  const pages = await prisma.page.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      slug: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return pages;
}

export async function getPageSettings(pageId: string) {
  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      id: pageId,
    },
    select: {
      organizationId: true,
      id: true,
      publishedAt: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      backgroundImage: true,
      themeId: true,
      verifiedAt: true,
    },
  });

  return page;
}

export async function updatePageLayout(
  pageId: string,
  newLayout: {
    sm: any;
    xxs: any;
  }
) {
  const updatedPage = await prisma.page.update({
    where: {
      id: pageId,
    },
    data: {
      config: newLayout.sm,
      mobileConfig: newLayout.xxs,
    },
    select: {
      id: true,
    },
  });

  return updatedPage;
}

export async function checkUserHasAccessToPage(pageId: string, userId: string) {
  const page = await prisma.page.count({
    where: {
      id: pageId,
      organization: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  if (page > 0) {
    return true;
  }

  return false;
}

export async function createNewPage({
  slug,
  themeId,
  userId,
  organizationId,
}: {
  slug: string;
  themeId: string;
  userId: string;
  organizationId: string;
}) {
  const existingPage = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      slug,
    },
  });

  if (!slug.match(regexSlug)) {
    return {
      error: {
        message: 'Slug is invalid',
        field: 'pageSlug',
      },
    };
  }

  if (isForbiddenSlug(slug)) {
    return {
      error: {
        message: 'Slug is forbidden',
        field: 'pageSlug',
      },
    };
  }

  if (isReservedSlug(slug)) {
    return {
      error: {
        message: 'Slug is reserved - reach out on twitter to request this',
        field: 'pageSlug',
      },
    };
  }

  if (existingPage) {
    return {
      error: {
        message: 'Page with this slug already exists',
        field: 'pageSlug',
      },
    };
  }

  const headerSectionId = randomUUID();

  try {
    const newPage = await prisma.page.create({
      data: {
        organizationId,
        slug,
        publishedAt: new Date(),
        themeId,
        metaTitle: `@${slug}`,
        config: [
          {
            h: 5,
            i: headerSectionId,
            w: 12,
            x: 0,
            y: 0,
            moved: false,
            static: true,
          },
        ],
        mobileConfig: [
          {
            h: 5,
            i: headerSectionId,
            w: 12,
            x: 0,
            y: 0,
            moved: false,
            static: true,
          },
        ],
        blocks: {
          create: {
            id: headerSectionId,
            type: 'header',
            config: {},
            data: {
              ...headerBlockDefaults,
              title: `@${slug}`,
            },
          },
        },
      },
      select: {
        slug: true,
      },
    });

    return newPage;
  } catch (error) {
    captureException(error);
    console.log('error', error);
    return {
      error: {
        message: 'Error creating page',
      },
    };
  }
}

export async function deletePage(pageId: string) {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
      deletedAt: null,
    },
    include: {
      blocks: true,
    },
  });

  if (!page) {
    return false;
  }

  await prisma.page.update({
    where: {
      id: pageId,
    },
    data: {
      deletedAt: new Date(),
      slug: `DELETED-${makeId(4)}-${page.slug}`,
    },
  });

  try {
    for (const block of page.blocks) {
      await prisma.block.delete({
        where: {
          id: block.id,
        },
      });
    }
  } catch (error) {
    captureException(error);
    return false;
  }

  return true;
}
