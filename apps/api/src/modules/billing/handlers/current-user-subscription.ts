import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { requireSession } from '@/middleware/authenticate';
import { subscription } from '@trylinky/db/schema';
import type { Context } from 'hono';

export async function getCurrentUserSubscriptionHandler(
  c: Context<AppBindings>
) {
  const session = requireSession(c);

  const usersOrganizations = await db.query.organization.findMany({
    where: (o, { and, eq, exists, inArray, sql }) =>
      and(
        userIsMemberOfOrg(o.id, session.user.id),
        exists(
          db
            .select({ one: sql`1` })
            .from(subscription)
            .where(
              and(
                eq(subscription.referenceId, o.id),
                inArray(subscription.status, ['active', 'trialing'])
              )
            )
        )
      ),
    columns: {
      isPersonal: true,
      id: true,
    },
    with: { subscription: true },
  });

  const currentOrganization = usersOrganizations.find(
    (org) => org.id === session.activeOrganizationId
  );

  if (currentOrganization?.subscription?.plan === 'team') {
    return c.json(
      {
        plan: 'team',
        status: 'active',
        periodEnd: currentOrganization.subscription.cancelAtPeriodEnd
          ? currentOrganization.subscription.periodEnd
          : null,
      },
      200
    );
  }

  const teamOrgs = usersOrganizations.filter(
    (org) => org.subscription?.plan === 'team'
  );

  if (teamOrgs.length > 0) {
    return c.json(
      {
        plan: 'premium',
        status: 'active',
        isTeamPremium: true,
      },
      200
    );
  }

  const premiumOrgs = usersOrganizations.filter(
    (org) => org.subscription?.plan === 'premium' && org.isPersonal
  );

  const premiumOrg = premiumOrgs[0];

  const daysLeftOnTrial =
    premiumOrg?.subscription?.status === 'trialing' &&
    premiumOrg.subscription.trialEnd
      ? Math.ceil(
          (new Date(premiumOrg.subscription.trialEnd).getTime() -
            new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

  if (premiumOrg) {
    return c.json(
      {
        plan: 'premium',
        status: premiumOrg.subscription?.status,
        isTeamPremium: false,
        trialDaysLeft: daysLeftOnTrial,
        periodEnd: premiumOrg.subscription?.cancelAtPeriodEnd
          ? premiumOrg.subscription?.periodEnd
          : null,
      },
      200
    );
  }

  const freeLegacyOrgs = usersOrganizations.filter(
    (org) => org.subscription?.plan === 'freeLegacy'
  );

  if (freeLegacyOrgs.length > 0) {
    return c.json(
      {
        plan: 'freeLegacy',
        status: 'active',
        isTeamPremium: false,
      },
      200
    );
  }

  return c.json(
    {
      plan: 'freeLegacy',
      status: 'inactive',
      isTeamPremium: false,
    },
    200
  );
}
