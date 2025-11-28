import { getReactionsForPageId, reactToResource } from '@/lib/api/reactions';
import { getIpAddress } from '@/lib/api/utils';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('pageId') || '';

  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
    },
  });

  if (!page) {
    return NextResponse.json(
      { error: { message: 'Page not found' } },
      { status: 404 }
    );
  }

  const ipAddress = await getIpAddress();

  const reactions = await getReactionsForPageId({ pageId, ipAddress });

  return NextResponse.json(reactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { pageId, increment } = body;

  const ipAddress = await getIpAddress();

  const reactions = await reactToResource(pageId, increment, ipAddress);

  return NextResponse.json(reactions);
}
