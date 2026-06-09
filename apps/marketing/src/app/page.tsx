import { FrequentlyAskedQuestions } from '@/components/landing-page/Faq';
import { BlocksGrid } from '@/components/landing-page/sections/blocks-grid';
import {
  ExpandedFeaturesSection,
  FeatureSplits,
} from '@/components/landing-page/sections/features';
import Hero from '@/components/landing-page/sections/hero';
import { HowItWorks } from '@/components/landing-page/sections/how-it-works';
import { IntegrationsCloud } from '@/components/landing-page/sections/integrations-cloud';
import { TemplatesStrip } from '@/components/landing-page/sections/templates-strip';
import { TestimonialsSection } from '@/components/landing-page/sections/testimonials';
import { MinimalCta } from '@/components/pseo/pseo-minimal-cta';
import { MinimalHeading } from '@/components/minimal-heading';
import { MarketingContainer } from '@/components/marketing-container';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <IntegrationsCloud />
      <HowItWorks />
      <BlocksGrid />
      <FeatureSplits />
      <TemplatesStrip />
      <ExpandedFeaturesSection />

      <TestimonialsSection />

      <section className="border-t border-zinc-950/5 bg-white py-20 md:py-28">
        <MarketingContainer>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
            <MinimalHeading eyebrow="FAQ" heading="Frequently asked questions" />
            <div className="flex w-full flex-1 flex-col items-start gap-4">
              <FrequentlyAskedQuestions questionSet="landing-page" />
              <Link
                href="/i/learn"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
              >
                View more →
              </Link>
            </div>
          </div>
        </MarketingContainer>
      </section>

      <MinimalCta
        headline="Your link in bio, beautifully done"
        subtext="Create your page and have it live in minutes - free, no credit card."
      />
    </div>
  );
}
