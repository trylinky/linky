import { getAuthSession } from '@/lib/api/auth';
import { createNewPage } from '@/lib/api/pages';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { slug, themeId } = body;

  if (!slug) {
    return NextResponse.json(
      { error: { message: 'Missing required fields' } },
      { status: 400 }
    );
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
    if (user?.role !== 'admin') {
      return NextResponse.json(
        {
          error: {
            message: 'You have reached the maximum number of pages',
            label: 'Please upgrade your plan to create more pages',
          },
        },
        { status: 400 }
      );
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
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ slug: res.slug });
  } catch (error) {
    console.log('error', error);
    return NextResponse.json({ error }, { status: 400 });
  }
}
