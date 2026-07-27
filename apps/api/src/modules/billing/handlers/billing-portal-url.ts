import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { canManageBilling } from '@/modules/organizations/utils';
import { FastifyRequest, FastifyReply } from 'fastify';

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

export const getBillingPortalUrlSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export async function getBillingPortalUrlHandler(
  request: FastifyRequest<{ Body: { redirectTo: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  // The portal can cancel the subscription and change the payment method, so
  // it needs the same admin/owner gate as the cancel endpoint. Without this,
  // any member of the organization could cancel by going through the portal.
  if (
    !(await canManageBilling(session.activeOrganizationId, session.user.id))
  ) {
    return response.unauthorized();
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: session?.activeOrganizationId,
    },
  });

  if (!subscription) {
    return response.status(404).send({
      error: 'No subscription found',
    });
  }

  const customer = await stripeClient.customers.retrieve(
    subscription.stripeCustomerId
  );

  const billingPortalUrl = await stripeClient.billingPortal.sessions.create({
    customer: customer.id,
    // `redirectTo` is caller-supplied, so it is only honoured when it points
    // back at our own frontend — otherwise Stripe would bounce the user to an
    // arbitrary site on the way out of the portal.
    return_url: safeReturnUrl(request.body?.redirectTo),
  });

  return response.status(200).send({
    url: billingPortalUrl.url,
  });
}
