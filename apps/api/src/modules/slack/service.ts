import { config } from '@/modules/features';
import { User } from 'better-auth';

// The SDK is Node-HTTP-based and does not run on Workers. This module makes
// exactly one kind of call, so a plain fetch is a smaller surface than a
// polyfill.
export type Block = Record<string, unknown>;

const slackChannels = {
  default: 'C08GWNF2MHV',
};

export async function sendSlackMessage({
  channel = slackChannels.default,
  text,
  blocks,
}: {
  channel?: string;
  text: string;
  blocks?: Block[];
}): Promise<void> {
  if (!config.slack.enabled) {
    console.info('Slack is not enabled, skipping message');
    return;
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
      },
      body: JSON.stringify({ channel, text, blocks }),
    });

    const result = (await response.json()) as { ok: boolean; error?: string };

    if (!result.ok) {
      console.error('Error sending message:', result.error);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

export async function sendNewUserSlackMessage(user: User) {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `New Signup:\n*${user.name} - ${user.email}*`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Plan:*\nPremium`,
        },
      ],
    },
  ];

  await sendSlackMessage({
    text: 'New signup',
    blocks,
  });
}

export async function sendNewOrganizationMultipleUsersSlackMessage(
  subscriptionId: string
) {
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `A new organization signed up, but multiple users were found for the personal organization.`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Subscription ID:*\n${subscriptionId}`,
        },
      ],
    },
  ];

  await sendSlackMessage({
    text: 'Issue: New organization with multiple users',
    blocks,
  });
}
