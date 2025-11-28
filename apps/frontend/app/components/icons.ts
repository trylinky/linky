export type Icon = {
  label: string;
  subLabel?: string;
  value: string;
};

export const icons: Icon[] = [
  {
    label: 'Behance',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/behance-bw.svg',
  },
  {
    label: 'Behance',
    value: 'https://cdn.lin.ky/default-data/icons/behance.svg',
  },
  {
    label: 'Discord',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/discord-bw.svg',
  },
  {
    label: 'Discord',
    value: 'https://cdn.lin.ky/default-data/icons/discord.svg',
  },
  {
    label: 'Dribbble',
    value: 'https://cdn.lin.ky/default-data/icons/dribbble.svg',
  },
  {
    label: 'Sketch',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/sketch-bw.svg',
  },
  {
    label: 'Figma',
    value: 'https://cdn.lin.ky/default-data/icons/figma.svg',
  },
  {
    label: 'Polywork',
    value: 'https://cdn.lin.ky/default-data/icons/polywork.svg',
  },
  {
    label: 'Figma',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/figma-bw.svg',
  },
  {
    label: 'Facebook',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/facebook-bw.svg',
  },
  {
    label: 'Facebook',
    value: 'https://cdn.lin.ky/default-data/icons/facebook.svg',
  },
  {
    label: 'Flickr',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/flickr-bw.svg',
  },
  {
    label: 'Flickr',
    value: 'https://cdn.lin.ky/default-data/icons/flickr.svg',
  },
  {
    label: 'GitHub',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/github-bw.svg',
  },
  {
    label: 'GitHub',
    value: 'https://cdn.lin.ky/default-data/icons/github.svg',
  },
  {
    label: 'Instagram',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/instagram-bw.svg',
  },
  {
    label: 'Instagram',
    value: 'https://cdn.lin.ky/default-data/icons/instagram.svg',
  },
  {
    label: 'LinkedIn',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/linkedin-bw.svg',
  },
  {
    label: 'LinkedIn',
    value: 'https://cdn.lin.ky/default-data/icons/linkedin.svg',
  },
  {
    label: 'Medium',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/medium-bw.svg',
  },
  {
    label: 'Medium',
    value: 'https://cdn.lin.ky/default-data/icons/medium.svg',
  },
  {
    label: 'Pinterest',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/pinterest-bw.svg',
  },
  {
    label: 'Pinterest',
    value: 'https://cdn.lin.ky/default-data/icons/pinterest.svg',
  },
  {
    label: 'Reddit',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/reddit-bw.svg',
  },
  {
    label: 'Reddit',
    value: 'https://cdn.lin.ky/default-data/icons/reddit.svg',
  },
  {
    label: 'Slack',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/slack-bw.svg',
  },
  {
    label: 'Slack',
    value: 'https://cdn.lin.ky/default-data/icons/slack.svg',
  },
  {
    label: 'Snapchat',
    value: 'https://cdn.lin.ky/default-data/icons/snapchat.svg',
  },
  {
    label: 'Stack Overflow',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/stack-overflow-bw.svg',
  },
  {
    label: 'Stack Overflow',
    value: 'https://cdn.lin.ky/default-data/icons/stack-overflow.svg',
  },
  {
    label: 'Telegram',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/telegram-bw.svg',
  },
  {
    label: 'Telegram',
    value: 'https://cdn.lin.ky/default-data/icons/telegram.svg',
  },
  {
    label: 'TikTok',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/tiktok-bw.svg',
  },
  {
    label: 'TikTok',
    value: 'https://cdn.lin.ky/default-data/icons/tiktok.svg',
  },
  {
    label: 'Twitter',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/twitter-bw.svg',
  },
  {
    label: 'Twitter',
    value: 'https://cdn.lin.ky/default-data/icons/twitter.svg',
  },
  {
    label: 'WhatsApp',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/whatsapp-bw.svg',
  },
  {
    label: 'WhatsApp',
    value: 'https://cdn.lin.ky/default-data/icons/whatsapp.svg',
  },
  {
    label: 'YouTube',
    subLabel: 'Grayscale',
    value: 'https://cdn.lin.ky/default-data/icons/youtube-bw.svg',
  },
  {
    label: 'YouTube',
    value: 'https://cdn.lin.ky/default-data/icons/youtube.svg',
  },
  {
    label: 'X',
    value: 'https://cdn.lin.ky/default-data/icons/twitter-x.svg',
  },
].sort((a, b) => {
  if (a.label < b.label) {
    return -1;
  }
  if (a.label > b.label) {
    return 1;
  }
  return 0;
});
