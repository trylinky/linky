import { getAuthSession } from '@/lib/api/auth';
import { getPageThemeById } from '@/lib/api/pages';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const session = await getAuthSession();

  const page = await getPageThemeById(pageId);

  if (!page?.publishedAt) {
    if (session?.activeOrganizationId !== page?.organizationId) {
      return NextResponse.json({}, { status: 404 });
    }
  }

  return NextResponse.json(page);
}
