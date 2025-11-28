'use strict';

import { getOrgsForCurrentUserSchema } from './schemas';
import prisma from '@/lib/prisma';
import { FastifyInstance, FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';

export default async function organizationsRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  fastify.get(
    '/me',
    { schema: getOrgsForCurrentUserSchema },
    getOrgsForCurrentUserHandler
  );
}

async function getOrgsForCurrentUserHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const orgs = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId: session?.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      isPersonal: true,
    },
  });

  return response.status(200).send(orgs);
}
