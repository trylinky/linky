import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { canManageBilling } from '@/modules/organizations/utils';
import { captureException } from '@sentry/cloudflare';
import type { Context } from 'hono';

export async function cancelSubscriptionHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const current = await db.query.subscription.findFirst({
    where: (s, { and, eq, inArray }) =>
      and(
        eq(s.referenceId, session.activeOrganizationId),
        inArray(s.status, ['active', 'trialing'])
      ),
  });

  if (!current || !current.stripeCustomerId || !current.stripeSubscriptionId) {
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
      customer: current.stripeCustomerId,
      return_url: `${process.env.APP_FRONTEND_URL}/edit`,
      flow_data: {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: current.stripeSubscriptionId,
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
