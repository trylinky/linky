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

/** Organization roles allowed to manage billing. */
const BILLING_ROLES = ['admin', 'owner'];

/**
 * Whether the user may manage the organization's billing.
 *
 * Note this is Member.role (owner/admin/member), the role *within* an
 * organization — not User.role, which is the site-wide one.
 */
export async function canManageBilling(
  organizationId: string | undefined,
  userId: string | undefined
): Promise<boolean> {
  if (!organizationId || !userId) {
    return false;
  }

  const membership = await prisma.member.findFirst({
    where: {
      organizationId,
      userId,
      role: { in: BILLING_ROLES },
    },
    select: { id: true },
  });

  return membership !== null;
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
