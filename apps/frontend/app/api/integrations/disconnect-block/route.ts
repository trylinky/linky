import { getAuthSession } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { blockId } = body;

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

  await prisma.block.update({
    where: {
      id: blockId,
    },
    data: {
      integration: {
        disconnect: true,
      },
    },
  });

  return NextResponse.json({ success: true });
}
