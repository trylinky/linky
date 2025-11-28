import { getAuthSession } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { captureException } from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      referenceId: session.activeOrganizationId,
      status: { in: ['active', 'trialing'] },
    },
  });

  if (
    !subscription ||
    !subscription.stripeCustomerId ||
    !subscription.stripeSubscriptionId
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const membership = await prisma.member.findFirst({
    where: {
      organizationId: session.activeOrganizationId,
      userId: session.user.id,
      role: { in: ['admin', 'owner'] },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const portalSession = await stripeClient.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/edit`,
      flow_data: {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: subscription.stripeSubscriptionId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      url: portalSession.url,
    });
  } catch (error) {
    console.log('Error', error);
    captureException(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
