import tiktokHeroImage from './hero.png';
import { TikTokLoginButton } from './login-button';
import { createNewOrchestration } from '@/app/tiktok/actions';
import { MarketingContainer } from '@/components/marketing-container';
import Image from 'next/image';

export const metadata = {
  title: 'TikTok link-in-bio generator | Linky',
  description:
    'Use our magic generator to create your own customisable link-in-bio from your TikTok profile!',
};

export default async function TikTokGeneratePage() {
  return (
    <section className="w-full h-full bg-gradient-to-b from-[#f9f9f8] to-[#f5f3ea] py-32 min-h-screen">
      <MarketingContainer>
        <div className="flex flex-col items-center text-center max-w-xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-stone-950 mb-2 text-balance">
            Generate your own TikTok link-in-bio
          </h1>
          <span className="text-stone-950/80 text-xl text-balance">
            An automatically generated link in bio crafted for your TikTok.
          </span>

          <TikTokLoginButton className="mt-8" action={createNewOrchestration} />
        </div>

        <Image
          src={tiktokHeroImage}
          alt="TikTok link-in-bio"
          width={1000}
          height={1000}
          className="mt-24"
        />
      </MarketingContainer>
    </section>
  );
}
