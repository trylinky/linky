import prisma from '@/lib/prisma';
import { captureMessage } from '@sentry/node';
import Stripe from 'stripe';

/**
 * Handle subscription cancelled events (when a user cancels but the
 * subscription is still active until period end)
 */
export async function handleSubscriptionCancelled(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });

  if (!dbSubscription) {
    captureMessage(
      `Subscription cancelled but not found in database: ${subscription.id}`
    );
    return;
  }

  // Update the subscription to reflect cancellation at period end
  await prisma.subscription.update({
    where: {
      id: dbSubscription.id,
    },
    data: {
      cancelAtPeriodEnd: true,
    },
  });

  return {
    success: true,
  };
}
