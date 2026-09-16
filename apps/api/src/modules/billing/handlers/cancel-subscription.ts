import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { canManageBilling } from '@/modules/organizations/utils';
import { captureException } from '@sentry/cloudflare';
import type { Context } from 'hono';

export async function cancelSubscriptionHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: session.activeOrganizationId,
      status: {
        in: ['active', 'trialing'],
      },
    },
  });

  if (
    !subscription ||
    !subscription.stripeCustomerId ||
    !subscription.stripeSubscriptionId
  ) {
    // Matches @fastify/sensible's response.notFound() body exactly — no
    // response schema was ever declared for 404 on this route, so nothing
    // stripped it on the way out.
    return c.json(
      { statusCode: 404, error: 'Not Found', message: 'Not Found' },
      404
    );
  }

  if (
    !(await canManageBilling(session.activeOrganizationId, session.user.id))
  ) {
    // Matches response.unauthorized() — see the comment in
    // billing-portal-url.ts for why this exact shape.
    return c.json(
      { statusCode: 401, error: 'Unauthorized', message: 'Unauthorized' },
      401
    );
  }

  try {
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.APP_FRONTEND_URL}/edit`,
      flow_data: {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: subscription.stripeSubscriptionId,
        },
      },
    });

    return c.json({ success: true, url: portalSession.url }, 200);
  } catch (error) {
    console.log('Error', error);
    captureException(error);
    // Matches response.internalServerError().
    return c.json(
      {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal Server Error',
      },
      500
    );
  }
}
