import type { AppBindings } from '@/env';
import { getPageAnalyticsHandler } from '@/modules/analytics/handlers/analytics-for-page';
import { Hono } from 'hono';

const analyticsRoutes = new Hono<AppBindings>();

analyticsRoutes.get('/pages/:pageId', getPageAnalyticsHandler);

export default analyticsRoutes;
