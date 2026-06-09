import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const MAX_TAGS_PER_REQUEST = 20;
const MAX_TAG_LENGTH = 256;

/**
 * Internal revalidation bridge: lets apps/api invalidate the public page
 * cache (`'use cache'` tags in app/lib/actions/page-actions.ts) after
 * mutations that happen outside Next.js (block CRUD, layout saves, page
 * create/delete). See docs/superpowers/specs/2026-06-09-public-page-performance-design.md.
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-internal-api-key');

  if (!process.env.INTERNAL_API_KEY || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const tags = (body as { tags?: unknown })?.tags;

  if (
    !Array.isArray(tags) ||
    tags.length === 0 ||
    tags.length > MAX_TAGS_PER_REQUEST ||
    !tags.every(
      (tag): tag is string =>
        typeof tag === 'string' && tag.length > 0 && tag.length <= MAX_TAG_LENGTH
    )
  ) {
    return NextResponse.json(
      { error: 'Body must be { tags: string[] } with 1-20 non-empty tags' },
      { status: 400 }
    );
  }

  for (const tag of tags) {
    // 'max' marks entries stale immediately and refreshes in the background
    // (updateTag's read-your-own-writes form is server-action-only).
    revalidateTag(tag, 'max');
  }

  return new NextResponse(null, { status: 204 });
}
