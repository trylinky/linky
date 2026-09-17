import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { canManageBilling } from '@/modules/organizations/utils';
import type { Context } from 'hono';

const defaultReturnUrl = () => `${process.env.APP_FRONTEND_URL}/edit`;

/** Only allows a return_url on our own frontend origin. */
export function safeReturnUrl(redirectTo: string | undefined): string {
  const fallback = defaultReturnUrl();

  if (!redirectTo) {
    return fallback;
  }

  try {
    const target = new URL(redirectTo);
    const appOrigin = new URL(process.env.APP_FRONTEND_URL as string).origin;

    return target.origin === appOrigin ? target.toString() : fallback;
  } catch {
    return fallback;
  }
}

export async function getBillingPortalUrlHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  // The portal can cancel the subscription and change the payment method, so
  // it needs the same admin/owner gate as the cancel endpoint. Without this,
  // any member of the organization could cancel by going through the portal.
  if (
    !(await canManageBilling(session.activeOrganizationId, session.user.id))
  ) {
    // Matches @fastify/sensible's response.unauthorized(), which serialised
    // to exactly this { statusCode, error, message } body — the Fastify
    // route never declared a response schema for 401, so nothing stripped
    // it on the way out.
    return c.json(
      { statusCode: 401, error: 'Unauthorized', message: 'Unauthorized' },
      401
    );
  }

  const current = await db.query.subscription.findFirst({
    where: (s, { eq }) => eq(s.referenceId, session.activeOrganizationId),
  });

  if (!current) {
    return c.json({ error: 'No subscription found' }, 404);
  }

  const customer = await stripeClient.customers.retrieve(
    current.stripeCustomerId
  );

  // No schema.body was ever registered for this route on Fastify, so this
  // field was never validated at runtime either — read it the same way and
  // let safeReturnUrl handle anything malformed or absent.
  const body = (await c.req.json().catch(() => undefined)) as
    | { redirectTo?: string }
    | undefined;

  const billingPortalUrl = await stripeClient.billingPortal.sessions.create({
    customer: customer.id,
    // `redirectTo` is caller-supplied, so it is only honoured when it points
    // back at our own frontend — otherwise Stripe would bounce the user to an
    // arbitrary site on the way out of the portal.
    return_url: safeReturnUrl(body?.redirectTo),
  });

  return c.json({ url: billingPortalUrl.url }, 200);
}
