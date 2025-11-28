import { getAuthSession } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.userFlag.updateMany({
    where: {
      userId: session.user.id,
      key: 'showOnboardingTour',
    },
    data: {
      value: false,
    },
  });

  return NextResponse.json({ success: true });
}
