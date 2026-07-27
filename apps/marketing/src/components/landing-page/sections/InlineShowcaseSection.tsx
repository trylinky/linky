import iconInstagram from '@/assets/landing-page/integration-icons/icon-instagram.png';
import iconSpotify from '@/assets/landing-page/integration-icons/icon-spotify.png';
import iconThreads from '@/assets/landing-page/integration-icons/icon-threads.png';
import iconTiktok from '@/assets/landing-page/integration-icons/icon-tiktok.png';
import iconYoutube from '@/assets/landing-page/integration-icons/icon-youtube.png';
import { MarketingContainer } from '@/components/marketing-container';
import Image from 'next/image';
import React from 'react';

const socialIcons = [
  {
    name: 'Instagram',
    icon: iconInstagram,
  },
  {
    name: 'Threads',
    icon: iconThreads,
  },
];

const musicIcons = [
  {
    name: 'Spotify',
    icon: iconSpotify,
  },
];

const videoIcons = [
  {
    name: 'Youtube',
    icon: iconYoutube,
  },
  {
    name: 'TikTok',
    icon: iconTiktok,
  },
];

const IconSet = ({ variant }: { variant: 'social' | 'video' | 'music' }) => {
  const iconVariants = {
    social: socialIcons,
    video: videoIcons,
    music: musicIcons,
  };

  const icons = iconVariants[variant];

  return (
    <div className="inline-flex flex-row-reverse items-center justify-center ml-2 top-1 relative">
      {icons.map((icon) => (
        <Image
          key={icon.name}
          src={icon.icon}
          alt={icon.name}
          width={42}
          height={42}
          className="-ml-2"
        />
      ))}
    </div>
  );
};

export function InlineShowcaseSection() {
  return (
    <section className="py-20 relative bg-white">
      <MarketingContainer className="text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight md:leading-snug">
            With integrations so you can show your{' '}
            <span className="font-black">latest posts</span>
            <IconSet variant="social" />, your{' '}
            <span className="font-black">latest videos</span>
            <IconSet variant="video" />, or what you're{' '}
            <span className="font-black">listening to</span>{' '}
            <IconSet variant="music" /> right now!{' '}
          </h2>
        </div>
      </MarketingContainer>
    </section>
  );
}
