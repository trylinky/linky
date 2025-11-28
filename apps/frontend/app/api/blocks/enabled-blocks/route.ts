import { getAuthSession } from '@/lib/api/auth';
import { getEnabledBlocks } from '@/lib/api/blocks';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json([]);
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!dbUser) {
    return NextResponse.json([]);
  }

  const enabledBlocks = await getEnabledBlocks(dbUser);

  return NextResponse.json(enabledBlocks);
}
