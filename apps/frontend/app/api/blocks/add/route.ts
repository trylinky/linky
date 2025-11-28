import { getAuthSession } from '@/lib/api/auth';
import { createBlock } from '@/lib/api/blocks';
import { createPosthogClient } from '@/lib/posthog';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const posthog = createPosthogClient();

  const body = await request.json();
  const { block, pageSlug } = body;

  if (!block || !pageSlug) {
    return NextResponse.json(
      { error: { message: 'Missing required fields' } },
      { status: 400 }
    );
  }

  const page = await prisma.page.findUnique({
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
      slug: pageSlug,
    },
    include: {
      blocks: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!page) {
    return NextResponse.json(
      { error: { message: 'Page not found' } },
      { status: 400 }
    );
  }

  const maxNumberOfBlocks = 100;
  if (page.blocks.length >= maxNumberOfBlocks) {
    return NextResponse.json(
      {
        error: {
          message: 'You have reached the maximum number of blocks per page',
        },
      },
      { status: 400 }
    );
  }

  const newBlock = await createBlock(block, pageSlug);

  posthog?.capture({
    distinctId: session.user.id,
    event: 'block-created',
    properties: {
      organizationId: session.activeOrganizationId,
      pageId: newBlock.pageId,
      blockId: newBlock.id,
      blockType: newBlock.type,
    },
  });

  return NextResponse.json({
    data: {
      block: newBlock,
    },
  });
}
