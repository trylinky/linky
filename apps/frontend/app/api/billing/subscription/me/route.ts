import { getAuthSession } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const usersOrganizations = await prisma.organization.findMany({
    where: {
      members: { some: { userId: session.user.id } },
      subscription: { status: { in: ['active', 'trialing'] } },
    },
    select: {
      isPersonal: true,
      id: true,
      subscription: true,
    },
  });

  const currentOrganization = usersOrganizations.find(
    (org) => org.id === session.activeOrganizationId
  );

  if (currentOrganization?.subscription?.plan === 'team') {
    return NextResponse.json({
      plan: 'team',
      status: 'active',
      periodEnd: currentOrganization.subscription.cancelAtPeriodEnd
        ? currentOrganization.subscription.periodEnd
        : null,
    });
  }

  const teamOrgs = usersOrganizations.filter(
    (org) => org.subscription?.plan === 'team'
  );

  if (teamOrgs.length > 0) {
    return NextResponse.json({
      plan: 'premium',
      status: 'active',
      isTeamPremium: true,
    });
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
    return NextResponse.json({
      plan: 'premium',
      status: premiumOrg.subscription?.status,
      isTeamPremium: false,
      trialDaysLeft: daysLeftOnTrial,
      periodEnd: premiumOrg.subscription?.cancelAtPeriodEnd
        ? premiumOrg.subscription?.periodEnd
        : null,
    });
  }

  const freeLegacyOrgs = usersOrganizations.filter(
    (org) => org.subscription?.plan === 'freeLegacy'
  );

  if (freeLegacyOrgs.length > 0) {
    return NextResponse.json({
      plan: 'freeLegacy',
      status: 'active',
      isTeamPremium: false,
    });
  }

  return NextResponse.json({
    plan: 'freeLegacy',
    status: 'inactive',
    isTeamPremium: false,
  });
}
