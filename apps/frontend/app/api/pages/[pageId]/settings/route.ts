import { getAuthSession } from '@/lib/api/auth';
import { getPageSettings } from '@/lib/api/pages';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const page = await getPageSettings(pageId);

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

  return NextResponse.json(page);
}
