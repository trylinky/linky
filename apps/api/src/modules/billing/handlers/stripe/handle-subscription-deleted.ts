import { createPosthogClient } from '@/lib/posthog';
import {
  isUnconvertedTrial,
  syncSubscriptionFromStripe,
} from '@/modules/billing/utils/sync-subscription';
import {
  sendSubscriptionDeletedEmail,
  sendTrialEndedEmail,
} from '@/modules/notifications/service';
import { getOrganizationMemberEmails } from '@/modules/organizations/utils';
import { sendSlackMessage } from '@/modules/slack/service';
import { captureMessage } from '@sentry/cloudflare';
import Stripe from 'stripe';

/**
 * The single downgrade path. Fires when Stripe deletes a subscription:
 * a card-less trial reaching its end (trial_settings.end_behavior =
 * cancel), a customer cancelling, or dunning giving up.
 */
export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const stripeSubscription = event.data.object as Stripe.Subscription;

  // The owner just bought Team; their personal org is cancelled as part of
  // the upgrade and must not lose its badge, requests or see the Free notice.
  const autoUpgradedToTeam =
    stripeSubscription.cancellation_details?.comment ===
    'LINKY_AUTO_UPGRADED_TO_TEAM';

  const result = await syncSubscriptionFromStripe(stripeSubscription, {
    skipDowngradeSideEffects: autoUpgradedToTeam,
  });

  if (!result) {
    captureMessage(
      `Subscription deleted but not found in database: ${stripeSubscription.id}`
    );
    return;
  }

  if (!autoUpgradedToTeam) {
    const unconverted = isUnconvertedTrial(stripeSubscription);
    const emails = await getOrganizationMemberEmails(result.organizationId);

    for (const email of emails) {
      if (unconverted) {
        await sendTrialEndedEmail(email);
      } else {
        await sendSubscriptionDeletedEmail(email);
      }
    }

    if (unconverted) {
      const posthog = createPosthogClient();
      posthog?.capture({
        distinctId: result.organizationId,
        event: 'trial-ended-unconverted',
        properties: { organizationId: result.organizationId },
      });
      if (posthog) void posthog.shutdown();
    }
  }

  await sendSlackMessage({
    text: `Subscription deleted for ${result.organizationId} (Stripe: ${stripeSubscription.id})`,
  });

  return { success: true };
}
