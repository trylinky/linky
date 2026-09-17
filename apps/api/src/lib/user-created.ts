import db from '@/lib/db';
import { validateEmail } from '@/lib/email';
import { createNewStripeCustomer } from '@/modules/billing/utils/create-new-stripe-customer';
import { createNewSubscription } from '@/modules/billing/utils/create-new-subscription';
import { createNewOrganization } from '@/modules/organizations/utils';
import { userFlag } from '@trylinky/db/schema';

export async function handleUserCreated({ userId }: { userId: string }) {
  const currentUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });

  if (!currentUser) {
    throw Error('User not found');
  }

  const newOrg = await createNewOrganization({
    ownerId: userId,
    type: 'personal',
  });

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
  await db.insert(userFlag).values({ userId, key: 'showOnboardingTour', value: true });
};
