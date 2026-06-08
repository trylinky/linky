import { MarketingContainer } from '@/components/marketing-container';
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
import { Button } from '@trylinky/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PseoEyebrow } from './pseo-section';

export interface HeroBreadcrumb {
  name: string;
  url: string; // absolute https://... URL
}

export function PseoHero({
  eyebrow,
  h1,
  answer,
  ctaHref = '/i/auth/signup',
  ctaLabel = 'Get started free',
  visual,
  breadcrumbs,
}: {
  eyebrow?: string;
  h1: string;
  answer: string;
  ctaHref?: string;
  ctaLabel?: string;
  visual?: ReactNode;
  breadcrumbs?: HeroBreadcrumb[];
}) {
  return (
    <section className="bg-linear-to-b from-[#f5f3ea] to-white pt-28 md:pt-36 pb-16 md:pb-20">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbs)),
          }}
        />
      )}
      <MarketingContainer>
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-1.5 text-sm mb-5"
              >
                {breadcrumbs.map((c, i) => (
                  <span key={c.url} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span className="text-gray-300">/</span>
                    )}
                    {i < breadcrumbs.length - 1 ? (
                      <Link
                        href={new URL(c.url).pathname}
                        className="text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span className="text-gray-700 font-medium">{c.name}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            {eyebrow && (
              <div className="mb-4">
                <PseoEyebrow>{eyebrow}</PseoEyebrow>
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black">
              {h1}
            </h1>
            <p className="mt-5 text-lg md:text-xl text-[#241f3d]/80 text-pretty">
              {answer}
            </p>
            <Button
              asChild
              variant="default"
              size="xl"
              className="mt-8 rounded-full font-bold"
            >
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          </div>
          {visual && (
            <div className="flex items-center justify-center">{visual}</div>
          )}
        </div>
      </MarketingContainer>
    </section>
  );
}
