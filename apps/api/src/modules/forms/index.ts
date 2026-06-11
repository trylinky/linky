'use strict';

import { getIpAddress } from '@/modules/analytics/utils';
import {
  checkUserHasAccessToPage,
  deleteSubmissionById,
  getFormGroupsForPage,
  listSubmissions,
  submitFormResponse,
} from './service';
import { Type } from '@fastify/type-provider-typebox';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const postSubmissionSchema = {
  body: Type.Object({
    // Answer values are deliberately untyped here: Fastify's AJV runs with
    // coerceTypes, and a string|boolean union coerces booleans through the
    // string branch (true -> "true"), which broke checkbox answers. Per-field
    // type and length validation happens in validateAnswers; overall payload
    // size is capped by maxProperties and the route's bodyLimit.
    answers: Type.Record(Type.String({ maxLength: 64 }), Type.Unknown(), {
      maxProperties: 10,
    }),
    website: Type.Optional(Type.String({ maxLength: 200 })),
  }),
};

export default async function formsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/:blockId/submissions',
    { schema: postSubmissionSchema, bodyLimit: 65536 },
    postSubmissionHandler
  );
  fastify.get('/page/:pageId', getFormGroupsHandler);
  fastify.get('/page/:pageId/submissions', listSubmissionsHandler);
  fastify.delete('/submissions/:submissionId', deleteSubmissionHandler);
}

// Public endpoint: visitors submit form responses. No auth — the service
// gates on published page + honeypot + per-IP rate limit.
async function postSubmissionHandler(
  request: FastifyRequest<{
    Params: { blockId: string };
    Body: { answers: Record<string, unknown>; website?: string };
  }>,
  response: FastifyReply
) {
  const { blockId } = request.params;
  const { answers, website } = request.body;

  const ipAddress = getIpAddress(request);

  try {
    const result = await submitFormResponse({
      blockId,
      answers,
      honeypot: website ?? '',
      ipAddress,
    });

    switch (result.status) {
      case 'ok':
        return response.status(200).send({ success: true });
      case 'not-found':
        return response
          .status(404)
          .send({ error: { message: 'Form not found' } });
      case 'rate-limited':
        return response.status(429).send({
          error: { message: 'Too many submissions. Please try again later.' },
        });
      case 'invalid':
        return response.status(400).send({
          error: { message: 'Validation failed', fields: result.errors },
        });
    }
  } catch (error) {
    return response.status(500).send({
      error: { message: 'Sorry, there was an error submitting the form' },
    });
  }
}

async function getFormGroupsHandler(
  request: FastifyRequest<{ Params: { pageId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  if (!session?.user) {
    return response.status(401).send({ error: { message: 'Unauthorized' } });
  }

  const { pageId } = request.params;

  const hasAccess = await checkUserHasAccessToPage(pageId, session.user.id);
  if (!hasAccess) {
    return response.status(404).send({ error: { message: 'Page not found' } });
  }

  const groups = await getFormGroupsForPage(pageId);

  return response.status(200).send({ groups });
}

async function listSubmissionsHandler(
  request: FastifyRequest<{
    Params: { pageId: string };
    Querystring: { blockId?: string; cursor?: string };
  }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  if (!session?.user) {
    return response.status(401).send({ error: { message: 'Unauthorized' } });
  }

  const { pageId } = request.params;
  const { blockId, cursor } = request.query;

  if (!blockId) {
    return response
      .status(400)
      .send({ error: { message: 'blockId is required' } });
  }

  if (cursor && !UUID_REGEX.test(cursor)) {
    return response
      .status(400)
      .send({ error: { message: 'Invalid cursor' } });
  }

  const hasAccess = await checkUserHasAccessToPage(pageId, session.user.id);
  if (!hasAccess) {
    return response.status(404).send({ error: { message: 'Page not found' } });
  }

  const result = await listSubmissions(pageId, blockId, cursor);

  return response.status(200).send(result);
}

async function deleteSubmissionHandler(
  request: FastifyRequest<{ Params: { submissionId: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  if (!session?.user) {
    return response.status(401).send({ error: { message: 'Unauthorized' } });
  }

  const deleted = await deleteSubmissionById(
    request.params.submissionId,
    session.user.id
  );

  if (!deleted) {
    return response
      .status(404)
      .send({ error: { message: 'Submission not found' } });
  }

  return response.status(200).send({ success: true });
}
