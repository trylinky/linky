import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { captureException } from '@sentry/node';
import { FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';

export const cancelSubscriptionSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        url: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export async function cancelSubscriptionHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: session?.activeOrganizationId,
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
    return response.notFound();
  }

  const membership = await prisma.member.findFirst({
    where: {
      organizationId: session?.activeOrganizationId,
      userId: session?.user.id,
      role: {
        in: ['admin', 'owner'],
      },
    },
  });

  if (!membership) {
    return response.unauthorized();
  }

  try {
    const session = await stripeClient.billingPortal.sessions.create({
      customer: subscription?.stripeCustomerId,
      return_url: `${process.env.APP_FRONTEND_URL}/edit`,
      flow_data: {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: subscription.stripeSubscriptionId,
        },
      },
    });

    return response.status(200).send({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.log('Error', error);
    captureException(error);
    return response.internalServerError();
  }
}
