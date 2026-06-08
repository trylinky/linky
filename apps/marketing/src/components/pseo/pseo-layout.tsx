import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { MarketingContainer } from '@/components/marketing-container';
import type { ReactNode } from 'react';
import type { FaqEntry } from './pseo-faq';
import { PseoFaqSection } from './pseo-faq-section';

export function PseoLayout({
  faqs,
  children,
}: {
  faqs: FaqEntry[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Page sections */}
      {children}

      {/* FAQ */}
      <PseoFaqSection faqs={faqs} />

      {/* CTA */}
      <section className="py-8 md:py-24 bg-white">
        <MarketingContainer>
          <CallToActionBlock />
        </MarketingContainer>
      </section>
    </div>
  );
}
