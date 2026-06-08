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
  tone = 'light',
}: {
  eyebrow?: string;
  h1: string;
  answer: string;
  ctaHref?: string;
  ctaLabel?: string;
  visual?: ReactNode;
  breadcrumbs?: HeroBreadcrumb[];
  tone?: 'light' | 'dark';
}) {
  const isDark = tone === 'dark';

  return (
    <section
      className={
        isDark
          ? 'bg-linear-to-b from-[#1A1712] to-[#14110D] pt-28 md:pt-36 pb-16 md:pb-24'
          : 'bg-linear-to-b from-[#F4F0E7] to-[#FBFAF7] pt-28 md:pt-36 pb-16 md:pb-24'
      }
    >
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
                      <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>/</span>
                    )}
                    {i < breadcrumbs.length - 1 ? (
                      <Link
                        href={new URL(c.url).pathname}
                        className={
                          isDark
                            ? 'text-zinc-400 hover:text-zinc-200 transition-colors'
                            : 'text-zinc-500 hover:text-zinc-800 transition-colors'
                        }
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span
                        className={
                          isDark ? 'text-zinc-400 font-medium' : 'text-zinc-500 font-medium'
                        }
                      >
                        {c.name}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            {eyebrow && (
              <div className="mb-4">
                {isDark ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#FF7A5C]">
                    <span className="inline-block size-1.5 rounded-full bg-[#FF7A5C]" />
                    {eyebrow}
                  </p>
                ) : (
                  <PseoEyebrow>{eyebrow}</PseoEyebrow>
                )}
              </div>
            )}
            <h1
              className={
                isDark
                  ? 'text-4xl md:text-6xl font-black tracking-tight text-white text-balance'
                  : 'text-4xl md:text-6xl font-black tracking-tight text-zinc-900 text-balance'
              }
            >
              {h1}
            </h1>
            <p
              className={
                isDark
                  ? 'mt-5 text-lg md:text-xl text-zinc-300 text-pretty max-w-[48ch]'
                  : 'mt-5 text-lg md:text-xl text-zinc-600 text-pretty max-w-[48ch]'
              }
            >
              {answer}
            </p>
            {isDark ? (
              <Button
                asChild
                variant="default"
                size="xl"
                className="mt-8 rounded-full font-bold bg-white text-zinc-900 hover:bg-zinc-100"
              >
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            ) : (
              <Button
                asChild
                variant="default"
                size="xl"
                className="mt-8 rounded-full font-bold"
              >
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            )}
          </div>
          {visual && (
            <div className="flex items-center justify-center">
              <div className="relative w-full flex items-center justify-center">
                {/* Soft glow behind the visual */}
                <div
                  className="pointer-events-none absolute inset-0 -z-10 rounded-3xl"
                  style={{
                    background: isDark
                      ? 'radial-gradient(ellipse at center, rgba(232,85,63,0.25) 0%, transparent 70%)'
                      : 'radial-gradient(ellipse at center, rgba(232,85,63,0.10) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                />
                <div
                  className={
                    isDark
                      ? 'rounded-3xl ring-1 ring-white/10 shadow-xl shadow-zinc-900/5 overflow-hidden'
                      : 'rounded-3xl ring-1 ring-black/5 shadow-xl shadow-zinc-900/5 overflow-hidden'
                  }
                >
                  {visual}
                </div>
              </div>
            </div>
          )}
        </div>
      </MarketingContainer>
    </section>
  );
}
