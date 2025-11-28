import { prices } from '@/lib/plans';
import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { FastifyReply, FastifyRequest } from 'fastify';

export const upgradeToTeamSchema = {
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

export async function upgradeToTeamHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const currentUser = await prisma.user.findUnique({
    where: {
      id: session?.user.id,
    },
  });

  if (!currentUser) {
    return response.status(404).send({
      error: 'User not found',
    });
  }

  const customer = await stripeClient.customers.create({
    name: 'new organization customer',
    email: currentUser.email ?? '',
    metadata: {
      dbUserId: currentUser.id,
    },
  });

  if (!customer) {
    throw Error('Error creating customer');
  }

  const personalOrg = await prisma.organization.findFirst({
    where: {
      isPersonal: true,
      members: {
        some: {
          userId: currentUser.id,
        },
      },
      subscription: {
        plan: {
          in: ['premium', 'freeLegacy'],
        },
      },
    },
    select: {
      subscription: {
        select: {
          id: true,
        },
      },
    },
  });

  try {
    const upgradeSession = await stripeClient.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          quantity: 1,
          price:
            process.env.NODE_ENV === 'production'
              ? prices.production.team
              : prices.development.team,
        },
      ],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          createdByUserId: currentUser.id, // This user will be the owner of the new team org
          personalSubscriptionId: personalOrg?.subscription?.id ?? null,
        },
      },
      mode: 'subscription',
      success_url: `${process.env.APP_FRONTEND_URL}/edit?showTeamOnboarding=true`,
      cancel_url: `${process.env.APP_FRONTEND_URL}/edit?showBilling=true`,
    });

    return response.status(200).send({
      url: upgradeSession.url,
    });
  } catch (error) {
    console.log('Error', error);
    return response.status(400).send({
      error: 'Failed to upgrade to team',
    });
  }
}
