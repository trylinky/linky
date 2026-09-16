import type { AppBindings } from '@/env';
import { getBillingPortalUrlHandler } from '@/modules/billing/handlers/billing-portal-url';
import { cancelSubscriptionHandler } from '@/modules/billing/handlers/cancel-subscription';
import { getCurrentUserSubscriptionHandler } from '@/modules/billing/handlers/current-user-subscription';
import { stripeWebhookHandler } from '@/modules/billing/handlers/stripe';
import { getUpgradeEligibilityHandler } from '@/modules/billing/handlers/upgrade-eligibility';
import { upgradeToPremiumHandler } from '@/modules/billing/handlers/upgrade-to-premium';
import { upgradeToTeamHandler } from '@/modules/billing/handlers/upgrade-to-team';
import { upgradeTrialHandler } from '@/modules/billing/handlers/upgrade-trial';
import { Hono } from 'hono';

const billingRoutes = new Hono<AppBindings>();

billingRoutes.post('/stripe-webhook', stripeWebhookHandler);

billingRoutes.get('/subscription/me', getCurrentUserSubscriptionHandler);

billingRoutes.get('/upgrade-eligibility', getUpgradeEligibilityHandler);

billingRoutes.post('/get-billing-portal-url', getBillingPortalUrlHandler);

billingRoutes.post('/cancel-subscription', cancelSubscriptionHandler);

billingRoutes.post('/upgrade-trial', upgradeTrialHandler);

billingRoutes.post('/upgrade/team', upgradeToTeamHandler);

billingRoutes.post('/upgrade/premium', upgradeToPremiumHandler);

export default billingRoutes;
