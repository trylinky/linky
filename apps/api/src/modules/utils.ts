import prisma from '@/lib/prisma';
import { getUserPlanDetails } from '@/modules/users/utils';
import { FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';

export async function checkUserHasActivePlan(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    return false;
  }

  const userPlan = getUserPlanDetails(user);

  if (userPlan.status === 'inactive') {
    return false;
  }

  return true;
}
