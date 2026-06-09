import { FrequentlyAskedQuestions } from '@/components/landing-page/Faq';
import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHeading } from '@/components/minimal-heading';
import { HubConfetti } from '@/components/pseo/minimal-hub';
import { MinimalCta } from '@/components/pseo/pseo-minimal-cta';
import { buildPageMetadata } from '@/lib/seo-metadata';
import { PricingTable, auth } from '@trylinky/common';
import { headers } from 'next/headers';
import Image from 'next/image';

export const metadata = buildPageMetadata({
  title: 'Linky pricing - free, Premium, and Team plans',
  description:
    'Linky is free to start. Premium unlocks custom domains, advanced blocks, and analytics; Team adds shared pages and seats. Compare plans and pricing.',
  path: '/i/pricing',
});

export default async function PricingPage() {
  const headersList = await headers();

  const session = await auth.getSession({
    fetchOptions: {
      headers: headersList,
    },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-zinc-950/5 bg-linear-to-b from-white to-[#F5F5F3] pt-32 pb-12 md:pt-40">
        <HubConfetti />
        <MarketingContainer>
          <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
              <span className="inline-block h-px w-6 bg-zinc-300" />
              Pricing
            </p>
            <h1 className="mt-4 max-w-[30ch] text-5xl font-semibold tracking-tight text-zinc-900 text-balance lg:text-6xl">
              Start free. Upgrade when you grow.
            </h1>
            <p className="mt-5 max-w-[48ch] text-xl text-zinc-500 text-pretty">
              Every page starts on the free plan. Premium and Team add custom
              domains, analytics, and more when you need them.
            </p>
          </div>
        </MarketingContainer>
      </section>

      {/* Plans */}
      <section className="py-16 md:py-20">
        <PricingTable isLoggedIn={!!session?.data?.session} showFree />
        <p className="mt-10 text-center text-sm text-zinc-400">
          No credit card to start · Cancel anytime · Your page stays live on
          every plan
        </p>
      </section>

      {/* Testimonial */}
      <section className="border-t border-zinc-950/5 bg-[#FAFAF9] py-20 md:py-24">
        <MarketingContainer>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <blockquote className="text-2xl font-semibold leading-snug text-zinc-900 text-balance md:text-3xl">
              &ldquo;I really value how Linky compliments my aesthetic while
              giving me the flexibility I need to showcase my work.&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center gap-3">
              <Image
                src="https://cdn.glow.as/block-7c7149ca-6cc6-4975-be45-94af3eeb8c2f/f7b2b41b-eb7d-47c4-960a-5a21283a9aa4.webp"
                alt="de LVCɅ"
                width={48}
                height={48}
                className="rounded-full"
              />
              <div className="text-left">
                <div className="text-base font-semibold text-zinc-900">
                  de LVCɅ
                </div>
                <div className="text-sm text-zinc-500">lin.ky/delucax99</div>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </section>

      {/* FAQ */}
      <section className="border-t border-zinc-950/5 bg-white py-20 md:py-28">
        <MarketingContainer>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            <MinimalHeading eyebrow="FAQ" heading="Frequently asked questions" />
            <div className="flex w-full flex-1 flex-col items-start gap-4">
              <FrequentlyAskedQuestions questionSet="pricing" />
            </div>
          </div>
        </MarketingContainer>
      </section>

      <MinimalCta
        headline="Try it free today"
        subtext="Claim your username now and upgrade whenever you need more - custom domains, analytics, and advanced blocks."
      />
    </div>
  );
}
