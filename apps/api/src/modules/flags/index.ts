import type { AppBindings } from '@/env';
import { getFlagsForCurrentUserHandler } from '@/modules/flags/handlers/flags-for-current-user';
import { hideFreeDowngradeNoticeHandler } from '@/modules/flags/handlers/hide-free-downgrade-notice';
import { hideOnboardingTourHandler } from '@/modules/flags/handlers/hide-onboarding-tour';
import { Hono } from 'hono';

const flagsRoutes = new Hono<AppBindings>();

flagsRoutes.get('/me', getFlagsForCurrentUserHandler);
flagsRoutes.post('/hide-onboarding-tour', hideOnboardingTourHandler);
flagsRoutes.post('/hide-free-downgrade-notice', hideFreeDowngradeNoticeHandler);

export default flagsRoutes;
