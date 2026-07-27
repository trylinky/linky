import { PseoCtaCard } from './pseo-cta-card';
import type { FaqEntry } from './pseo-faq';
import { PseoFaqSection } from './pseo-faq-section';
import { MinimalCta } from './pseo-minimal-cta';
import type { ReactNode } from 'react';

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
