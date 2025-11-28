import prisma from '@/lib/prisma';
import { FastifyReply, FastifyRequest } from 'fastify';

export const hideOnboardingTourSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
      },
      additionalProperties: false,
    },
  },
};

export async function hideOnboardingTourHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  await prisma.userFlag.updateMany({
    where: {
      userId: session?.user.id,
      key: 'showOnboardingTour',
    },
    data: {
      value: false,
    },
  });

  return response.status(200).send({
    success: true,
  });
}
