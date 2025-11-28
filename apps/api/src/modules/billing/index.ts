'use strict';

import {
  getBillingPortalUrlHandler,
  getBillingPortalUrlSchema,
} from './handlers/billing-portal-url';
import {
  cancelSubscriptionHandler,
  cancelSubscriptionSchema,
} from './handlers/cancel-subscription';
import {
  getCurrentUserSubscriptionHandler,
  getCurrentUserSubscriptionSchema,
} from './handlers/current-user-subscription';
import { stripeWebhookHandler } from './handlers/stripe';
import {
  getUpgradeEligibilitySchema,
  getUpgradeEligibilityHandler,
} from './handlers/upgrade-eligibility';
import {
  upgradeToPremiumHandler,
  upgradeToPremiumSchema,
} from './handlers/upgrade-to-premium';
import {
  upgradeToTeamHandler,
  upgradeToTeamSchema,
} from './handlers/upgrade-to-team';
import {
  upgradeTrialHandler,
  upgradeTrialSchema,
} from './handlers/upgrade-trial';
import { FastifyInstance } from 'fastify';

export default async function billingRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  fastify.post(
    '/stripe-webhook',
    { config: { rawBody: true } },
    stripeWebhookHandler
  );
  fastify.get(
    '/subscription/me',
    {
      schema: getCurrentUserSubscriptionSchema,
    },
    getCurrentUserSubscriptionHandler
  );
  fastify.get(
    '/upgrade-eligibility',
    { schema: getUpgradeEligibilitySchema },
    getUpgradeEligibilityHandler
  );

  fastify.post(
    '/get-billing-portal-url',
    { schema: getBillingPortalUrlSchema },
    getBillingPortalUrlHandler
  );

  fastify.post(
    '/cancel-subscription',
    { schema: cancelSubscriptionSchema },
    cancelSubscriptionHandler
  );

  fastify.post(
    '/upgrade-trial',
    { schema: upgradeTrialSchema },
    upgradeTrialHandler
  );

  fastify.post(
    '/upgrade/team',
    { schema: upgradeToTeamSchema },
    upgradeToTeamHandler
  );

  fastify.post(
    '/upgrade/premium',
    { schema: upgradeToPremiumSchema },
    upgradeToPremiumHandler
  );
}
