import prisma from '@/lib/prisma';

export async function verifyVerificationStatus(pageId: string) {
  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
      deletedAt: null,
      verifiedAt: {
        not: null,
      },
    },
    select: {
      id: true,
    },
  });

  if (!page) {
    return false;
  }

  return true;
}
