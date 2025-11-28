import { prisma } from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { headerBlockDefaults } from '@trylinky/blocks';
import { randomUUID } from 'crypto';

const FORBIDDEN_SLUGS_REGEXPS = [
  'page-not-found',
  'docs',
  'explore',
  'terms-of-use',
  'about',
  'pricing',
  'privacy-policy',
  'customers',
  'admin',
  'documentation',
  'sign-in',
  'sign-up',
  'api',
  'dashboard',
  'community',
  'login',
  'logout',
  'settings',
  'profile',
  'help',
  'support',
  'blog',
  'terms',
  'privacy',
  'contact',
  'home',
  '([^0-9a-z].*)',
  '(.*[^0-9a-z])',
  '(.*[_.\\-]{2}.*)',
];

const FORBIDDEN_REGEXP = new RegExp(
  `^(${FORBIDDEN_SLUGS_REGEXPS.join('|')})$`,
  'i'
);

export function isForbiddenSlug(slug: string): boolean {
  return !!slug.match(FORBIDDEN_REGEXP);
}

export function isReservedSlug(slug: string): boolean {
  const reservedSlugs = ['onedash', 'glow'];
  return reservedSlugs.includes(slug.toLowerCase());
}

export const regexSlug = /^[a-z0-9_]+$/;

export function makeId(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;

  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  return result;
}

export async function resolveDomainOrSlug(slug: string, domain: string) {
  const appDomain = new URL(process.env.APP_FRONTEND_URL as string);
  const rootDomain =
    process.env.NODE_ENV === 'production'
      ? appDomain.hostname
      : `${appDomain.hostname}:${appDomain.port}`;

  const customDomain = decodeURIComponent(domain) !== rootDomain;

  return {
    resolvedSlug: customDomain ? undefined : slug,
    resolvedDomain: customDomain ? decodeURIComponent(domain) : undefined,
  };
}

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
      backgroundImage: true,
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

  const { resolvedSlug, resolvedDomain } = await resolveDomainOrSlug(
    slug,
    domain
  );

  const page = await prisma.page.findFirst({
    where: {
      slug: resolvedSlug,
      customDomain: resolvedDomain,
      deletedAt: null,
    },
    select: {
      id: true,
      publishedAt: true,
      organizationId: true,
      slug: true,
    },
  });

  return page;
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

  return page > 0;
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

export async function getPageLoadData(pageId: string) {
  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      id: pageId,
    },
    select: {
      id: true,
      publishedAt: true,
      organizationId: true,
      customDomain: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      blocks: true,
    },
  });

  return page;
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
