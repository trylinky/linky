import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
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
 * The user's personal organization, created on first call.
 *
 * Sign-up creates the personal org in better-auth's `user.create.after`
 * hook, but better-auth defers `after` hooks until the whole request handler
 * has finished (`runWithAdapter` in @better-auth/core). On a magic-link
 * sign-up that is *after* the session is created, so the session hook that
 * sets `activeOrganizationId` found no org and every new email sign-up
 * landed in the editor with no active organization. Both the session hook
 * and the sign-up hook go through here, so whichever runs first creates the
 * org and the other reuses it.
 */
export async function ensurePersonalOrganization(userId: string) {
  const existing = await db.query.organization.findFirst({
    where: (o, { and, eq }) =>
      and(eq(o.isPersonal, true), userIsMemberOfOrg(o.id, userId)),
  });

  if (existing) {
    return existing;
  }

  return createNewOrganization({ ownerId: userId, type: 'personal' });
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
