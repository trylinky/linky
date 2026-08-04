import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { sendSubscriptionUpgradedPremiumEmail } from '@/modules/notifications/service';
import type { Context } from 'hono';
import safeAwait from 'safe-await';

export async function upgradeTrialHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const [currentUserError, currentUser] = await safeAwait(
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
      },
    })
  );

  if (currentUserError || !currentUser) {
    return c.json({ error: 'Failed to get current user' }, 400);
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: session.activeOrganizationId,
    },
  });

  if (!subscription || !subscription.stripeSubscriptionId) {
    return c.json({ error: 'No subscription found' }, 404);
  }

  if (subscription.status !== 'trialing') {
    return c.json({ error: 'Subscription is not currently trialing' }, 400);
  }

  try {
    const updatedSubscription = await stripeClient.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        trial_end: 'now',
      }
    );

    if (updatedSubscription.status === 'active') {
      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          status: 'active',
          trialStart: null,
          trialEnd: null,
        },
      });

      if (currentUser.email) {
        await sendSubscriptionUpgradedPremiumEmail({
          email: currentUser.email,
        });
      }

      return c.json({ success: true }, 200);
    }

    // The original Fastify handler had no return here at all: if the
    // subscription didn't come back `active`, the async handler resolved to
    // `undefined`, which was then serialised against the 200 response
    // schema (`{ success: boolean }`) — fast-json-stringify throws reading a
    // property off `undefined`, so this path actually 500'd on every real
    // occurrence rather than silently succeeding. An explicit 400 is
    // strictly better than reproducing that crash.
    return c.json({ error: 'Failed to upgrade trial' }, 400);
  } catch (error) {
    console.log('Error', error);
    return c.json({ error: 'Failed to upgrade trial' }, 400);
  }
}
