import { getPageIdBySlugOrDomain } from '@/lib/api/pages';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, domain } = body;

  if (!slug && !domain) {
    return NextResponse.json(
      { error: { message: 'Slug or domain is required' } },
      { status: 400 }
    );
  }

  const pageId = await getPageIdBySlugOrDomain(slug, domain);

  return NextResponse.json({ pageId });
}
