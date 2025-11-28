import { getAuthSession } from '@/lib/api/auth';
import { getBlockById, deleteBlockById } from '@/lib/api/blocks';
import { createPosthogClient } from '@/lib/posthog';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const session = await getAuthSession();

  const block = await getBlockById(blockId);

  if (!block?.page.publishedAt) {
    if (session?.activeOrganizationId !== block?.page.organizationId) {
      return NextResponse.json(
        { error: { message: 'Block not found' } },
        { status: 404 }
      );
    }
  }

  return NextResponse.json({
    integration: block?.integration,
    blockData: block?.data,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const { blockId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const posthog = createPosthogClient();

  const block = await prisma.block.findUnique({
    where: {
      id: blockId,
      page: {
        organization: {
          id: session.activeOrganizationId,
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
    },
    include: {
      page: true,
    },
  });

  if (!block) {
    return NextResponse.json(
      { error: { message: 'Block not found' } },
      { status: 400 }
    );
  }

  if (block.type === 'header') {
    return NextResponse.json(
      { error: { message: 'You cannot delete the header block' } },
      { status: 400 }
    );
  }

  try {
    await deleteBlockById(blockId, session.user.id);

    posthog?.capture({
      distinctId: session.user.id,
      event: 'block-deleted',
      properties: {
        organizationId: session.activeOrganizationId,
        pageId: block.pageId,
        blockId: block.id,
        blockType: block.type,
      },
    });

    return NextResponse.json({
      message: 'Block deleted',
    });
  } catch (error) {
    return NextResponse.json(
      { error: { message: 'Sorry, there was an error deleting this block' } },
      { status: 400 }
    );
  }
}
