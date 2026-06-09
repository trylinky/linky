import iconGithub from '@/assets/landing-page/integration-icons/icon-github.png';
import iconInstagram from '@/assets/landing-page/integration-icons/icon-instagram.png';
import iconSnapchat from '@/assets/landing-page/integration-icons/icon-snapchat.png';
import iconSpotify from '@/assets/landing-page/integration-icons/icon-spotify.png';
import iconThreads from '@/assets/landing-page/integration-icons/icon-threads.png';
import iconTiktok from '@/assets/landing-page/integration-icons/icon-tiktok.png';
import iconTwitch from '@/assets/landing-page/integration-icons/icon-twitch.png';
import iconYoutube from '@/assets/landing-page/integration-icons/icon-youtube.png';
import { MarketingContainer } from '@/components/marketing-container';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';
import Link from 'next/link';

const PLATFORMS: { name: string; icon: StaticImageData }[] = [
  { name: 'Spotify', icon: iconSpotify },
  { name: 'Instagram', icon: iconInstagram },
  { name: 'TikTok', icon: iconTiktok },
  { name: 'YouTube', icon: iconYoutube },
  { name: 'Threads', icon: iconThreads },
  { name: 'GitHub', icon: iconGithub },
  { name: 'Twitch', icon: iconTwitch },
  { name: 'Snapchat', icon: iconSnapchat },
];

export function IntegrationsCloud() {
  return (
    <section className="bg-white py-14 md:py-16">
      <MarketingContainer>
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-zinc-500">
            Pulls live content from the platforms you already use.
          </p>
          <div className="mt-7 grid grid-cols-4 items-center justify-items-center gap-x-10 gap-y-6 sm:flex sm:gap-9">
            {PLATFORMS.map((p) => (
              <Image
                key={p.name}
                src={p.icon}
                alt={p.name}
                width={36}
                height={36}
                className="size-8 rounded-lg md:size-9"
              />
            ))}
          </div>
          <Link
            href="/i/integrations"
            className="mt-7 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Explore all integrations →
          </Link>
        </div>
      </MarketingContainer>
    </section>
  );
}
