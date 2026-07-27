import prisma from '@/lib/prisma';

/**
 * Whether the organization has room for another member under its plan.
 *
 * An organization with no subscription, or a subscription with no seat count,
 * is unlimited — matching how seats have always been treated.
 */
export async function hasAvailableSeat(
  organizationId: string
): Promise<boolean> {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      subscription: {
        select: {
          seats: true,
        },
      },
    },
  });

  const seats = organization?.subscription?.seats;

  if (!seats) {
    return true;
  }

  const memberCount = await prisma.member.count({
    where: { organizationId },
  });

  return memberCount < seats;
}

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
