import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { prices } from '@/lib/plans';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { sendSubscriptionUpgradedPremiumEmail } from '@/modules/notifications/service';
import { subscription } from '@trylinky/db/schema';
import type { Context } from 'hono';
import safeAwait from 'safe-await';

export async function upgradeToPremiumHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const [currentUserError, currentUser] = await safeAwait(
    db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, session.user.id),
    })
  );

  if (currentUserError || !currentUser) {
    return c.json({ error: 'Failed to get current user' }, 400);
  }

  const [currentPersonalOrgError, currentPersonalOrg] = await safeAwait(
    db.query.organization.findFirst({
      where: (o, { and, eq, exists, inArray, sql }) =>
        and(
          eq(o.isPersonal, true),
          userIsMemberOfOrg(o.id, currentUser.id),
          exists(
            db
              .select({ one: sql`1` })
              .from(subscription)
              .where(
                and(
                  eq(subscription.referenceId, o.id),
                  inArray(subscription.plan, ['freeLegacy'])
                )
              )
          )
        ),
      columns: { id: true },
      with: {
        subscription: {
          columns: { id: true, stripeSubscriptionId: true },
        },
      },
    })
  );

  if (currentPersonalOrgError || !currentPersonalOrg?.subscription) {
    return c.json({ error: 'Failed to get current personal org' }, 400);
  }

  if (!currentPersonalOrg.subscription.stripeSubscriptionId) {
    return c.json({ error: 'No stripe subscription id found' }, 400);
  }

  try {
    const [updatedSubscriptionError] = await safeAwait(
      stripeClient.subscriptions.update(
        currentPersonalOrg.subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: currentPersonalOrg.subscription.id,
              price:
                process.env.NODE_ENV === 'production'
                  ? prices.production.premium
                  : prices.development.premium,
            },
          ],
        }
      )
    );

    if (updatedSubscriptionError) {
      return c.json({ error: 'Failed to upgrade to premium' }, 400);
    }

    if (currentUser.email) {
      await sendSubscriptionUpgradedPremiumEmail({
        email: currentUser.email,
      });
    }

    // The old Fastify response schema for 200 only listed a `url` property
    // (`additionalProperties: false`) but this handler has never actually
    // returned one — only `{ success: true }`. fast-json-stringify silently
    // drops properties that aren't in the schema, so every real caller has
    // always received `{}` here, not `{ success: true }`. Replicated exactly
    // rather than "fixed" — see the task-15 brief on response-shape leaks.
    return c.json({}, 200);
  } catch (error) {
    console.log('Error', error);
    return c.json({ error: 'Failed to upgrade to premium' }, 400);
  }
}
