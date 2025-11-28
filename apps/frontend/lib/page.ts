import prisma from './prisma';
import { getSession } from '@/app/lib/auth';
import { headerBlockDefaults } from '@trylinky/blocks';
import { track } from '@vercel/analytics/server';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';

export const MAX_PAGES_PER_TEAM = 10;

interface NewPageInput {
  slug: string;
  themeId: string;
}

export async function createNewPage(input: NewPageInput) {
  const headerSectionId = randomUUID();

  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  if (!session) {
    return null;
  }

  const { user, session: sessionData } = session.data ?? {};

  await track('pageCreated', {
    teamId: sessionData?.activeOrganizationId ?? 'unknown',
    slug: input.slug,
  });

  return prisma.page.create({
    data: {
      organizationId: sessionData?.activeOrganizationId,
      slug: input.slug,
      publishedAt: new Date(),
      themeId: input.themeId,
      metaTitle: `@${input.slug}`,
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
            title: `@${input.slug}`,
          },
        },
      },
    },
    select: {
      slug: true,
    },
  });
}
