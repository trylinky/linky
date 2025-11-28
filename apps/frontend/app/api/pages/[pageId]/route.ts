import { getAuthSession } from '@/lib/api/auth';
import { checkUserHasAccessToPage, deletePage } from '@/lib/api/pages';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userHasAccess = await checkUserHasAccessToPage(pageId, session.user.id);

  if (!userHasAccess) {
    return NextResponse.json({}, { status: 403 });
  }

  await deletePage(pageId);

  return NextResponse.json({ success: true });
}
