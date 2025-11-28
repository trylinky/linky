import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { sendTrialEndedEmail } from '@/modules/notifications/service';
import { sendSlackMessage } from '@/modules/slack/service';
import { captureException } from '@sentry/node';
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

  const [error, subscription] = await safeAwait(
    prisma.subscription.findFirst({
      where: {
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
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

  if (error || !subscription) {
    captureException('Error retrieving subscription', {
      extra: {
        error,
        subscription,
      },
    });
    return;
  }

  const orgUsers = subscription.organization?.members.map(
    (member) => member.user
  );

  if (!orgUsers) {
    return;
  }

  orgUsers.forEach(async (user) => {
    if (user.email) {
      await sendTrialEndedEmail(user.email);
    }
  });

  await sendSlackMessage({
    text: `Trial expired for ${subscription.organization?.id} (Subscription: ${subscription.id})`,
  });

  return {
    success: true,
  };
}
