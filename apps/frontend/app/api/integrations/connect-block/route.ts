import { getAuthSession } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { blocks, Blocks } from '@trylinky/blocks';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { integrationId, blockId } = body;

  const integration = await prisma.integration.findUnique({
    where: {
      id: integrationId,
      deletedAt: null,
      organization: {
        id: session.activeOrganizationId,
      },
    },
  });

  if (!integration) {
    return NextResponse.json(
      { error: 'Integration not found' },
      { status: 400 }
    );
  }

  const block = await prisma.block.findUnique({
    where: {
      id: blockId,
      page: {
        organizationId: session.activeOrganizationId,
      },
    },
  });

  if (!block) {
    return NextResponse.json({ error: 'Block not found' }, { status: 400 });
  }

  const allowedIntegrationForBlock =
    blocks[block.type as Blocks].integrationType;

  if (allowedIntegrationForBlock !== integration.type) {
    return NextResponse.json(
      { error: 'Invalid integration for block' },
      { status: 400 }
    );
  }

  try {
    await prisma.block.update({
      where: {
        id: blockId,
      },
      data: {
        integration: {
          connect: {
            id: integrationId,
          },
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    captureException(error);
    return NextResponse.json(
      { error: 'Failed to connect block to integration' },
      { status: 500 }
    );
  }
}
