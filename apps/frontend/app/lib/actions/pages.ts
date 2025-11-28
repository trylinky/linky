'use server';

import { getSession } from '@/app/lib/auth';
import { createNewPage } from '@/lib/api/pages';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function deletePage(pageId: string) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return { error: 'Unauthorized' };
  }

  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
      deletedAt: null,
      organization: {
        id: sessionData.activeOrganizationId,
        members: {
          some: {
            userId: user?.id,
          },
        },
      },
    },
  });

  if (!page) {
    return { error: 'Page not found' };
  }

  await prisma.page.update({
    where: { id: pageId },
    data: { deletedAt: new Date() },
  });

  return { success: true };
}

export async function createPage(slug: string, themeId: string) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId || !user?.id) {
    return { error: { message: 'Unauthorized' } };
  }

  const teamPages = await prisma.page.findMany({
    where: {
      deletedAt: null,
      organization: {
        id: sessionData.activeOrganizationId,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const maxNumberOfPages = 100;

  if (teamPages.length >= maxNumberOfPages) {
    if (dbUser?.role !== 'admin') {
      return {
        error: {
          message: 'You have reached the maximum number of pages',
          label: 'Please upgrade your plan to create more pages',
        },
      };
    }
  }

  const res = await createNewPage({
    slug,
    themeId,
    userId: user.id,
    organizationId: sessionData.activeOrganizationId,
  });

  if ('error' in res) {
    return { error: res.error };
  }

  return { slug: res.slug };
}

export async function checkSlugAvailability(slug: string) {
  const existingPage = await prisma.page.findUnique({
    where: {
      slug,
      deletedAt: null,
    },
  });

  return { isAvailable: !existingPage };
}

export async function getPageLayout(pageId: string) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return null;
  }

  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
      deletedAt: null,
      organization: {
        id: sessionData.activeOrganizationId,
        members: {
          some: {
            userId: user?.id,
          },
        },
      },
    },
    select: {
      config: true,
      mobileConfig: true,
    },
  });

  if (!page) {
    return null;
  }

  return {
    sm: page.config as any[],
    xxs: (page.mobileConfig as any[]) ?? [],
  };
}

export async function updatePageLayout(
  pageId: string,
  newLayout: { sm: any[]; xxs: any[] }
) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return { error: { message: 'Unauthorized' } };
  }

  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
      deletedAt: null,
      organization: {
        id: sessionData.activeOrganizationId,
        members: {
          some: {
            userId: user?.id,
          },
        },
      },
    },
  });

  if (!page) {
    return { error: { message: 'Page not found' } };
  }

  await prisma.page.update({
    where: { id: pageId },
    data: {
      config: newLayout.sm,
      mobileConfig: newLayout.xxs,
    },
  });

  return { success: true };
}
