import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { prices } from '@/lib/plans';
import { createPosthogClient } from '@/lib/posthog';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { resolveTier } from '@/modules/billing/entitlements';
import { captureException } from '@sentry/cloudflare';
import type { Context } from 'hono';

/**
 * Free → Premium. The old implementation tried to swap the price on the
 * existing Stripe subscription with the *database* subscription id as the
 * item id, which Stripe rejects, and cancelled trials no longer have a live
 * Stripe subscription anyway. A Checkout Session creates a fresh one; the
 * customer.subscription.created webhook mirrors it into the row.
 */
export async function upgradeToPremiumHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const current = await db.query.subscription.findFirst({
    where: (s, { eq }) => eq(s.referenceId, session.activeOrganizationId),
  });

  if (!current) {
    return c.json(
      { error: 'No subscription found for this organisation' },
      404
    );
  }

  if (resolveTier(current) !== 'free') {
    return c.json({ error: 'This organisation already has a paid plan' }, 400);
  }

  const env =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const frontend = process.env.APP_FRONTEND_URL;

  try {
    const checkout = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: current.stripeCustomerId,
      line_items: [{ price: prices[env].premium, quantity: 1 }],
      subscription_data: {
        metadata: { organizationId: session.activeOrganizationId },
      },
      allow_promotion_codes: true,
      // /edit forwards its query string to the editor, where
      // PremiumOnboardingDialog reads showPremiumOnboarding.
      success_url: `${frontend}/edit?showPremiumOnboarding=true`,
      cancel_url: `${frontend}/edit?showBilling=true`,
    });

    if (!checkout.url) {
      return c.json({ error: 'Failed to start checkout' }, 400);
    }

    const posthog = createPosthogClient();
    posthog?.capture({
      distinctId: session.user.id,
      event: 'checkout-started',
      properties: {
        organizationId: session.activeOrganizationId,
        fromTier: 'free',
      },
    });
    if (posthog) {
      try {
        c.executionCtx.waitUntil(posthog.shutdown());
      } catch {
        void posthog.shutdown();
      }
    }

    return c.json({ url: checkout.url }, 200);
  } catch (error) {
    captureException(error);
    return c.json({ error: 'Failed to start checkout' }, 400);
  }
}
