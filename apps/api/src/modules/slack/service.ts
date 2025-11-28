import { config } from '@/modules/features';
import { Block, WebClient } from '@slack/web-api';
import { User } from 'better-auth';

const slackClient = new WebClient(process.env.SLACK_TOKEN);

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
}) {
  if (!config.slack.enabled) {
    console.info('Slack is not enabled, skipping message');
    return;
  }

  try {
    const res = await slackClient.chat.postMessage({
      channel,
      text,
      blocks,
    });

    console.log('Message sent successfully:', res.ts);
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
