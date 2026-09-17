import db from '@/lib/db';
import { validateEmail } from '@/lib/email';
import { createNewStripeCustomer } from '@/modules/billing/utils/create-new-stripe-customer';
import { createNewSubscription } from '@/modules/billing/utils/create-new-subscription';
import { ensurePersonalOrganization } from '@/modules/organizations/utils';
import { userFlag } from '@trylinky/db/schema';

/**
 * Runs from better-auth's `user.create.after` hook, which better-auth defers
 * until the request handler has finished — on a magic-link sign-up that is
 * after the first session was created. The session hook may therefore have
 * created the personal org already; everything here is idempotent so the
 * two never double up.
 */
export async function handleUserCreated({ userId }: { userId: string }) {
  const currentUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (!currentUser) {
    throw Error('User not found');
  }

  const newOrg = await ensurePersonalOrganization(userId);

  const existingSubscription = await db.query.subscription.findFirst({
    where: (s, { eq }) => eq(s.referenceId, newOrg.id),
    columns: { id: true },
  });

  if (existingSubscription) {
    return newOrg.id;
  }

  const isValidEmail = validateEmail(currentUser.email);

  const customer = await createNewStripeCustomer({
    email: isValidEmail ? (currentUser.email as string) : '',
    name: currentUser.name ?? '',
    userId: currentUser.id,
    organizationId: newOrg.id,
  });

  if (!customer) {
    throw Error(`Error creating Stripe customer for user ${currentUser.id}`);
  }

  const newSubscription = await createNewSubscription({
    plan: 'premium',
    stripeCustomerId: customer.id,
    referenceId: newOrg.id,
    periodStart: new Date(),
    periodEnd: new Date(),
    isTrialing: true,
  });

  if (!newSubscription) {
    throw Error('Error creating subscription');
  }

  return newOrg.id;
}

export const createUserInitialFlags = async (userId: string) => {
  await db
    .insert(userFlag)
    .values({ userId, key: 'showOnboardingTour', value: true });
};
