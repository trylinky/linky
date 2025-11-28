import prisma from '@/lib/prisma';
import { FastifyReply, FastifyRequest } from 'fastify';

export const getCurrentUserSubscriptionSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        plan: { type: 'string' },
        status: { type: 'string' },
        isTeamPremium: { type: 'boolean' },
        periodEnd: { type: 'string' },
        trialDaysLeft: { type: 'number' },
      },
      additionalProperties: false,
    },
  },
};

export async function getCurrentUserSubscriptionHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const usersOrganizations = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
      subscription: {
        status: {
          in: ['active', 'trialing'],
        },
      },
    },
    select: {
      isPersonal: true,
      id: true,
      subscription: true,
    },
  });

  const currentOrganization = usersOrganizations.find(
    (org) => org.id === session.activeOrganizationId
  );

  if (currentOrganization?.subscription?.plan === 'team') {
    return response.status(200).send({
      plan: 'team',
      status: 'active',
      periodEnd: currentOrganization.subscription.cancelAtPeriodEnd
        ? currentOrganization.subscription.periodEnd
        : null,
    });
  }

  const teamOrgs = usersOrganizations.filter(
    (org) => org.subscription?.plan === 'team'
  );

  if (teamOrgs.length > 0) {
    return response.status(200).send({
      plan: 'premium',
      status: 'active',
      isTeamPremium: true,
    });
  }

  const premiumOrgs = usersOrganizations.filter(
    (org) => org.subscription?.plan === 'premium' && org.isPersonal
  );

  const premiumOrg = premiumOrgs[0];

  const daysLeftOnTrial =
    premiumOrg?.subscription?.status === 'trialing' &&
    premiumOrg.subscription.trialEnd
      ? Math.ceil(
          (new Date(premiumOrg.subscription.trialEnd).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  if (premiumOrg) {
    return response.status(200).send({
      plan: 'premium',
      status: premiumOrg.subscription?.status,
      isTeamPremium: false,
      trialDaysLeft: daysLeftOnTrial,
      periodEnd: premiumOrg.subscription?.cancelAtPeriodEnd
        ? premiumOrg.subscription?.periodEnd
        : null,
    });
  }

  const freeLegacyOrgs = usersOrganizations.filter(
    (org) => org.subscription?.plan === 'freeLegacy'
  );

  if (freeLegacyOrgs.length > 0) {
    return response.status(200).send({
      plan: 'freeLegacy',
      status: 'active',
      isTeamPremium: false,
    });
  }

  return response.status(200).send({
    plan: 'freeLegacy',
    status: 'inactive',
    isTeamPremium: false,
  });
}
