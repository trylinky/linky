import 'server-only';

import { getAuthSession } from '@/lib/api/auth';
import { getEnabledBlocks as getEnabledBlocksService } from '@/lib/api/blocks';
import { prisma } from '@/lib/prisma';

export async function getEnabledBlocks() {
  const session = await getAuthSession();

  if (!session?.user) {
    return [];
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!dbUser) {
    return [];
  }

  return getEnabledBlocksService(dbUser);
}
