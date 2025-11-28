import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { sendSubscriptionUpgradedPremiumEmail } from '@/modules/notifications/service';
import { FastifyRequest, FastifyReply } from 'fastify';
import safeAwait from 'safe-await';

export const upgradeTrialSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export async function upgradeTrialHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const [currentUserError, currentUser] = await safeAwait(
    prisma.user.findUnique({
      where: {
        id: session?.user.id,
      },
      select: {
        email: true,
      },
    })
  );

  if (currentUserError || !currentUser) {
    return response.status(400).send({
      error: 'Failed to get current user',
    });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: session?.activeOrganizationId,
    },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    return response.status(404).send({
      error: 'No subscription found',
    });
  }

  if (subscription.status !== 'trialing') {
    return response.status(400).send({
      error: 'Subscription is not currently trialing',
    });
  }

  try {
    const updatedSubscription = await stripeClient.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        trial_end: 'now',
      }
    );

    if (updatedSubscription.status === 'active') {
      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: 'active',
          trialStart: null,
          trialEnd: null,
        },
      });

      if (currentUser.email) {
        await sendSubscriptionUpgradedPremiumEmail({
          email: currentUser.email,
        });
      }

      return response.status(200).send({
        success: true,
      });
    }
  } catch (error) {
    console.log('Error', error);
    return response.status(400).send({
      error: 'Failed to upgrade trial',
    });
  }
}
