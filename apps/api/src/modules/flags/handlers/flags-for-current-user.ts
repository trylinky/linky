import prisma from '@/lib/prisma';
import { FastifyRequest, FastifyReply } from 'fastify';

export const getFlagsForCurrentUserSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        flags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'boolean' },
            },
          },
        },
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

export async function getFlagsForCurrentUserHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const userFlags = await prisma.userFlag.findMany({
    where: {
      userId: session?.user.id,
    },
    select: {
      key: true,
      value: true,
    },
  });

  return response.status(200).send({
    flags: userFlags,
  });
}
