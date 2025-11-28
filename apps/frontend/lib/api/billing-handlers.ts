import { prices, createNewSubscription } from '@/lib/api/billing';
import {
  sendSubscriptionDeletedEmail,
  sendSubscriptionUpgradedTeamEmail,
  sendTrialEndedEmail,
  sendTrialReminderEmail,
} from '@/lib/api/notifications';
import { createNewOrganization } from '@/lib/api/organizations';
import { sendSlackMessage } from '@/lib/api/slack';
import { prisma } from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { captureException, captureMessage } from '@sentry/nextjs';
import safeAwait from 'safe-await';
import Stripe from 'stripe';

export async function handleSubscriptionCreated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const lineItems = subscription.items.data;
  if (lineItems.length === 0) {
    captureMessage(
      `Subscription created but no line items found with Stripe Subscription ID: ${subscription.id}`
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

  let plan: 'premium' | 'team' | 'freeLegacy' | null = null;

  for (const [key, value] of Object.entries(allPrices)) {
    if (value === priceId) {
      plan = key as 'premium' | 'team' | 'freeLegacy';
      break;
    }
  }

  if (plan === 'team') {
    const createdByUserId = subscription.metadata?.createdByUserId;

    if (!createdByUserId) {
      captureMessage(
        `Team subscription created but no createdByUserId found in metadata for Stripe Subscription ID: ${subscription.id}`
      );
      return;
    }

    const newTeamOrg = await createNewOrganization({
      ownerId: createdByUserId,
      type: 'team',
    });

    await createNewSubscription({
      plan: 'team',
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      referenceId: newTeamOrg.id,
      periodStart: new Date(subscription.current_period_start * 1000),
      periodEnd: new Date(subscription.current_period_end * 1000),
    });

    await cancelOwnerPremiumSubscription(createdByUserId);

    const owner = await prisma.user.findUnique({
      where: { id: createdByUserId },
      select: { email: true },
    });

    if (owner?.email) {
      await sendSubscriptionUpgradedTeamEmail({ email: owner.email });
    }

    await sendSlackMessage({
      text: `Team subscription created for ${newTeamOrg.id} (Subscription: ${subscription.id})`,
    });

    return { success: true };
  }

  if (plan === 'freeLegacy') {
    await sendSlackMessage({
      text: `Free legacy subscription created for ${subscription.id}`,
    });
    return { success: true };
  }

  if (plan === 'premium') {
    await sendSlackMessage({
      text: `Premium subscription created for ${subscription.id}`,
    });
    return { success: true };
  }
}

const cancelOwnerPremiumSubscription = async (ownerId: string) => {
  const ownerSubscription = await prisma.subscription.findFirst({
    where: {
      status: { in: ['active', 'trialing'] },
      organization: {
        isPersonal: true,
        members: { some: { userId: ownerId, role: 'owner' } },
      },
    },
  });

  if (!ownerSubscription || !ownerSubscription.stripeSubscriptionId) {
    return;
  }

  const [cancelSubError] = await safeAwait(
    stripeClient.subscriptions.cancel(ownerSubscription.stripeSubscriptionId, {
      cancellation_details: { comment: 'LINKY_AUTO_UPGRADED_TO_TEAM' },
    })
  );

  if (cancelSubError) {
    captureMessage(
      `Error cancelling owner subscription ${ownerSubscription.stripeSubscriptionId}: ${cancelSubError}`
    );
  }
};

export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const [error, dbSubscription] = await safeAwait(
    prisma.subscription.findFirst({
      where: {
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
      },
      select: {
        id: true,
        organization: {
          select: {
            id: true,
            members: { select: { user: { select: { email: true } } } },
          },
        },
      },
    })
  );

  if (error) {
    captureException(error);
    return;
  }

  if (!dbSubscription) {
    captureMessage(
      `Subscription deleted but not found in database: ${subscription.id}`
    );
    return;
  }

  const [updateError] = await safeAwait(
    prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: { status: 'canceled', plan: 'freeLegacy', periodEnd: new Date() },
    })
  );

  if (updateError) {
    captureException(updateError);
  }

  if (
    subscription.cancellation_details?.comment !== 'LINKY_AUTO_UPGRADED_TO_TEAM'
  ) {
    const orgUsers = dbSubscription.organization?.members.map(
      (member) => member.user
    );

    if (orgUsers) {
      orgUsers.forEach(async (user) => {
        if (user.email) {
          await sendSubscriptionDeletedEmail(user.email);
        }
      });
    }
  }

  await sendSlackMessage({
    text: `Subscription deleted for ${dbSubscription.organization?.id} (Subscription: ${dbSubscription.id})`,
  });

  return { success: true };
}

export async function handleTrialExpired(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.updated') {
    return;
  }

  const [stripeError, stripeSubscription] = await safeAwait(
    stripeClient.subscriptions.retrieve(event.data.object.id)
  );

  if (stripeError || !stripeSubscription) {
    captureException(stripeError);
    return;
  }

  const [error, subscription] = await safeAwait(
    prisma.subscription.findFirst({
      where: {
        stripeCustomerId: stripeSubscription.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
      },
      select: {
        id: true,
        organization: {
          select: {
            id: true,
            members: { select: { user: { select: { email: true } } } },
          },
        },
      },
    })
  );

  if (error || !subscription) {
    captureException(error);
    return;
  }

  const orgUsers = subscription.organization?.members.map(
    (member) => member.user
  );

  if (orgUsers) {
    orgUsers.forEach(async (user) => {
      if (user.email) {
        await sendTrialEndedEmail(user.email);
      }
    });
  }

  await sendSlackMessage({
    text: `Trial expired for ${subscription.organization?.id} (Subscription: ${subscription.id})`,
  });

  return { success: true };
}

export async function handleTrialWillEnd(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.trial_will_end') {
    return;
  }

  const stripeCustomerId = event.data.object.customer as string;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId, status: 'trialing' },
    select: {
      id: true,
      organization: {
        select: {
          id: true,
          members: { select: { user: { select: { email: true } } } },
        },
      },
    },
  });

  if (!subscription) {
    return;
  }

  const users = subscription.organization?.members.map((member) => member.user);

  if (users) {
    users.forEach(async (user) => {
      if (user.email) {
        await sendTrialReminderEmail(user.email);
      }
    });
  }

  await sendSlackMessage({
    text: `Trial will end for ${subscription.organization?.id} (Subscription: ${subscription.id})`,
  });

  return { success: true };
}

export async function handleSubscriptionCancelled(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const dbSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!dbSubscription) {
    captureMessage(
      `Subscription cancelled but not found in database: ${subscription.id}`
    );
    return;
  }

  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: { cancelAtPeriodEnd: true },
  });

  return { success: true };
}
