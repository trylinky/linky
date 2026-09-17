import db from '@/lib/db';
import { stripeClient } from '@/lib/stripe';
import { sendTrialEndedEmail } from '@/modules/notifications/service';
import { getOrganizationMemberEmails } from '@/modules/organizations/utils';
import { sendSlackMessage } from '@/modules/slack/service';
import { captureException } from '@sentry/cloudflare';
import safeAwait from 'safe-await';
import Stripe from 'stripe';

export async function handleTrialExpired(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.updated') {
    return;
  }

  const [stripeError, stripeSubscription] = await safeAwait(
    stripeClient.subscriptions.retrieve(event.data.object.id)
  );

  if (stripeError || !stripeSubscription) {
    captureException('Error retrieving stripe subscription', {
      extra: {
        stripeError,
        stripeSubscription,
      },
    });
    return;
  }

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

  if (error || !current) {
    captureException('Error retrieving subscription', {
      extra: {
        error,
        current,
      },
    });
    return;
  }

  const emails = await getOrganizationMemberEmails(current.referenceId);

  emails.forEach(async (email) => {
    await sendTrialEndedEmail(email);
  });

  await sendSlackMessage({
    text: `Trial expired for ${current.referenceId} (Subscription: ${current.id})`,
  });

  return {
    success: true,
  };
}
