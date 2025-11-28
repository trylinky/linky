import { prisma } from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import safeAwait from 'safe-await';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';
  const domain = searchParams.get('domain') || '';

  const apiKey = request.headers.get('x-api-key');

  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const appDomain = new URL(process.env.NEXT_PUBLIC_APP_URL as string);
  const rootDomain =
    process.env.NODE_ENV === 'production'
      ? appDomain.hostname
      : `${appDomain.hostname}:${appDomain.port}`;

  const customDomain = decodeURIComponent(domain) !== rootDomain;

  const [error, page] = await safeAwait(
    prisma.page.findFirst({
      where: {
        deletedAt: null,
        slug: customDomain ? undefined : slug,
        customDomain: customDomain ? decodeURIComponent(domain) : undefined,
      },
      select: {
        id: true,
        organizationId: true,
        publishedAt: true,
        slug: true,
      },
    })
  );

  if (error) {
    console.error(error);
    captureException(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }

  if (!page) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  return NextResponse.json(page);
}
