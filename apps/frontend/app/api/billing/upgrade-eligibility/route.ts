import { getAuthSession } from '@/lib/api/auth';
import { prisma } from '@/lib/prisma';
import { stripeClient } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function GET() {
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
      {
        canUpgrade: false,
        nextPlan: null,
        message: 'No subscription found',
      },
      { status: 404 }
    );
  }

  if (
    [
      'incomplete',
      'incomplete_expired',
      'past_due',
      'canceled',
      'unpaid',
    ].includes(subscription.status)
  ) {
    return NextResponse.json({
      canUpgrade: false,
      nextPlan: null,
      message: 'Subscription is in a failed state',
      nextStep: 'createSubscription',
      currentPlan: subscription.plan,
    });
  }

  if (subscription.plan === 'team') {
    return NextResponse.json({
      canUpgrade: false,
      nextPlan: null,
      message: 'Team plan cannot be upgraded',
      nextStep: null,
      currentPlan: subscription.plan,
    });
  }

  if (['premium', 'freeLegacy'].includes(subscription.plan)) {
    const customer = await stripeClient.customers.retrieve(
      subscription.stripeCustomerId
    );

    if (
      !customer.deleted &&
      !customer.invoice_settings.default_payment_method
    ) {
      return NextResponse.json({
        canUpgrade: false,
        nextStep: 'addPaymentMethod',
        currentPlan: subscription.plan,
      });
    }

    return NextResponse.json({
      nextStep: 'completeTrial',
      currentPlan: subscription.plan,
    });
  }

  return NextResponse.json({
    canUpgrade: false,
    nextPlan: null,
    nextStep: null,
    currentPlan: subscription.plan,
  });
}
