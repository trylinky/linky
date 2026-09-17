import type { AppBindings } from '@/env';
import { createPosthogClient } from '@/lib/posthog';
import {
  UPGRADE_REQUIRED,
  type PaywallFeature,
  type Tier,
  type UpgradeRequiredError,
} from '@trylinky/common/billing';
import type { Context } from 'hono';

const COPY: Record<PaywallFeature, { message: string; label: string }> = {
  pages: {
    message: 'Free includes one page',
    label: 'Upgrade to Premium for unlimited pages',
  },
  blocks: {
    message: "You've used your 5 free blocks",
    label: 'Upgrade to Premium to add more blocks',
  },
  analytics: {
    message: "See who's visiting",
    label: 'Upgrade to Premium to unlock analytics',
  },
  privatePages: {
    message: 'Keep pages private with Premium',
    label: 'Upgrade to Premium to unpublish pages',
  },
  verification: {
    message: 'Get verified',
    label: 'Upgrade to Premium to request a verified badge',
  },
  customDomain: {
    message: 'Use your own domain',
    label: 'Upgrade to Premium to connect a custom domain',
  },
};

/**
 * The single 402 every plan gate returns. The frontend's InternalApi client
 * routes this code to the UpgradeDialog, so handlers never need bespoke UI.
 */
export function upgradeRequired(
  c: Context<AppBindings>,
  feature: PaywallFeature,
  opts: { organizationId?: string; userId?: string; tier?: Tier } = {}
) {
  const error: UpgradeRequiredError = {
    code: UPGRADE_REQUIRED,
    feature,
    ...COPY[feature],
  };

  if (opts.userId) {
    const posthog = createPosthogClient();
    posthog?.capture({
      distinctId: opts.userId,
      event: 'paywall-hit',
      properties: {
        feature,
        tier: opts.tier ?? 'free',
        organizationId: opts.organizationId,
      },
    });
    if (posthog) {
      // `c.executionCtx` throws outside a Workers runtime (app.request in
      // tests); fall back to a plain fire-and-forget flush there.
      try {
        c.executionCtx.waitUntil(posthog.shutdown());
      } catch {
        void posthog.shutdown();
      }
    }
  }

  return c.json({ error }, 402);
}
