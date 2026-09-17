import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import type { Context } from 'hono';

export async function getUpgradeEligibilityHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const current = await db.query.subscription.findFirst({
    where: (s, { eq }) => eq(s.referenceId, session.activeOrganizationId),
  });

  if (!current) {
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
    ].includes(current.status)
  ) {
    return c.json(
      {
        canUpgrade: false,
        nextPlan: null,
        message: 'Subscription is in a failed state',
        nextStep: 'createSubscription',
        currentPlan: current.plan,
      },
      200
    );
  }

  if (current.plan === 'team') {
    return c.json(
      {
        canUpgrade: false,
        nextPlan: null,
        message: 'Team plan cannot be upgraded',
        nextStep: null,
        currentPlan: current.plan,
      },
      200
    );
  }

  if (current.plan === 'freeLegacy') {
    // `addPaymentMethod` and `completeTrial` are trial concepts: a legacy
    // free org has no trial to complete, it needs a Checkout session. The
    // pricing table's freeLegacy branch posts to /billing/upgrade/premium.
    return c.json(
      {
        canUpgrade: true,
        nextPlan: 'premium',
        nextStep: 'checkout',
        message: null,
        currentPlan: current.plan,
      },
      200
    );
  }

  if (current.plan === 'premium') {
    const customer = await stripeClient.customers.retrieve(
      current.stripeCustomerId
    );

    if (
      !customer.deleted &&
      !customer.invoice_settings.default_payment_method
    ) {
      return c.json(
        {
          canUpgrade: false,
          nextStep: 'addPaymentMethod',
          currentPlan: current.plan,
        },
        200
      );
    }

    return c.json(
      {
        nextStep: 'completeTrial',
        currentPlan: current.plan,
      },
      200
    );
  }

  return c.json(
    {
      canUpgrade: false,
      nextPlan: null,
      nextStep: null,
      currentPlan: current.plan,
    },
    200
  );
}
