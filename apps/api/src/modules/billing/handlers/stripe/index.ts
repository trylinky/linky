import type { AppBindings } from '@/env';
import { stripeClient } from '@/lib/stripe';
import { handleSubscriptionCancelled } from '@/modules/billing/handlers/stripe/handle-subscription-cancelled';
import { handleSubscriptionCreated } from '@/modules/billing/handlers/stripe/handle-subscription-created';
import { handleSubscriptionDeleted } from '@/modules/billing/handlers/stripe/handle-subscription-deleted';
import { handleTrialExpired } from '@/modules/billing/handlers/stripe/handle-trial-expired';
import { handleTrialWillEnd } from '@/modules/billing/handlers/stripe/handle-trial-will-end';
import { captureException } from '@sentry/cloudflare';
import type { Context } from 'hono';
import Stripe from 'stripe';

export async function stripeWebhookHandler(c: Context<AppBindings>) {
  const signature = c.req.header('stripe-signature') ?? '';
  // The raw body, not the parsed one: Stripe signs the exact bytes it sent,
  // so anything that parses and re-serialises the body first breaks every
  // signature. fastify-raw-body existed on Fastify solely to preserve this.
  const rawBody = await c.req.text();

  let event: Stripe.Event;

  try {
    // constructEventAsync, not the synchronous constructEvent: the sync form
    // uses Node crypto primitives that don't exist on Workers, so it throws
    // at runtime rather than at compile time.
    event = await stripeClient.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.log('Error', error);
    captureException(error);
    return c.json({ error: 'Invalid signature' }, 400);
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
    return c.json({ error: 'Failed to process webhook' }, 400);
  }

  return c.json({ received: true }, 200);
}
