import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { FrequentlyAskedQuestions } from '@/components/landing-page/Faq';
import { MarketingContainer } from '@/components/marketing-container';
import { PricingTable, auth } from '@trylinky/common';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Pricing | Linky',
  description: 'Take Linky to the next level with one of our paid plans.',
};

export default async function PricingPage() {
  const headersList = await headers();

  const session = await auth.getSession({
    fetchOptions: {
      headers: headersList,
    },
  });

  return (
    <div className="bg-gradient-to-b from-[#f9f9f8] to-[#f5f3ea] pt-24 sm:pt-32 pb-8">
      <MarketingContainer className="text-center">
        <h1 className="text-pretty text-5xl lg:text-6xl font-black text-black tracking-tight">
          Go Premium.
        </h1>
        <p className="mt-6 text-xl font-medium text-gray-600">
          Take Linky to the next level with one of our paid plans.
        </p>
      </MarketingContainer>
      <section className="py-16">
        <PricingTable isLoggedIn={!!session?.data?.session} />
      </section>

      <section className="pb-20">
        <MarketingContainer>
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="flex flex-col items-center mb-8"></div>
            <blockquote
              className="text-2xl md:text-3xl font-semibold text-[#222] mb-8 leading-snug"
              style={{ fontVariationSettings: "'SERF' 10, 'wght' 500" }}
            >
              "I really value how Linky compliments my aesthetic while giving me
              the flexibility I need to showcase my work."
            </blockquote>
            <div className="flex items-center gap-3 mt-4">
              <Image
                src="https://cdn.glow.as/block-7c7149ca-6cc6-4975-be45-94af3eeb8c2f/f7b2b41b-eb7d-47c4-960a-5a21283a9aa4.webp"
                alt="de LVCɅ"
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="text-left">
                <div className="font-semibold text-base text-[#222]">
                  de LVCɅ
                </div>
                <div className="text-sm text-[#555]">lin.ky/delucax99</div>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </section>

      <section className="my-24">
        <MarketingContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Frequently Asked <br /> Questions
            </h2>
            <div className="flex flex-col items-start w-full flex-1 gap-4">
              <FrequentlyAskedQuestions questionSet="pricing" />
            </div>
          </div>
        </MarketingContainer>
      </section>

      <section className="py-8 md:py-16">
        <MarketingContainer>
          <CallToActionBlock />
        </MarketingContainer>
      </section>
    </div>
  );
}
