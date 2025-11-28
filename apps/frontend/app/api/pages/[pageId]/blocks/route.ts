import { getAuthSession } from '@/lib/api/auth';
import { getPageBlocks } from '@/lib/api/pages';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const session = await getAuthSession();

  if (!pageId) {
    return NextResponse.json({}, { status: 400 });
  }

  const page = await getPageBlocks(pageId);

  if (!page) {
    return NextResponse.json({}, { status: 404 });
  }

  let currentUserIsOwner = false;

  if (
    session?.user.id &&
    page?.organizationId === session?.activeOrganizationId
  ) {
    currentUserIsOwner = true;
  }

  if (page.publishedAt == null && !currentUserIsOwner) {
    return NextResponse.json({}, { status: 404 });
  }

  return NextResponse.json({
    blocks: page.blocks,
    currentUserIsOwner,
  });
}
