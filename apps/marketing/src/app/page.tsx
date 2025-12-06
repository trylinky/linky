import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { FrequentlyAskedQuestions } from '@/components/landing-page/Faq';
import {
  ExpandedFeaturesSection,
  FeaturesSection,
} from '@/components/landing-page/sections/features';
import Hero from '@/components/landing-page/sections/hero';
import { HowItWorksSection } from '@/components/landing-page/sections/how-it-works';
import { MissionSection } from '@/components/landing-page/sections/mission';
import { ProblemSolutionSection } from '@/components/landing-page/sections/problem-solution';
import { MarketingContainer } from '@/components/marketing-container';
import Link from 'next/link';
import React from 'react';

export default async function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <ProblemSolutionSection />
      <FeaturesSection />
      <MissionSection />
      <ExpandedFeaturesSection />
      <HowItWorksSection />

      <section className="py-8 md:py-24 bg-white">
        <MarketingContainer>
          <CallToActionBlock />
        </MarketingContainer>
      </section>

      <section className="py-24 bg-white">
        <MarketingContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              Häufige Fragen
            </h2>
            <div className="flex flex-col items-start w-full flex-1 gap-4">
              <FrequentlyAskedQuestions questionSet="landing-page" />
              <Link href="/i/learn" className="text-sm text-slate-600">
                Mehr erfahren →
              </Link>
            </div>
          </div>
        </MarketingContainer>
      </section>
    </div>
  );
}
