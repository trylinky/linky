import type { ReactNode } from 'react';
import type { FaqEntry } from './pseo-faq';
import { PseoFaqSection } from './pseo-faq-section';
import { PseoCtaCard } from './pseo-cta-card';
import { MinimalCta } from './pseo-minimal-cta';

export function PseoLayout({
  faqs,
  children,
  minimal = false,
}: {
  faqs: FaqEntry[];
  children: ReactNode;
  minimal?: boolean;
}) {
  return (
    <div className="min-h-screen">
      {/* Page sections */}
      {children}

      {/* FAQ */}
      <PseoFaqSection faqs={faqs} minimal={minimal} />

      {/* CTA */}
      {minimal ? <MinimalCta /> : <PseoCtaCard />}
    </div>
  );
}
