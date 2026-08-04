import type { AppBindings } from '@/env';
import {
  getReactionsHandler,
  getReactionsQuerySchema,
} from '@/modules/reactions/handlers/get-reactions';
import {
  postReactionsBodySchema,
  postReactionsHandler,
} from '@/modules/reactions/handlers/post-reactions';
import { tbValidator } from '@hono/typebox-validator';
import { Hono } from 'hono';

const reactionsRoutes = new Hono<AppBindings>();

reactionsRoutes.get(
  '/',
  tbValidator('query', getReactionsQuerySchema),
  getReactionsHandler
);
reactionsRoutes.post(
  '/',
  tbValidator('json', postReactionsBodySchema),
  postReactionsHandler
);

export default reactionsRoutes;
