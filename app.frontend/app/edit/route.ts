import { getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const showTeamOnboarding = searchParams.get('showTeamOnboarding');
  const showPremiumOnboarding = searchParams.get('showPremiumOnboarding');

  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!user || !sessionData?.activeOrganizationId) {
    return redirect('/');
  }

  const pages = await prisma.page.findMany({
    where: {
      organizationId: sessionData?.activeOrganizationId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      slug: true,
    },
    take: 1,
  });

  if (!pages || pages.length === 0) {
    return redirect('/new?freshOnboarding=true');
  }

  const params = new URLSearchParams();
  if (showTeamOnboarding) params.set('showTeamOnboarding', 'true');
  if (showPremiumOnboarding) params.set('showPremiumOnboarding', 'true');

  const queryString = params.toString();
  return redirect(`/${pages[0].slug}${queryString ? `?${queryString}` : ''}`);
}
