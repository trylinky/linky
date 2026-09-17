import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { prices } from '@/lib/plans';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { subscription } from '@trylinky/db/schema';
import type { Context } from 'hono';

export async function upgradeToTeamHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const currentUser = await db.query.user.findFirst({
    where: (u, { eq }) => eq(u.id, session.user.id),
  });

  if (!currentUser) {
    return c.json({ error: 'User not found' }, 404);
  }

  const customer = await stripeClient.customers.create({
    name: 'new organization customer',
    email: currentUser.email ?? '',
    metadata: {
      dbUserId: currentUser.id,
    },
  });

  if (!customer) {
    throw Error('Error creating customer');
  }

  const personalOrg = await db.query.organization.findFirst({
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
                inArray(subscription.plan, ['premium', 'freeLegacy'])
              )
            )
        )
      ),
    columns: { id: true },
    with: {
      subscription: { columns: { id: true } },
    },
  });

  try {
    const upgradeSession = await stripeClient.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          quantity: 1,
          price:
            process.env.NODE_ENV === 'production'
              ? prices.production.team
              : prices.development.team,
        },
      ],
      allow_promotion_codes: true,
      subscription_data: {
        metadata: {
          createdByUserId: currentUser.id, // This user will be the owner of the new team org
          personalSubscriptionId: personalOrg?.subscription?.id ?? null,
        },
      },
      mode: 'subscription',
      success_url: `${process.env.APP_FRONTEND_URL}/edit?showTeamOnboarding=true`,
      cancel_url: `${process.env.APP_FRONTEND_URL}/edit?showBilling=true`,
    });

    return c.json({ url: upgradeSession.url }, 200);
  } catch (error) {
    console.log('Error', error);
    return c.json({ error: 'Failed to upgrade to team' }, 400);
  }
}
