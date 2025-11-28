import { getAuthSession } from '@/lib/api/auth';
import { disconnectIntegration } from '@/lib/api/integrations';
import { prisma } from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { integrationId } = body;

  const integration = await prisma.integration.findUnique({
    where: {
      id: integrationId,
      organization: {
        id: session.activeOrganizationId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    select: {
      type: true,
    },
  });

  if (!integration) {
    return NextResponse.json(
      { error: 'Integration not found' },
      { status: 400 }
    );
  }

  try {
    await disconnectIntegration(integrationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    captureException(error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
