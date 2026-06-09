import preview3 from '@/assets/landing-page/previews/3.png';
import { MarketingContainer } from '@/components/marketing-container';
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
import { Button } from '@trylinky/ui';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface HeroBreadcrumb {
  name: string;
  url: string;
}

/** Sparse, playful colour pops on the otherwise monochrome canvas (à la family.co). */
function HeroConfetti() {
  const shapes = [
    { c: '#07B151', t: '18%', l: '6%', s: 14, r: false },
    { c: '#FBB40F', t: '88%', l: '9%', s: 12, r: true },
    { c: '#2357BC', t: '12%', l: '34%', s: 9, r: false },
    { c: '#E8553F', t: '15%', l: '54%', s: 13, r: false },
    { c: '#733B97', t: '14%', l: '90%', s: 11, r: true },
    { c: '#2FBBB3', t: '70%', l: '95%', s: 14, r: false },
    { c: '#8CC640', t: '82%', l: '60%', s: 10, r: true },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0">
      {shapes.map((sh, i) => (
        <span
          key={i}
          className={sh.r ? 'absolute rounded-[4px]' : 'absolute rounded-full'}
          style={{
            top: sh.t,
            left: sh.l,
            width: sh.s,
            height: sh.s,
            backgroundColor: sh.c,
            transform: sh.r ? 'rotate(20deg)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function MinimalHero({
  eyebrow,
  h1,
  answer,
  ctaHref = '/i/auth/signup',
  ctaLabel = 'Get started free',
  secondaryHref = '/i/templates',
  secondaryLabel = 'Browse templates',
  breadcrumbs,
  shot = preview3,
  phoneVisual,
  visual,
}: {
  eyebrow?: string;
  h1: string;
  answer: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  breadcrumbs?: HeroBreadcrumb[];
  shot?: StaticImageData;
  phoneVisual?: ReactNode;
  /** Replaces the phone frame entirely (e.g. a comparison card). */
  visual?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-zinc-950/5 bg-linear-to-b from-white to-[#F5F5F3] pt-32 pb-20 md:pt-40 md:pb-28">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbs)),
          }}
        />
      )}
      <HeroConfetti />
      <MarketingContainer>
        <div className="relative z-10 grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-20">
          <div>
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav
                aria-label="Breadcrumb"
                className="mb-6 flex flex-wrap items-center gap-1.5 text-sm"
              >
                {breadcrumbs.map((c, i) => (
                  <span key={c.url} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-zinc-300">/</span>}
                    {i < breadcrumbs.length - 1 ? (
                      <Link
                        href={new URL(c.url).pathname}
                        className="text-zinc-400 transition-colors hover:text-zinc-700"
                      >
                        {c.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-zinc-400">{c.name}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            {eyebrow && (
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <span className="inline-block h-px w-6 bg-zinc-300" />
                {eyebrow}
              </p>
            )}
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-900 text-balance md:text-5xl">
              {h1}
            </h1>
            <p className="mt-5 max-w-[42ch] text-lg text-zinc-500 text-pretty">
              {answer}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="xl"
                className="rounded-full bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
              >
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="xl"
                className="rounded-full font-medium text-zinc-700 hover:bg-zinc-100"
              >
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>
          </div>

          {visual ? (
            <div className="mx-auto w-full max-w-md">{visual}</div>
          ) : (
            /* Single clean device, no decoration */
            <div className="mx-auto w-full max-w-[300px]">
              <div className="rounded-[2.4rem] bg-white p-2 shadow-xl shadow-zinc-900/10 ring-1 ring-zinc-950/10">
                <div className="overflow-hidden rounded-[1.9rem] bg-zinc-50">
                  {phoneVisual ?? (
                    <Image
                      src={shot}
                      width={1170}
                      height={2532}
                      alt="A Linky page"
                      priority
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </MarketingContainer>
    </section>
  );
}
