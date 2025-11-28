import { prices } from '@/lib/plans';
import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { captureException } from '@sentry/node';
import safeAwait from 'safe-await';

export async function createNewSubscription({
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  referenceId,
  periodStart,
  periodEnd,
  isTrialing = false,
}: {
  plan: 'premium' | 'team';
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  referenceId: string;
  periodStart: Date;
  periodEnd: Date;
  isTrialing?: boolean;
}) {
  const env = (process.env.NODE_ENV ?? 'development') as
    | 'production'
    | 'development';

  if (!['production', 'development'].includes(env)) {
    throw Error(`Invalid environment: ${env}`);
  }

  const price = prices[env][plan];

  const DEFAULT_TRIAL_PERIOD_DAYS =
    isTrialing && plan === 'premium' ? 14 : undefined;

  let subscriptionId = stripeSubscriptionId;

  let trialStart: Date | undefined;
  let trialEnd: Date | undefined;

  // If the subscription ID is not provided, create a new one
  if (!subscriptionId) {
    const [stripeSubscriptionError, stripeSubscription] = await safeAwait(
      stripeClient.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price,
          },
        ],
        trial_period_days: DEFAULT_TRIAL_PERIOD_DAYS,
      })
    );

    if (stripeSubscriptionError) {
      captureException(stripeSubscriptionError);
      return;
    }

    trialStart = stripeSubscription.trial_start
      ? new Date(stripeSubscription.trial_start * 1000)
      : undefined;
    trialEnd = stripeSubscription.trial_end
      ? new Date(stripeSubscription.trial_end * 1000)
      : undefined;

    subscriptionId = stripeSubscription.id;
  }

  const DEFAULT_SEATS = plan === 'team' ? 5 : 1;

  const [subscriptionError, subscription] = await safeAwait(
    prisma.subscription.create({
      data: {
        plan,
        stripeCustomerId: stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
        status: isTrialing ? 'trialing' : 'active',
        referenceId: referenceId,
        periodStart: periodStart,
        periodEnd: periodEnd,
        seats: DEFAULT_SEATS,
        trialStart: isTrialing ? trialStart : undefined,
        trialEnd: isTrialing ? trialEnd : undefined,
      },
    })
  );

  if (subscriptionError) {
    captureException(subscriptionError);
    return;
  }

  return subscription;
}
