import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { FastifyRequest, FastifyReply } from 'fastify';

export const getUpgradeEligibilitySchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        canUpgrade: { type: 'boolean' },
        nextPlan: { type: 'string' },
        nextStep: { type: 'string' },
        message: { type: 'string' },
        currentPlan: { type: 'string' },
      },
      additionalProperties: false,
    },
    404: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
};

export async function getUpgradeEligibilityHandler(
  request: FastifyRequest,
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
      canUpgrade: false,
      nextPlan: null,
      message: 'No subscription found',
    });
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
    return response.status(200).send({
      canUpgrade: false,
      nextPlan: null,
      message: 'Subscription is in a failed state',
      nextStep: 'createSubscription',
      currentPlan: subscription.plan,
    });
  }

  if (subscription.plan === 'team') {
    return response.status(200).send({
      canUpgrade: false,
      nextPlan: null,
      message: 'Team plan cannot be upgraded',
      nextStep: null,
      currentPlan: subscription.plan,
    });
  }

  if (['premium', 'freeLegacy'].includes(subscription.plan)) {
    const customer = await stripeClient.customers.retrieve(
      subscription.stripeCustomerId
    );

    if (
      !customer.deleted &&
      !customer.invoice_settings.default_payment_method
    ) {
      return response.status(200).send({
        canUpgrade: false,
        nextStep: 'addPaymentMethod',
        currentPlan: subscription.plan,
      });
    }

    return response.status(200).send({
      nextStep: 'completeTrial',
      currentPlan: subscription.plan,
    });
  }

  return response.status(200).send({
    canUpgrade: false,
    nextPlan: null,
    nextStep: null,
    currentPlan: subscription.plan,
  });
}
