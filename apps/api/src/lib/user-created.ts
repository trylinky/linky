import { validateEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import { createNewStripeCustomer } from '@/modules/billing/utils/create-new-stripe-customer';
import { createNewSubscription } from '@/modules/billing/utils/create-new-subscription';
import { createNewOrganization } from '@/modules/organizations/utils';

export async function handleUserCreated({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw Error('User not found');
  }

  const newOrg = await createNewOrganization({
    ownerId: userId,
    type: 'personal',
  });

  const isValidEmail = validateEmail(user.email);

  const customer = await createNewStripeCustomer({
    email: isValidEmail ? (user.email as string) : '',
    name: user.name ?? '',
    userId: user.id,
    organizationId: newOrg.id,
  });

  if (!customer) {
    throw Error(`Error creating Stripe customer for user ${user.id}`);
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
  await prisma.userFlag.create({
    data: {
      userId,
      key: 'showOnboardingTour',
      value: true,
    },
  });
};
