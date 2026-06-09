import analyticsImg from '@/assets/landing-page/analytics.png';
import realtimeBlocksImg from '@/assets/landing-page/realtime-blocks.png';
import previewA from '@/assets/landing-page/previews/3.png';
import previewB from '@/assets/landing-page/previews/9.png';
import {
  GithubCommitsThisMonthMockup,
  InstagramLatestPostMockup,
  LinkBoxMockup,
  SpotifyPlayingNowMockup,
} from '@/components/landing-page/ui-mockups';
import { ExpandableText } from '@/components/pseo/expandable-text';
import { MarketingContainer } from '@/components/marketing-container';
import type { ContentSection } from '@/content/pseo-types';
import { templates } from '@/content/templates';
import { cn } from '@trylinky/ui';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { ThemeMock, type ThemePalette } from './theme-mock';

export type SectionVisual =
  | 'themes'
  | 'blocks'
  | 'analytics'
  | 'editor'
  | 'page'
  | 'social';

const TONES = ['#FFFFFF', '#FBFAF7', '#F4F0E7'] as const;
const TONES_MINIMAL = ['#FFFFFF', '#FAFAF9'] as const;

const paletteBySlug = (slug: string): ThemePalette =>
  (templates.find((t) => t.slug === slug) ?? templates[0]).palette;

function Halo() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(232,85,63,0.12),transparent_70%)] blur-2xl"
    />
  );
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 text-center text-sm font-medium text-zinc-500">
      {children}
    </p>
  );
}

function FramedShot({
  src,
  alt,
}: {
  src: StaticImageData;
  alt: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-3 ring-1 ring-black/5 shadow-xl shadow-zinc-900/10">
      <Image
        src={src}
        alt={alt}
        width={852}
        height={590}
        className="h-auto w-full rounded-xl ring-1 ring-black/5"
      />
    </div>
  );
}

function PhoneMini({ shot }: { shot: StaticImageData }) {
  return (
    <div className="mx-auto w-full max-w-[250px] rounded-[2.2rem] bg-zinc-950 p-2 shadow-2xl shadow-zinc-900/25 ring-1 ring-black/10">
      <div className="overflow-hidden rounded-[1.7rem] bg-white">
        <Image src={shot} alt="A live Linky page" width={1170} height={2532} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

/** Each recipe renders a self-contained supporting visual + caption. */
function Visual({
  kind,
  palette,
  minimal = false,
}: {
  kind: SectionVisual;
  palette?: ThemePalette;
  minimal?: boolean;
}) {
  const halo = minimal ? null : <Halo />;
  switch (kind) {
    case 'themes': {
      const front = palette ?? paletteBySlug('lilac');
      const back = paletteBySlug('violet');
      return (
        <figure className="relative">
          {halo}
          <div className="flex items-center justify-center">
            <div className="w-40 -mr-6 rotate-[-6deg] overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-xl">
              <ThemeMock palette={back} name="Jordan" size="thumb" />
            </div>
            <div className="relative z-10 w-48 rotate-[4deg] overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-2xl">
              <ThemeMock palette={front} name="Your page" size="thumb" />
            </div>
          </div>
          <Caption>Your theme, your colours</Caption>
        </figure>
      );
    }
    case 'blocks':
      return (
        <figure className="relative">
          {halo}
          <div className="mx-auto flex max-w-sm flex-col gap-3">
            <SpotifyPlayingNowMockup className="shadow-lg" />
            <GithubCommitsThisMonthMockup className="shadow-lg" />
          </div>
          <Caption>Live blocks that refresh automatically</Caption>
        </figure>
      );
    case 'analytics':
      return (
        <figure className="relative">
          {halo}
          <FramedShot src={analyticsImg} alt="Linky analytics dashboard" />
          <Caption>Built-in analytics on every page</Caption>
        </figure>
      );
    case 'editor':
      return (
        <figure className="relative">
          {halo}
          <FramedShot src={realtimeBlocksImg} alt="Real-time content blocks" />
          <Caption>Rich, real-time content blocks</Caption>
        </figure>
      );
    case 'page':
      return (
        <figure className="relative">
          {halo}
          <PhoneMini shot={previewA} />
          <Caption>A real Linky page</Caption>
        </figure>
      );
    case 'social':
      return (
        <figure className="relative">
          {halo}
          <div className="mx-auto flex max-w-sm flex-col gap-3">
            <LinkBoxMockup variant="instagram" className="shadow-md" />
            <LinkBoxMockup variant="x" className="shadow-md" />
            <InstagramLatestPostMockup className="shadow-lg" />
          </div>
          <Caption>Bring all your socials together</Caption>
        </figure>
      );
  }
}

const DEFAULT_RECIPES: SectionVisual[] = [
  'page',
  'blocks',
  'themes',
  'analytics',
  'social',
  'editor',
];

export function PseoFeatureSections({
  sections,
  /** Visual ordering, cycled across sections. Override per page type. */
  recipes = DEFAULT_RECIPES,
  /** Real palette to feature in the 'themes' visual (e.g. the current template). */
  palette,
  /** Clean monochrome styling - no coral halos/eyebrows, neutral tones. */
  minimal = false,
}: {
  sections: ContentSection[];
  recipes?: SectionVisual[];
  palette?: ThemePalette;
  minimal?: boolean;
}) {
  const tones = minimal ? TONES_MINIMAL : TONES;
  return (
    <>
      {sections.map((section, i) => {
        const tone = tones[i % tones.length];
        const visualLeft = i % 2 === 1;
        const kind = recipes[i % recipes.length];
        const visual = (
          <div className="flex justify-center">
            <Visual kind={kind} palette={palette} minimal={minimal} />
          </div>
        );
        const text = (
          <div>
            <p
              className={cn(
                'text-sm font-semibold',
                minimal ? 'text-zinc-300' : 'text-[#E8553F]'
              )}
            >
              {String(i + 1).padStart(2, '0')}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 text-balance md:text-3xl">
              {section.heading}
            </h2>
            <ExpandableText
              className="mt-5 max-w-[54ch] text-lg leading-8 text-zinc-600 text-pretty"
              accentClass={minimal ? 'text-zinc-900' : 'text-[#E8553F]'}
            >
              {section.body}
            </ExpandableText>
          </div>
        );

        return (
          <section
            key={i}
            className="py-16 md:py-24"
            style={{ backgroundColor: tone }}
          >
            <MarketingContainer>
              <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                {visualLeft ? (
                  <>
                    <div className="order-last md:order-first">{visual}</div>
                    {text}
                  </>
                ) : (
                  <>
                    {text}
                    {visual}
                  </>
                )}
              </div>
            </MarketingContainer>
          </section>
        );
      })}
    </>
  );
}
