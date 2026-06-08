import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { MarketingContainer } from '@/components/marketing-container';
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { FaqEntry } from './pseo-faq';
import { PseoFaqSection } from './pseo-faq-section';

export interface Breadcrumb {
  name: string;
  url: string; // absolute https://... URL
}

export function PseoLayout({
  breadcrumbs,
  faqs,
  children,
}: {
  breadcrumbs: Breadcrumb[];
  faqs: FaqEntry[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Slim breadcrumb nav */}
      <div className="bg-linear-to-b from-[#f5f3ea] to-[#f5f3ea]">
        <MarketingContainer className="pt-6 pb-0">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            {breadcrumbs.map((c, i) => (
              <span key={c.url}>
                {i > 0 && <span className="mx-1">/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link
                    href={new URL(c.url).pathname}
                    className="hover:underline hover:text-gray-700"
                  >
                    {c.name}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium">{c.name}</span>
                )}
              </span>
            ))}
          </nav>
        </MarketingContainer>
      </div>

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

      {/* Breadcrumb JSON-LD (uses absolute URLs as required by Google) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbs)),
        }}
      />
    </div>
  );
}
