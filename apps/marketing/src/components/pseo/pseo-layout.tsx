import type { ReactNode } from 'react';
import type { FaqEntry } from './pseo-faq';
import { PseoFaqSection } from './pseo-faq-section';
import { PseoCtaCard } from './pseo-cta-card';

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
      <section className="bg-white pb-8 md:pb-16">
        <PseoCtaCard />
      </section>
    </div>
  );
}
