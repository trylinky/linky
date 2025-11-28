import { stripeClient } from '@/lib/stripe';

export async function createNewStripeCustomer({
  email = '',
  name = '',
  userId,
  organizationId,
}: {
  email: string;
  name: string;
  userId: string;
  organizationId: string;
}) {
  const customer = await stripeClient.customers.create({
    name,
    email,
    metadata: {
      dbUserId: userId,
      dbOrganizationId: organizationId,
    },
  });

  return customer;
}
