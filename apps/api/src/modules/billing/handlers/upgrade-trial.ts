import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { sendSubscriptionUpgradedPremiumEmail } from '@/modules/notifications/service';
import { subscription } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import safeAwait from 'safe-await';

export async function upgradeTrialHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const [currentUserError, currentUser] = await safeAwait(
    db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, session.user.id),
      columns: { email: true },
    })
  );

  if (currentUserError || !currentUser) {
    return c.json({ error: 'Failed to get current user' }, 400);
  }

  const current = await db.query.subscription.findFirst({
    where: (s, { eq }) => eq(s.referenceId, session.activeOrganizationId),
  });

  if (!current || !current.stripeSubscriptionId) {
    return c.json({ error: 'No subscription found' }, 404);
  }

  if (current.status !== 'trialing') {
    return c.json({ error: 'Subscription is not currently trialing' }, 400);
  }

  try {
    const updatedSubscription = await stripeClient.subscriptions.update(
      current.stripeSubscriptionId,
      {
        trial_end: 'now',
      }
    );

    if (updatedSubscription.status === 'active') {
      await db
        .update(subscription)
        .set({
          status: 'active',
          trialStart: null,
          trialEnd: null,
        })
        .where(eq(subscription.id, current.id));

      if (currentUser.email) {
        await sendSubscriptionUpgradedPremiumEmail({
          email: currentUser.email,
        });
      }

      return c.json({ success: true }, 200);
    }

    // The original Fastify handler had no return here at all: if the
    // subscription didn't come back `active`, the async handler resolved to
    // `undefined`. Fastify's reply.send(undefined) short-circuits straight to
    // the onSend hooks without ever running the response serializer, so this
    // was a silent 200 with an empty body (content-length: 0), not a crash.
    // The one caller (packages/common/src/billing/pricing-table.tsx) reads
    // this through InternalApi.post and treats anything that isn't an
    // explicit success as a failure, so an explicit 400 with an error body
    // collapses to the same user-visible outcome as the old empty 200 did —
    // this is a deliberate behavior change, not a faithful port.
    return c.json({ error: 'Failed to upgrade trial' }, 400);
  } catch (error) {
    console.log('Error', error);
    return c.json({ error: 'Failed to upgrade trial' }, 400);
  }
}
