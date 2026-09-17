import db from '@/lib/db';
import { member, organization, user } from '@trylinky/db/schema';
import { count, eq } from 'drizzle-orm';

/**
 * Whether the organization has room for another member under its plan.
 *
 * An organization with no subscription, or a subscription with no seat count,
 * is unlimited — matching how seats have always been treated.
 */
export async function hasAvailableSeat(
  organizationId: string
): Promise<boolean> {
  const org = await db.query.organization.findFirst({
    where: (o, { eq }) => eq(o.id, organizationId),
    columns: { id: true },
    with: { subscription: { columns: { seats: true } } },
  });

  const seats = org?.subscription?.seats;

  if (!seats) {
    return true;
  }

  const [{ count: memberCount }] = await db
    .select({ count: count() })
    .from(member)
    .where(eq(member.organizationId, organizationId));

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

  const membership = await db.query.member.findFirst({
    where: (m, { and, eq, inArray }) =>
      and(
        eq(m.organizationId, organizationId),
        eq(m.userId, userId),
        inArray(m.role, BILLING_ROLES)
      ),
    columns: { id: true },
  });

  return membership !== undefined;
}

/** Emails of every member of the organization, for billing notifications. */
export async function getOrganizationMemberEmails(
  organizationId: string
): Promise<string[]> {
  const rows = await db
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, organizationId));

  return rows
    .map((row) => row.email)
    .filter((email): email is string => Boolean(email));
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

  // Organization and its owner membership land together or not at all.
  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organization)
      .values({
        name: type === 'personal' ? 'Personal' : 'My Team',
        slug: newOrgSlug,
        isPersonal: type === 'personal',
      })
      .returning();

    await tx
      .insert(member)
      .values({ userId: ownerId, organizationId: org.id, role: 'owner' });

    return org;
  });
}
