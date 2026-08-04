import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import type { Context } from 'hono';

export async function getUpgradeEligibilityHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: session.activeOrganizationId,
    },
  });

  if (!subscription) {
    // The old Fastify response schema for 404 was
    // `{ type: 'object', properties: {}, additionalProperties: false }` —
    // fast-json-stringify serialises *any* object against that to `{}`, so
    // despite the fields Fastify's handler passed to response.send(), the
    // client only ever received an empty body here. Replicated exactly
    // rather than "fixed" — see the task-15 brief on response-shape leaks.
    return c.json({}, 404);
  }

  if (
    [
      'incomplete',
      'incomplete_expired',
      'past_due',
      'canceled',
      'unpaid',
      'past_due',
    ].includes(subscription.status)
  ) {
    return c.json(
      {
        canUpgrade: false,
        nextPlan: null,
        message: 'Subscription is in a failed state',
        nextStep: 'createSubscription',
        currentPlan: subscription.plan,
      },
      200
    );
  }

  if (subscription.plan === 'team') {
    return c.json(
      {
        canUpgrade: false,
        nextPlan: null,
        message: 'Team plan cannot be upgraded',
        nextStep: null,
        currentPlan: subscription.plan,
      },
      200
    );
  }

  if (['premium', 'freeLegacy'].includes(subscription.plan)) {
    const customer = await stripeClient.customers.retrieve(
      subscription.stripeCustomerId
    );

    if (
      !customer.deleted &&
      !customer.invoice_settings.default_payment_method
    ) {
      return c.json(
        {
          canUpgrade: false,
          nextStep: 'addPaymentMethod',
          currentPlan: subscription.plan,
        },
        200
      );
    }

    return c.json(
      {
        nextStep: 'completeTrial',
        currentPlan: subscription.plan,
      },
      200
    );
  }

  return c.json(
    {
      canUpgrade: false,
      nextPlan: null,
      nextStep: null,
      currentPlan: subscription.plan,
    },
    200
  );
}
