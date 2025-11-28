'use strict';

import prisma from '@/lib/prisma';
import {
  orchestratorCreateSchema,
  orchestratorValidateSchema,
  tikTokOrchestratorSchema,
} from '@/modules/orchestrators/schemas';
import { orchestrateTikTok } from '@/modules/orchestrators/tiktok';
import { FastifyInstance, FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';

export default async function orchestratorsRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  fastify.post(
    '/create',
    { schema: orchestratorCreateSchema },
    createOrchestratorHandler
  );
  fastify.post(
    '/validate',
    { schema: orchestratorValidateSchema },
    validateOrchestratorHandler
  );
  fastify.post(
    '/tiktok/create',
    { schema: tikTokOrchestratorSchema },
    tikTokOrchestratorHandler
  );
}

async function createOrchestratorHandler(
  request: FastifyRequest<{
    Body: {
      type: 'TIKTOK';
    };
  }>,
  response: FastifyReply
) {
  await request.server.authenticateApiKey(request, response);

  const { type } = request.body;

  const newOrchestrator = await prisma.orchestration.create({
    data: {
      expiresAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      type,
    },
    select: {
      id: true,
    },
  });

  return response.status(200).send({
    id: newOrchestrator.id,
  });
}

async function validateOrchestratorHandler(
  request: FastifyRequest<{
    Body: {
      orchestrationId: string;
      type: 'TIKTOK';
    };
  }>,
  response: FastifyReply
) {
  await request.server.authenticateApiKey(request, response);

  const { type, orchestrationId } = request.body;

  const orchestration = await prisma.orchestration.findUnique({
    where: {
      id: orchestrationId,
      type: type,
      pageGeneratedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!orchestration) {
    return response.status(400).send({
      error: 'Orchestration not found',
    });
  }

  return response.status(200).send({
    valid: true,
  });
}

async function tikTokOrchestratorHandler(
  request: FastifyRequest<{
    Body: {
      orchestrationId: string;
    };
  }>,
  response: FastifyReply
) {
  await request.server.authenticateApiKey(request, response);

  const session = await request.server.authenticate(request, response);

  const { orchestrationId } = request.body;

  const { error, data } = await orchestrateTikTok({
    orchestrationId,
    organizationId: session.activeOrganizationId,
    userId: session.user.id,
  });

  if (error) {
    return response.status(400).send({
      error,
    });
  }

  return response.status(200).send({
    pageSlug: data?.pageSlug,
  });
}
