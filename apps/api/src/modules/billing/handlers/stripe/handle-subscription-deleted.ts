import db from '@/lib/db';
import { getOrganizationMemberEmails } from '@/modules/organizations/utils';
import { sendSubscriptionDeletedEmail } from '@/modules/notifications/service';
import { sendSlackMessage } from '@/modules/slack/service';
import { subscription } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { captureException, captureMessage } from '@sentry/cloudflare';
import safeAwait from 'safe-await';
import Stripe from 'stripe';

/**
 * Handle subscription deleted events
 */
export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const stripeSubscription = event.data.object as Stripe.Subscription;

  const [error, current] = await safeAwait(
    db.query.subscription.findFirst({
      where: (s, { and, eq }) =>
        and(
          eq(s.stripeCustomerId, stripeSubscription.customer as string),
          eq(s.stripeSubscriptionId, stripeSubscription.id)
        ),
      columns: { id: true, referenceId: true },
    })
  );

  if (error) {
    captureException('Error retrieving subscription', {
      extra: {
        error,
      },
    });
    return;
  }

  if (!current) {
    captureMessage(
      `Subscription deleted but not found in database: ${stripeSubscription.id}`
    );
    return;
  }

  const [updateError] = await safeAwait(
    db
      .update(subscription)
      .set({
        status: 'canceled',
        plan: 'freeLegacy',
        periodEnd: new Date(),
      })
      .where(eq(subscription.id, current.id))
  );

  if (updateError) {
    captureException(updateError);
  }

  // We should skip sending the cancellation email if the subscription was
  // upgraded to team - we will send a different email in that case
  if (
    stripeSubscription.cancellation_details?.comment !==
    'LINKY_AUTO_UPGRADED_TO_TEAM'
  ) {
    const emails = await getOrganizationMemberEmails(current.referenceId);

    emails.forEach(async (email) => {
      await sendSubscriptionDeletedEmail(email);
    });
  }

  await sendSlackMessage({
    text: `Subscription deleted for ${current.referenceId} (Subscription: ${current.id})`,
  });

  return {
    success: true,
  };
}
