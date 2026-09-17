import db from '@/lib/db';
import { sendTrialReminderEmail } from '@/modules/notifications/service';
import { getOrganizationMemberEmails } from '@/modules/organizations/utils';
import { sendSlackMessage } from '@/modules/slack/service';
import Stripe from 'stripe';

export async function handleTrialWillEnd(event: Stripe.Event) {
  if (event.type !== 'customer.subscription.trial_will_end') {
    return;
  }

  const stripeCustomerId = event.data.object.customer as string;

  const current = await db.query.subscription.findFirst({
    where: (s, { and, eq }) =>
      and(eq(s.stripeCustomerId, stripeCustomerId), eq(s.status, 'trialing')),
    columns: { id: true, referenceId: true },
  });

  if (!current) {
    return;
  }

  const emails = await getOrganizationMemberEmails(current.referenceId);

  emails.forEach(async (email) => {
    await sendTrialReminderEmail(email);
  });

  await sendSlackMessage({
    text: `Trial will end for ${current.referenceId} (Subscription: ${current.id})`,
  });

  return {
    success: true,
  };
}
