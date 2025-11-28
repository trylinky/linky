import prisma from '@/lib/prisma';

/**
 * Helper function to create a new organization
 */
export async function createNewOrganization({
  ownerId,
  type,
}: {
  ownerId: string;
  type: 'personal' | 'team';
}) {
  const randomNumber = Math.floor(Math.random() * 1000000);
  const newOrgSlug = `${type}-${randomNumber}`;

  return await prisma.organization.create({
    data: {
      name: type === 'personal' ? 'Personal' : 'My Team',
      slug: newOrgSlug,
      isPersonal: type === 'personal',
      members: {
        create: {
          userId: ownerId,
          role: 'owner',
        },
      },
    },
  });
}
