import {
  GithubCommitsThisMonthMockup,
  ImageMockup,
  InstagramLatestPostMockup,
  LinkBoxMockup,
  SpotifyPlayingNowMockup,
  StackMockup,
} from '@/components/landing-page/ui-mockups';
import { MarketingContainer } from '@/components/marketing-container';
import { JsonValue } from '@prisma/client/runtime/library';

export type HSLColor = {
  h: number;
  s: number;
  l: number;
};

export const defaultThemeSeeds: Record<string, any> = {
  Default: {
    id: '00441c91-6762-44d8-8110-2b5616825bd9',
    colorBgBase: { h: 60, l: 0.96, s: 0.0476 },
    colorBgPrimary: { h: 0, l: 1, s: 0 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 0, l: 0.9176, s: 0 },
    colorLabelPrimary: { h: 240, l: 0.1137, s: 0.0345 },
    colorLabelSecondary: { h: 0, l: 0.16, s: 0 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Purple: {
    id: '14fc9bdf-f363-4404-b05e-856670722fda',
    colorBgBase: { h: 255.48, l: 0.202, s: 0.301 },
    colorBgPrimary: { h: 255, l: 0.135, s: 0.29 },
    colorBgSecondary: { h: 0, l: 0, s: 0 },
    colorBorderPrimary: { h: 253.55, l: 0.2837, s: 0.1969 },
    colorLabelPrimary: { h: 0, l: 100, s: 0 },
    colorLabelSecondary: { h: 293.33, l: 0.7627, s: 0.0744 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Black: {
    id: '1e24ab02-9b97-4a61-9b83-fe278a41b30b',
    colorBgBase: { h: 0, l: 0, s: 0 },
    colorBgPrimary: { h: 0, l: 0, s: 0 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 0, l: 0.1607, s: 0 },
    colorLabelPrimary: { h: 0, l: 1, s: 0 },
    colorLabelSecondary: { h: 0, l: 0.9804, s: 0 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Forest: {
    id: '4c47b21f-9183-4e7a-be6c-6ee4fabae92a',
    colorBgBase: { h: 141.18, l: 0.41, s: 0.0813 },
    colorBgPrimary: { h: 140, l: 0.31, s: 0.0988 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 140, l: 0.31, s: 0.0988 },
    colorLabelPrimary: { h: 0, l: 100, s: 0 },
    colorLabelSecondary: { h: 141.18, l: 0.8392, s: 0.4146 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Lilac: {
    id: '0192b479-69c1-7bb4-936d-26f9e3a2024f',
    colorBgBase: { a: 1, h: 244.86, l: 0.85, s: 1 },
    colorBgPrimary: { h: 244.86, l: 0.92, s: 0.91 },
    colorBgSecondary: { h: 0, l: 0, s: 0 },
    colorBorderPrimary: { h: 244.86, l: 0.76, s: 0.48 },
    colorLabelPrimary: { h: 250.0, l: 0.18, s: 0.32 },
    colorLabelSecondary: { h: 250.0, l: 0.18, s: 0.32 },
    colorLabelTertiary: { h: 250.0, l: 0.18, s: 0.32 },
  },
  OrangePunch: {
    id: '44ddcc5a-aa85-45b9-b333-3ddcbe7d7db3',
    colorBgBase: { h: 226.15, l: 0.1, s: 0.48 },
    colorBgPrimary: { h: 13.5, l: 0.53, s: 0.67 },
    colorBgSecondary: { h: 33.3, l: 0.48, s: 0.95 },
    colorBorderPrimary: { h: 226.15, l: 0.1, s: 0.48 },
    colorLabelPrimary: { h: 144, l: 0.69, s: 0.78 },
    colorLabelSecondary: { h: 144, l: 0.97, s: 0.76 },
    colorLabelTertiary: { h: 144, l: 0.98, s: 0 },
  },
};

export const themeColorToCssValue = (color?: JsonValue): string => {
  if (!color) return '';
  const colorAsHsl = color as HSLColor;
  return `${colorAsHsl.h}deg ${colorAsHsl.s * 100}% ${colorAsHsl.l * 100}%`;
};

export function BlocksGrid() {
  return (
    <section className="py-20 bg-white">
      <MarketingContainer>
        <h2 className="text-4xl font-bold text-center tracking-tight text-gray-900">
          Beautifully designed blocks
        </h2>
        <p className="text-base md:text-lg text-pretty text-center">
          Use our drag-and-drop builder to create your page.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-8 mt-8 md:mt-16">
          <div className="col-span-1 md:col-span-2 flex flex-col justify-start gap-4 md:gap-8">
            <div className="hidden md:block w-full h-24 bg-[#dddace] rounded-3xl" />
            <GithubCommitsThisMonthMockup className="h-32 md:h-32 w-full md:w-[calc(100%+2rem)] md:-ml-8" />
            <StackMockup className="h-60 md:h-80" />
          </div>
          <div className="col-span-1 md:col-span-3 flex flex-col justify-start gap-4 md:gap-8">
            <InstagramLatestPostMockup className="h-80" />
            <LinkBoxMockup variant="instagram" className="h-24" />
          </div>
          <div className="col-span-1 md:col-span-2 flex flex-col justify-start gap-4 md:gap-8">
            <SpotifyPlayingNowMockup className="h-32" />
            <ImageMockup className="h-56 w-full md:w-[calc(100%+2rem)] md:ml-0" />
            <div className="hidden md:block w-full h-24 bg-[#dddace] rounded-3xl" />
          </div>
        </div>
      </MarketingContainer>
      <style>
        {`:root {
          --color-sys-bg-base: ${themeColorToCssValue(defaultThemeSeeds.Default.colorBgBase)};
          --color-sys-bg-primary: ${themeColorToCssValue(defaultThemeSeeds.Default.colorBgPrimary)};
          --color-sys-bg-secondary: ${themeColorToCssValue(defaultThemeSeeds.Default.colorBgSecondary)};
          --color-sys-bg-border: 0deg 0% 84.73%;
          
          --color-sys-label-primary: ${themeColorToCssValue(defaultThemeSeeds.Default.colorLabelPrimary)};
          --color-sys-label-secondary: ${themeColorToCssValue(defaultThemeSeeds.Default.colorLabelSecondary)};
          }`}
      </style>
    </section>
  );
}
