'use server';

import { FormValues as DesignPageSettingsFormValues } from './EditPageSettingsDesignForm';
import { designPageSettingsSchema } from './shared';
import { getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { headers } from 'next/headers';

export const fetchPageSettings = async (slug: string) => {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  if (!session) {
    return null;
  }

  const { session: sessionData } = session?.data ?? {};

  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      slug,
      organizationId: sessionData?.activeOrganizationId,
    },
    select: {
      id: true,
      publishedAt: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      backgroundImage: true,
      themeId: true,
    },
  });

  return {
    page,
  };
};

export const fetchTeamThemes = async () => {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  if (!session) {
    return {
      error: 'Unauthorized',
    };
  }

  const { session: sessionData } = session?.data ?? {};

  const themes = await prisma.theme.findMany({
    where: {
      organizationId: sessionData?.activeOrganizationId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  const defaultThemes = await prisma.theme.findMany({
    where: {
      isDefault: true,
    },
    select: {
      id: true,
      name: true,
      isDefault: true,
    },
  });

  return {
    themes: [...defaultThemes, ...themes],
  };
};

export const updateDesignPageSettings = async (
  formData: DesignPageSettingsFormValues,
  currentPageSlug: string
) => {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return {
      error: {
        message: 'Unauthorized',
      },
    };
  }

  const validatedFields = designPageSettingsSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: {
        message: 'Missing required fields',
      },
    };
  }

  const { themeId, backgroundImage } = validatedFields.data;

  const updatedPage = await prisma.page.update({
    where: {
      slug: currentPageSlug,
      organization: {
        id: sessionData?.activeOrganizationId,
        members: {
          some: {
            userId: user?.id,
          },
        },
      },
    },
    data: {
      themeId,
      backgroundImage,
    },
    select: {
      id: true,
    },
  });

  // Revalidate the public page cache (Task E2-14): theme/background affect
  // public rendering. Slug is unchanged here.
  revalidateTag(`page-id-${updatedPage.id}`, 'minutes');
  revalidateTag(
    `page-slug-${currentPageSlug}-${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`,
    'minutes'
  );

  return {
    data: {
      page: updatedPage,
    },
  };
};
