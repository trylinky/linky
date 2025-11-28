import { stripeClient } from '@/lib/stripe';
import { handleSubscriptionCancelled } from '@/modules/billing/handlers/stripe/handle-subscription-cancelled';
import { handleSubscriptionCreated } from '@/modules/billing/handlers/stripe/handle-subscription-created';
import { handleSubscriptionDeleted } from '@/modules/billing/handlers/stripe/handle-subscription-deleted';
import { handleTrialExpired } from '@/modules/billing/handlers/stripe/handle-trial-expired';
import { handleTrialWillEnd } from '@/modules/billing/handlers/stripe/handle-trial-will-end';
import { captureException } from '@sentry/node';
import { FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';

export async function stripeWebhookHandler(
  request: FastifyRequest<{ Body: { rawBody: string }; RawBody: string }>,
  response: FastifyReply
) {
  const signature = request.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(
      request.rawBody as string,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.log('Error', error);
    captureException(error);
    return response.status(400).send({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        // When a new subscription is created
        await handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.deleted':
        // When a subscription is deleted - either by the user or by us
        await handleSubscriptionDeleted(event);
        break;
      case 'customer.subscription.updated':
        // Trial ended, payment attempt failed immediately after trial
        if (
          event.data.previous_attributes?.status === 'active' &&
          event.data.object.status === 'past_due' &&
          event.data.object.trial_end != null &&
          event.data.object.ended_at == null
        ) {
          await handleTrialExpired(event);
        }

        // Subscription actually canceled later (fully deleted after retries failed)
        if (
          event.data.object.status === 'canceled' &&
          event.data.object.trial_end != null &&
          event.data.object.ended_at != null
        ) {
          await handleSubscriptionCancelled(event);
        }

        break;
      case 'customer.subscription.trial_will_end':
        // This event occurs 3 days before a trial ends
        await handleTrialWillEnd(event);
        break;
    }
  } catch (error) {
    captureException(error);
    return response.status(400).send({ error: 'Failed to process webhook' });
  }

  return response.status(200).send({ received: true });
}
