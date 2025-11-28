import prisma from '@/lib/prisma';
import { sendTrialReminderEmail } from '@/modules/notifications/service';
import { sendSlackMessage } from '@/modules/slack/service';
import Stripe from 'stripe';

export async function handleTrialWillEnd(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.trial_will_end') {
    return;
  }

  const stripeCustomerId = event.data.object.customer as string;

  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeCustomerId: stripeCustomerId,
      status: 'trialing',
    },
    select: {
      id: true,
      organization: {
        select: {
          id: true,
          members: {
            select: {
              user: {
                select: {
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!subscription) {
    return;
  }

  const users = subscription.organization?.members.map((member) => member.user);

  if (!users) {
    return;
  }

  users.forEach(async (user) => {
    if (user.email) {
      await sendTrialReminderEmail(user.email);
    }
  });

  await sendSlackMessage({
    text: `Trial will end for ${subscription.organization?.id} (Subscription: ${subscription.id})`,
  });

  return {
    success: true,
  };
}
