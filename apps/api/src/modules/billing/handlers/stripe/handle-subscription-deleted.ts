import prisma from '@/lib/prisma';
import { sendSubscriptionDeletedEmail } from '@/modules/notifications/service';
import { sendSlackMessage } from '@/modules/slack/service';
import { captureException, captureMessage } from '@sentry/node';
import safeAwait from 'safe-await';
import Stripe from 'stripe';

/**
 * Handle subscription deleted events
 */
export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const [error, dbSubscription] = await safeAwait(
    prisma.subscription.findFirst({
      where: {
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
      },
      select: {
        id: true,
        organization: {
          select: {
            id: true,
            members: {
              select: {
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
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

  if (!dbSubscription) {
    captureMessage(
      `Subscription deleted but not found in database: ${subscription.id}`
    );
    return;
  }

  const [updateError] = await safeAwait(
    prisma.subscription.update({
      where: {
        id: dbSubscription.id,
      },
      data: {
        status: 'canceled',
        plan: 'freeLegacy',
        periodEnd: new Date(),
      },
    })
  );

  if (updateError) {
    captureException(updateError);
  }

  // We should skip sending the cancellation email if the subscription was
  // upgraded to team - we will send a different email in that case
  if (
    subscription.cancellation_details?.comment !== 'LINKY_AUTO_UPGRADED_TO_TEAM'
  ) {
    const orgUsers = dbSubscription.organization?.members.map(
      (member) => member.user
    );

    if (!orgUsers) {
      return;
    }

    orgUsers.forEach(async (user) => {
      if (user.email) {
        await sendSubscriptionDeletedEmail(user.email);
      }
    });
  }

  await sendSlackMessage({
    text: `Subscription deleted for ${dbSubscription.organization?.id} (Subscription: ${dbSubscription.id})`,
  });

  return {
    success: true,
  };
}
