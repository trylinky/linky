import { MarketingContainer } from '@/components/marketing-container';
import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { PseoFaq, type FaqEntry } from '@/components/pseo/pseo-faq';
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface Breadcrumb {
  name: string;
  url: string;
}

export function PseoPage(props: {
  h1: string;
  answer: string;
  breadcrumbs: Breadcrumb[];
  hero?: ReactNode;
  children: ReactNode;
  faqs: FaqEntry[];
}) {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          {props.breadcrumbs.map((c, i) => (
            <span key={c.url}>
              {i > 0 && <span className="mx-1">/</span>}
              {i < props.breadcrumbs.length - 1 ? (
                <Link href={c.url} className="hover:underline">{c.name}</Link>
              ) : (
                <span className="text-gray-700">{c.name}</span>
              )}
            </span>
          ))}
        </nav>

        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">{props.h1}</h1>
          <p className="mt-4 text-xl text-gray-600">{props.answer}</p>
        </header>

        {props.hero && <div className="mt-10">{props.hero}</div>}

        <div className="mt-12 max-w-3xl prose prose-lg">{props.children}</div>

        <PseoFaq faqs={props.faqs} />

        <div className="mt-12">
          <CallToActionBlock />
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbSchema(props.breadcrumbs)) }}
        />
      </MarketingContainer>
    </div>
  );
}
