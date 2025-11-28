'use strict';

import {
  getReactionsSchema,
  getReactionsHandler,
} from '@/modules/reactions/handlers/get-reactions';
import {
  postReactionsHandler,
  postReactionsSchema,
} from '@/modules/reactions/handlers/post-reactions';
import { FastifyInstance } from 'fastify';

export default async function reactionsRoutes(fastify: FastifyInstance) {
  fastify.get('/', { schema: getReactionsSchema }, getReactionsHandler);
  fastify.post('/', { schema: postReactionsSchema }, postReactionsHandler);
}
