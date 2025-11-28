import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

interface HeaderBlockConfig {
  title: string;
  description: string;
}

export async function GET() {
  const featuredPages = await prisma.page.findMany({
    where: {
      isFeatured: true,
      deletedAt: null,
      publishedAt: { not: null },
    },
    select: {
      id: true,
      slug: true,
      blocks: {
        where: {
          type: 'header',
        },
        select: {
          config: true,
        },
        take: 1,
      },
    },
  });

  const result = featuredPages.map((page) => {
    const headerBlock = page.blocks[0];
    const config = headerBlock?.config as unknown as
      | HeaderBlockConfig
      | undefined;

    return {
      id: page.id,
      slug: page.slug,
      headerTitle: config?.title ?? '',
      headerDescription: config?.description ?? '',
    };
  });

  return NextResponse.json(result);
}
