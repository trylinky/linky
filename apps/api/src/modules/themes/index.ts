'use strict';

import { getThemesForOrganization } from '@/modules/themes/service';
import { FastifyInstance, FastifyReply } from 'fastify';
import { FastifyRequest } from 'fastify';

export default async function themesRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  fastify.get('/me/team', getThemesForCurrentTeamHandler);
}

async function getThemesForCurrentTeamHandler(
  request: FastifyRequest,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const themes = await getThemesForOrganization(session.activeOrganizationId);

  return response.status(200).send(themes);
}
