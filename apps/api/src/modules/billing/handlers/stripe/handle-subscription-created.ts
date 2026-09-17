import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { prices } from '@/lib/plans';
import { stripeClient } from '@/lib/stripe';
import { createNewSubscription } from '@/modules/billing/utils/create-new-subscription';
import { sendSubscriptionUpgradedTeamEmail } from '@/modules/notifications/service';
import { createNewOrganization } from '@/modules/organizations/utils';
import { sendSlackMessage } from '@/modules/slack/service';
import { captureMessage } from '@sentry/cloudflare';
import { organization } from '@trylinky/db/schema';
import safeAwait from 'safe-await';
import Stripe from 'stripe';

/**
 * Handle subscription created events
 */
export async function handleSubscriptionCreated(event: Stripe.Event) {
  const stripeSubscription = event.data.object as Stripe.Subscription;

  const lineItems = stripeSubscription.items.data;
  if (lineItems.length === 0) {
    captureMessage(
      `Subscription created but no line items found with Stripe Subscription ID: ${stripeSubscription.id}`
    );
    return;
  }

  const lineItem = lineItems[0];
  const priceId = lineItem.price.id;

  const env = (process.env.NODE_ENV ?? 'development') as
    | 'production'
    | 'development';

  const allPrices =
    env === 'development' ? prices.development : prices.production;

  // Determine the plan based on the price ID
  let plan: 'premium' | 'team' | 'freeLegacy' | null = null;

  for (const [key, value] of Object.entries(allPrices)) {
    if (value === priceId) {
      plan = key as 'premium' | 'team' | 'freeLegacy';
      break;
    }
  }

  // Handle team plan creation separately
  if (plan === 'team') {
    const createdByUserId = stripeSubscription.metadata?.createdByUserId;

    if (!createdByUserId) {
      captureMessage(
        `Team subscription created but no createdByUserId found in metadata for Stripe Subscription ID: ${stripeSubscription.id}`
      );

      return;
    }

    // Create new team organization
    const newTeamOrg = await createNewOrganization({
      ownerId: createdByUserId,
      type: 'team',
    });

    await createNewSubscription({
      plan: 'team',
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      referenceId: newTeamOrg.id,
      periodStart: new Date(stripeSubscription.current_period_start * 1000),
      periodEnd: new Date(stripeSubscription.current_period_end * 1000),
    });

    await cancelOwnerPremiumSubscription(createdByUserId);

    const owner = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, createdByUserId),
      columns: { email: true },
    });

    if (owner?.email) {
      await sendSubscriptionUpgradedTeamEmail({
        email: owner.email,
      });
    }

    await sendSlackMessage({
      text: `Team subscription created for ${newTeamOrg.id} (Subscription: ${stripeSubscription.id})`,
    });

    return {
      success: true,
    };
  }

  if (plan === 'freeLegacy') {
    // Nothing to do here

    await sendSlackMessage({
      text: `Free legacy subscription created for ${stripeSubscription.id}`,
    });

    return {
      success: true,
    };
  }

  if (plan === 'premium') {
    // Nothing to do here

    await sendSlackMessage({
      text: `Premium subscription created for ${stripeSubscription.id}`,
    });

    return {
      success: true,
    };
  }
}

const cancelOwnerPremiumSubscription = async (ownerId: string) => {
  const ownerSubscription = await db.query.subscription.findFirst({
    where: (s, { and, eq, exists, inArray, sql }) =>
      and(
        inArray(s.status, ['active', 'trialing']),
        exists(
          db
            .select({ one: sql`1` })
            .from(organization)
            .where(
              and(
                eq(organization.id, s.referenceId),
                eq(organization.isPersonal, true),
                userIsMemberOfOrg(organization.id, ownerId, 'owner')
              )
            )
        )
      ),
  });

  if (!ownerSubscription || !ownerSubscription.stripeSubscriptionId) {
    return;
  }

  const [cancelSubError] = await safeAwait(
    stripeClient.subscriptions.cancel(ownerSubscription.stripeSubscriptionId, {
      cancellation_details: {
        comment: 'LINKY_AUTO_UPGRADED_TO_TEAM',
      },
    })
  );

  if (cancelSubError) {
    captureMessage(
      `Error cancelling owner subscription ${ownerSubscription.stripeSubscriptionId}: ${cancelSubError}`
    );
  }
};
