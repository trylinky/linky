import {
  handleSubscriptionCancelled,
  handleSubscriptionCreated,
  handleSubscriptionDeleted,
  handleTrialExpired,
  handleTrialWillEnd,
} from '@/lib/api/billing-handlers';
import { stripeClient } from '@/lib/stripe';
import { captureException } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature') as string;
  const body = await request.text();

  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.log('Error', error);
    captureException(error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;
      case 'customer.subscription.updated':
        if (
          (event.data.previous_attributes as any)?.status === 'active' &&
          event.data.object.status === 'past_due' &&
          event.data.object.trial_end != null &&
          event.data.object.ended_at == null
        ) {
          await handleTrialExpired(event);
        }

        if (
          event.data.object.status === 'canceled' &&
          event.data.object.trial_end != null &&
          event.data.object.ended_at != null
        ) {
          await handleSubscriptionCancelled(event);
        }
        break;
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event);
        break;
    }
  } catch (error) {
    captureException(error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
