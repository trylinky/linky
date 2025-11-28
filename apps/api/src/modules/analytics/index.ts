'use strict';

import {
  getPageAnalyticsHandler,
  getPageAnalyticsSchema,
} from '@/modules/analytics/handlers/analytics-for-page';
import { FastifyInstance } from 'fastify';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/pages/:pageId',
    { schema: getPageAnalyticsSchema },
    getPageAnalyticsHandler
  );
}
