import db from '@/lib/db';
import { prices } from '@/lib/plans';
import { stripeClient } from '@/lib/stripe';
import { captureException } from '@sentry/cloudflare';
import { subscription } from '@trylinky/db/schema';
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
        items: [{ price }],
        trial_period_days: DEFAULT_TRIAL_PERIOD_DAYS,
        ...(DEFAULT_TRIAL_PERIOD_DAYS
          ? {
              // No card at signup: let Stripe cancel the subscription the
              // moment the trial ends instead of dunning a card-less
              // customer for three weeks. customer.subscription.deleted then
              // runs the one downgrade path.
              trial_settings: {
                end_behavior: { missing_payment_method: 'cancel' },
              },
            }
          : {}),
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

  const [subscriptionError, created] = await safeAwait(
    db
      .insert(subscription)
      .values({
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
      })
      .returning()
  );

  if (subscriptionError) {
    captureException(subscriptionError);
    return;
  }

  return created[0];
}
