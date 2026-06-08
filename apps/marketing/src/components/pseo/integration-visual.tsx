import logoThreads from '@/assets/landing-page/logo-threads.svg';
import logoTiktok from '@/assets/landing-page/logo-tiktok.svg';
import {
  GithubCommitsThisMonthMockup,
  InstagramLatestPostMockup,
  SpotifyPlayingNowMockup,
} from '@/components/landing-page/ui-mockups';
import Image from 'next/image';

/**
 * Returns the best hero visual for an integration slug.
 * Known mockups: spotify, instagram, github.
 * Fallback for tiktok/threads: a centered platform logo card.
 */
export function IntegrationVisual({ slug }: { slug: string }) {
  switch (slug) {
    case 'spotify':
      return (
        <div className="w-full max-w-sm">
          <SpotifyPlayingNowMockup className="w-full" />
        </div>
      );
    case 'instagram':
      return (
        <div className="w-full max-w-sm h-64 rounded-2xl overflow-hidden shadow-sm">
          <InstagramLatestPostMockup className="w-full h-full" />
        </div>
      );
    case 'github':
      return (
        <div className="w-full max-w-sm">
          <GithubCommitsThisMonthMockup className="w-full" />
        </div>
      );
    case 'tiktok':
      return (
        <PlatformLogoCard
          logo={logoTiktok}
          name="TikTok"
          bgClass="bg-black"
        />
      );
    case 'threads':
      return (
        <PlatformLogoCard
          logo={logoThreads}
          name="Threads"
          bgClass="bg-[#101010]"
        />
      );
    default:
      return null;
  }
}

function PlatformLogoCard({
  logo,
  name,
  bgClass,
}: {
  logo: string;
  name: string;
  bgClass: string;
}) {
  return (
    <div
      className={`w-full max-w-sm rounded-2xl ${bgClass} flex items-center justify-center p-16 shadow-sm`}
    >
      <Image src={logo} alt={name} width={80} height={80} className="opacity-90" />
    </div>
  );
}
