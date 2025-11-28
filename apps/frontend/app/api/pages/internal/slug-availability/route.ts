import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';

  const page = await prisma.page.count({
    where: {
      deletedAt: null,
      slug: slug,
    },
  });

  return NextResponse.json({
    isAvailable: page === 0,
  });
}
