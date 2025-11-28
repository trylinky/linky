'use server';

import { getReactionsForPageId, reactToResource } from '@/lib/api/reactions';
import { getIpAddress } from '@/lib/api/utils';
import { prisma } from '@/lib/prisma';

export async function getReactions(pageId: string) {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
    },
  });

  if (!page) {
    return {
      total: {},
      current: {},
    };
  }

  const ipAddress = await getIpAddress();

  const reactions = await getReactionsForPageId({ pageId, ipAddress });

  return reactions;
}

export async function postReaction(pageId: string, increment: number) {
  const ipAddress = await getIpAddress();

  const reactions = await reactToResource(pageId, increment, ipAddress);

  return reactions;
}
