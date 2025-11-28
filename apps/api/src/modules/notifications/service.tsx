import { validateEmail } from '@/lib/email';
import { createResendClient } from '@/lib/resend';
import { captureException } from '@sentry/node';
import {
  MagicLinkEmail,
  OrganizationInviteEmail,
  SubscriptionCancelledEmail,
  SubscriptionUpgradedEmail,
  TrialEndingSoonEmail,
  TrialFinishedEmail,
  TrialFinishedEmailText,
  WelcomeEmail,
} from '@trylinky/notifications';
import React from 'react';

export async function sendEmail({
  email,
  subject,
  from = 'Linky <team@notifications.lin.ky>',
  react,
  text,
  replyTo = 'team@lin.ky',
  scheduledAt,
}: {
  email: string;
  subject: string;
  from?: string;
  replyTo?: string;
  react?: React.ReactNode;
  text?: string;
  scheduledAt?: Date;
}) {
  const resend = createResendClient();

  if (!resend) {
    console.warn('Resend is not enabled, skipping email send');
    return;
  }

  const isValidEmail = validateEmail(email);

  if (!isValidEmail) {
    console.warn('Invalid email, skipping email send');
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to: [email],
      replyTo,
      subject,
      react,
      text,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
    });

    if (error) {
      console.error('Error sending email', error);
      captureException(error);
    }
  } catch (error) {
    console.error('Error sending email', error);
    captureException(error);
  }

  return;
}

export async function sendTrialReminderEmail(email: string) {
  return await sendEmail({
    email,
    subject: 'Your Linky Premium trial is ending soon',
    react: <TrialEndingSoonEmail />,
  });
}

export async function sendTrialEndedEmail(email: string) {
  return await sendEmail({
    email,
    subject: 'Your Linky Premium trial has ended',
    text: TrialFinishedEmailText,
  });
}

export async function sendSubscriptionDeletedEmail(email: string) {
  return await sendEmail({
    email,
    subject: 'Your Linky subscription has been cancelled',
    react: <SubscriptionCancelledEmail />,
  });
}

export async function sendOrganizationInvitationEmail({
  email,
  inviteLink,
}: {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
}) {
  return await sendEmail({
    email,
    subject: "You've been invited to join a team on Linky",
    react: <OrganizationInviteEmail inviteUrl={inviteLink} />,
  });
}

export async function sendWelcomeEmail(email: string) {
  return await sendEmail({
    from: 'Alex from Linky<alex@notifications.lin.ky>',
    replyTo: 'alex@lin.ky',
    email,
    subject: 'Welcome to Linky',
    react: <WelcomeEmail />,
  });
}

export async function sendWelcomeFollowUpEmail(email: string) {
  const twentyThreeHoursFromNow = new Date(Date.now() + 23 * 60 * 60 * 1000);

  return await sendEmail({
    from: 'Alex<alex@notifications.lin.ky>',
    replyTo: 'alex@lin.ky',
    email,
    subject: 'Re: Welcome to Linky',
    scheduledAt: twentyThreeHoursFromNow,
    text: "Hey,\n\nI'm Alex, the founder of Linky. Welcome!\n\nI wanted to reach out to see how you're finding using Linky so far?\n\nAs someone who has been creating content online for the past 15 years, I built Linky as a tool to make it easier to start building your presence online.\n\nIf you're looking for inspiration, we've also recently launched the explore gallery (lin.ky/i/explore), where you can find some of our favorite pages from the community.\n\nIf you have any questions or have any issues using the platform, feel free to respond to this email (I respond to every email personally).\n\nAlex",
  });
}

export async function sendMagicLinkEmail({
  email,
  url,
}: {
  email: string;
  url: string;
}) {
  return await sendEmail({
    email,
    subject: 'Verify your Linky login',
    react: <MagicLinkEmail url={url} />,
  });
}

export async function sendSubscriptionUpgradedTeamEmail({
  email,
}: {
  email: string;
}) {
  return await sendEmail({
    email,
    subject: 'Your Linky subscription has been upgraded',
    react: <SubscriptionUpgradedEmail planName="team" />,
  });
}

export async function sendSubscriptionUpgradedPremiumEmail({
  email,
}: {
  email: string;
}) {
  return await sendEmail({
    email,
    subject: 'Your Linky subscription has been upgraded',
    react: <SubscriptionUpgradedEmail planName="premium" />,
  });
}
