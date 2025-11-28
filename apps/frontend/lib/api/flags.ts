import { prisma } from '@/lib/prisma';

export async function getUserFlags(userId: string) {
  const flags = await prisma.userFlag.findMany({
    where: {
      userId,
    },
  });

  return flags;
}

export async function hideOnboardingTour(userId: string) {
  await prisma.userFlag.updateMany({
    where: {
      userId,
      key: 'showOnboardingTour',
    },
    data: {
      value: false,
    },
  });

  return { success: true };
}
