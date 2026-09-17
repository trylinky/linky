import db from '@/lib/db';
import { subscription } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { captureMessage } from '@sentry/cloudflare';
import Stripe from 'stripe';

/**
 * Handle subscription cancelled events (when a user cancels but the
 * subscription is still active until period end)
 */
export async function handleSubscriptionCancelled(event: Stripe.Event) {
  const stripeSubscription = event.data.object as Stripe.Subscription;

  const current = await db.query.subscription.findFirst({
    where: (s, { eq }) => eq(s.stripeSubscriptionId, stripeSubscription.id),
  });

  if (!current) {
    captureMessage(
      `Subscription cancelled but not found in database: ${stripeSubscription.id}`
    );
    return;
  }

  // Update the subscription to reflect cancellation at period end
  await db
    .update(subscription)
    .set({ cancelAtPeriodEnd: true })
    .where(eq(subscription.id, current.id));

  return {
    success: true,
  };
}
