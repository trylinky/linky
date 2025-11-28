'use strict';

import {
  getFlagsForCurrentUserHandler,
  getFlagsForCurrentUserSchema,
} from './handlers/flags-for-current-user';
import {
  hideOnboardingTourHandler,
  hideOnboardingTourSchema,
} from './handlers/hide-onboarding-tour';
import { FastifyInstance } from 'fastify';

export default async function flagsRoutes(fastify: FastifyInstance, opts: any) {
  fastify.get(
    '/me',
    { schema: getFlagsForCurrentUserSchema },
    getFlagsForCurrentUserHandler
  );
  fastify.post(
    '/hide-onboarding-tour',
    { schema: hideOnboardingTourSchema },
    hideOnboardingTourHandler
  );
}
