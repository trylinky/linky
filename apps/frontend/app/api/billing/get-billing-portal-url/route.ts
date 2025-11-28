import { getAuthSession } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: session.activeOrganizationId,
    },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: 'No subscription found' },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { redirectTo } = body;

  const customer = await stripeClient.customers.retrieve(
    subscription.stripeCustomerId
  );

  const billingPortalUrl = await stripeClient.billingPortal.sessions.create({
    customer: customer.id,
    return_url: redirectTo,
  });

  return NextResponse.json({
    url: billingPortalUrl.url,
  });
}
