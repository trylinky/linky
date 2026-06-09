import wallStyles from '@/components/landing-page/call-to-action-block.module.css';
import preview1 from '@/assets/landing-page/previews/1.png';
import preview2 from '@/assets/landing-page/previews/2.png';
import preview3 from '@/assets/landing-page/previews/3.png';
import preview4 from '@/assets/landing-page/previews/4.png';
import preview5 from '@/assets/landing-page/previews/5.png';
import preview6 from '@/assets/landing-page/previews/6.png';
import preview7 from '@/assets/landing-page/previews/7.png';
import preview8 from '@/assets/landing-page/previews/8.png';
import preview9 from '@/assets/landing-page/previews/9.png';
import preview10 from '@/assets/landing-page/previews/10.png';
import preview11 from '@/assets/landing-page/previews/11.png';
import preview12 from '@/assets/landing-page/previews/12.png';
import preview13 from '@/assets/landing-page/previews/13.png';
import preview14 from '@/assets/landing-page/previews/14.png';
import preview15 from '@/assets/landing-page/previews/15.png';
import { MarketingContainer } from '@/components/marketing-container';
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
import { Button, cn } from '@trylinky/ui';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';
import Link from 'next/link';

export interface HeroBreadcrumb {
  name: string;
  url: string; // absolute https://... URL
}

const SHOTS: StaticImageData[] = [
  preview1, preview2, preview3, preview4, preview5, preview6, preview7,
  preview8, preview9, preview10, preview11, preview12, preview13, preview14,
  preview15,
];

function WallColumn({
  imgs,
  reverse,
}: {
  imgs: StaticImageData[];
  reverse?: boolean;
}) {
  const set = [...imgs, ...imgs];
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        reverse ? wallStyles.animateScrollReverse : wallStyles.animateScroll
      )}
    >
      {set.map((img, i) => (
        <Image
          key={i}
          src={img}
          width={1170}
          height={2532}
          alt=""
          className="w-[150px] rounded-2xl ring-1 ring-white/10 shadow-lg md:w-[200px]"
        />
      ))}
    </div>
  );
}

export function PseoHero({
  eyebrow,
  h1,
  answer,
  ctaHref = '/i/auth/signup',
  ctaLabel = 'Get started free',
  secondaryHref = '/i/templates',
  secondaryLabel = 'Browse templates',
  breadcrumbs,
  /** Offset into the screenshot set so different page types show a different wall. */
  shotOffset = 0,
}: {
  eyebrow?: string;
  h1: string;
  answer: string;
  ctaHref?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  breadcrumbs?: HeroBreadcrumb[];
  shotOffset?: number;
}) {
  const pick = (i: number) => SHOTS[(i + shotOffset) % SHOTS.length];
  const cols = [
    [pick(0), pick(5), pick(10)],
    [pick(1), pick(6), pick(11)],
    [pick(2), pick(7), pick(12)],
    [pick(3), pick(8), pick(13)],
    [pick(4), pick(9), pick(14)],
    [pick(2), pick(11), pick(6)],
  ];

  return (
    <section
      data-hero-dark=""
      className="relative overflow-hidden bg-[#0E0D0C] pt-28 pb-0 md:pt-36"
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildBreadcrumbSchema(breadcrumbs)),
          }}
        />
      )}

      {/* Tilted scrolling wall of real pages */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-start justify-center"
      >
        <div className="mt-[-8%] flex rotate-[-8deg] gap-3">
          {cols.map((c, i) => (
            <WallColumn key={i} imgs={c} reverse={i % 2 === 1} />
          ))}
        </div>
      </div>
      {/* Legibility scrim - strong behind copy, clears at the edges so pages show */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_72%_64%_at_50%_40%,rgba(14,13,12,0.94),rgba(14,13,12,0.78)_52%,rgba(14,13,12,0.45)_78%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-linear-to-b from-transparent to-[#FBFAF7]"
      />

      <MarketingContainer>
        <div className="relative z-10 mx-auto max-w-2xl pb-48 text-center md:pb-60">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex flex-wrap items-center justify-center gap-1.5 text-sm"
            >
              {breadcrumbs.map((c, i) => (
                <span key={c.url} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-zinc-600">/</span>}
                  {i < breadcrumbs.length - 1 ? (
                    <Link
                      href={new URL(c.url).pathname}
                      className="text-zinc-400 transition-colors hover:text-zinc-200"
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
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur">
              <span className="inline-block size-1.5 rounded-full bg-[#FF7A5C]" />
              {eyebrow}
            </p>
          )}
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white text-balance md:text-5xl">
            {h1}
          </h1>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg text-zinc-300 text-pretty">
            {answer}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="xl"
              className="rounded-full bg-white font-bold text-zinc-900 hover:bg-zinc-100"
            >
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="xl"
              className="rounded-full font-semibold text-white hover:bg-white/10"
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
