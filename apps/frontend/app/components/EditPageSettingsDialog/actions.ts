'use server';

import { FormValues as DesignPageSettingsFormValues } from './EditPageSettingsDesignForm';
import { FormValues as GeneralPageSettingsFormValues } from './EditPageSettingsGeneralForm';
import { designPageSettingsSchema, generalPageSettingsSchema } from './shared';
import { getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { isForbiddenSlug, isReservedSlug } from '@/lib/slugs';
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

  return {
    data: {
      page: updatedPage,
    },
  };
};
