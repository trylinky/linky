import { getAuthSession } from '@/lib/api/auth';
import {
  getPageLayoutById,
  checkUserHasAccessToPage,
  updatePageLayout,
} from '@/lib/api/pages';
import { createPosthogClient } from '@/lib/posthog';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const session = await getAuthSession();

  const page = await getPageLayoutById(pageId);

  if (!page?.publishedAt) {
    if (session?.activeOrganizationId !== page?.organizationId) {
      return NextResponse.json({}, { status: 404 });
    }
  }

  return NextResponse.json({
    xxs: page?.mobileConfig,
    sm: page?.config,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params;
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const posthog = createPosthogClient();

  const userHasAccess = await checkUserHasAccessToPage(pageId, session.user.id);

  if (!userHasAccess) {
    return NextResponse.json({}, { status: 403 });
  }

  const body = await request.json();
  const { newLayout } = body;

  const updatedPage = await updatePageLayout(pageId, newLayout);

  posthog?.capture({
    distinctId: session.user.id,
    event: 'page-layout-updated',
    properties: {
      pageId,
    },
  });

  return NextResponse.json(updatedPage);
}
