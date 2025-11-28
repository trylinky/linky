import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { FastifyRequest, FastifyReply } from 'fastify';

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

  const { redirectTo } = request.body;

  const customer = await stripeClient.customers.retrieve(
    subscription.stripeCustomerId
  );

  const billingPortalUrl = await stripeClient.billingPortal.sessions.create({
    customer: customer.id,
    return_url: redirectTo,
  });

  return response.status(200).send({
    url: billingPortalUrl.url,
  });
}
