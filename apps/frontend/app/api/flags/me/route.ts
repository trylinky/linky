import { getAuthSession } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userFlags = await prisma.userFlag.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      key: true,
      value: true,
    },
  });

  return NextResponse.json({
    flags: userFlags,
  });
}
