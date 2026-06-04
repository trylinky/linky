'use server';

import { FormValues as DesignPageSettingsFormValues } from './EditPageSettingsDesignForm';
import { FormValues as GeneralPageSettingsFormValues } from './EditPageSettingsGeneralForm';
import { designPageSettingsSchema, generalPageSettingsSchema } from './shared';
import { getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { isForbiddenSlug, isReservedSlug } from '@/lib/slugs';
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

  const { user, session: sessionData } = session?.data ?? {};

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

export const updateGeneralPageSettings = async (
  formData: GeneralPageSettingsFormValues,
  currentPageSlug: string
) => {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return {
      message: 'error',
      data: null,
    };
  }

  const validatedFields = generalPageSettingsSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      error: {
        message: 'Missing required fields',
      },
    };
  }

  const { metaTitle, pageSlug, published } = validatedFields.data;

  if (!pageSlug || !metaTitle) {
    return {
      error: {
        message: 'Missing required fields',
      },
    };
  }

  if (currentPageSlug !== pageSlug) {
    const existingPage = await prisma.page.findUnique({
      where: {
        deletedAt: null,
        slug: pageSlug,
      },
    });

    if (isForbiddenSlug(pageSlug)) {
      return {
        error: {
          message: 'Slug is forbidden',
          field: 'pageSlug',
        },
      };
    }

    if (isReservedSlug(pageSlug)) {
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
  }

  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      organization: {
        id: sessionData?.activeOrganizationId,
        members: {
          some: {
            userId: user?.id,
          },
        },
      },
      slug: currentPageSlug,
    },
  });

  if (!page) {
    return {
      error: {
        message: 'Page not found',
      },
    };
  }

  const updatedPage = await prisma.page.update({
    where: {
      organization: {
        id: sessionData?.activeOrganizationId,
        members: {
          some: {
            userId: user?.id,
          },
        },
      },
      slug: currentPageSlug,
    },
    data: {
      metaTitle,
      slug: pageSlug,
      publishedAt: published ? new Date() : null,
    },
    select: {
      id: true,
    },
  });

  // Revalidate the public page cache (Task E2-14). `pageSlug` is the new slug;
  // `currentPageSlug` is the old one. The `page-id` tag invalidates all content
  // (and, via the by-slug fn's secondary id tag, the slug->id lookup too).
  revalidateTag(`page-id-${updatedPage.id}`, 'minutes');
  revalidateTag(
    `page-slug-${pageSlug}-${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`,
    'minutes'
  );
  if (currentPageSlug !== pageSlug) {
    revalidateTag(
      `page-slug-${currentPageSlug}-${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`,
      'minutes'
    );
  }

  return {
    data: {
      page: updatedPage,
    },
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
