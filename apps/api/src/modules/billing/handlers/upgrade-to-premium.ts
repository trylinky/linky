import { prices } from '@/lib/plans';
import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { sendSubscriptionUpgradedPremiumEmail } from '@/modules/notifications/service';
import { FastifyReply, FastifyRequest } from 'fastify';
import safeAwait from 'safe-await';

export const upgradeToPremiumSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
      additionalProperties: false,
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export async function upgradeToPremiumHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const [currentUserError, currentUser] = await safeAwait(
    prisma.user.findUnique({
      where: {
        id: session?.user.id,
      },
    })
  );

  if (currentUserError || !currentUser) {
    return response.status(400).send({
      error: 'Failed to get current user',
    });
  }

  const [currentPersonalOrgError, currentPersonalOrg] = await safeAwait(
    prisma.organization.findFirst({
      where: {
        isPersonal: true,
        members: {
          some: {
            userId: currentUser.id,
          },
        },
        subscription: {
          plan: {
            in: ['freeLegacy'],
          },
        },
      },
      select: {
        subscription: {
          select: {
            id: true,
            stripeSubscriptionId: true,
          },
        },
      },
    })
  );

  if (currentPersonalOrgError || !currentPersonalOrg?.subscription) {
    return response.status(400).send({
      error: 'Failed to get current personal org',
    });
  }

  if (!currentPersonalOrg.subscription.stripeSubscriptionId) {
    return response.status(400).send({
      error: 'No stripe subscription id found',
    });
  }

  try {
    const [updatedSubscriptionError] = await safeAwait(
      stripeClient.subscriptions.update(
        currentPersonalOrg.subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: currentPersonalOrg.subscription.id,
              price:
                process.env.NODE_ENV === 'production'
                  ? prices.production.premium
                  : prices.development.premium,
            },
          ],
        }
      )
    );

    if (updatedSubscriptionError) {
      return response.status(400).send({
        error: 'Failed to upgrade to premium',
      });
    }

    if (currentUser.email) {
      await sendSubscriptionUpgradedPremiumEmail({
        email: currentUser.email,
      });
    }

    return response.status(200).send({
      success: true,
    });
  } catch (error) {
    console.log('Error', error);
    return response.status(400).send({
      error: 'Failed to upgrade to premium',
    });
  }
}
