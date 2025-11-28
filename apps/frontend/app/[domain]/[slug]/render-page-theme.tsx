'use client';

import { getFontFamilyValue, getGoogleFontUrl } from '@/lib/fonts';
import { defaultThemeSeeds, themeColorToCssValue } from '@/lib/theme';
import { internalApiFetcher } from '@trylinky/common';
import { Theme } from '@trylinky/prisma';
import { useEffect } from 'react';
import useSWR from 'swr';

export function RenderPageTheme({ pageId }: { pageId: string }) {
  const { data: pageTheme } = useSWR<{ theme: Partial<Theme> }>(
    `/pages/${pageId}/theme`,
    internalApiFetcher
  );

  let theme = pageTheme?.theme || defaultThemeSeeds.Default;

  // Load the font if specified
  useEffect(() => {
    if (theme.font) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = getGoogleFontUrl(theme.font);
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [theme.font]);

  if (!pageTheme) return null;

  return <RenderThemeStyle theme={theme} />;
}

export function RenderThemeStyle({
  theme,
  important,
}: {
  theme: Partial<Theme>;
  important?: boolean;
}) {
  const fontFamily = theme.font ? getFontFamilyValue(theme.font) : null;
  const backgroundImage = theme.backgroundImage
    ? `url(${theme.backgroundImage})`
    : 'none';

  return (
    <style>
      {`:root {
          --color-sys-bg-base: ${themeColorToCssValue(theme.colorBgBase)} ${important ? '!important' : ''};
          --color-sys-bg-primary: ${themeColorToCssValue(theme.colorBgPrimary)} ${important ? '!important' : ''};
          --color-sys-bg-secondary: ${themeColorToCssValue(theme.colorBgSecondary)} ${important ? '!important' : ''};
          --color-sys-bg-border: ${themeColorToCssValue(theme.colorBorderPrimary)} ${important ? '!important' : ''};
          
          --color-sys-label-primary: ${themeColorToCssValue(theme.colorLabelPrimary)} ${important ? '!important' : ''};
          --color-sys-label-secondary: ${themeColorToCssValue(theme.colorLabelSecondary)} ${important ? '!important' : ''};
          
          --color-sys-title-primary: ${themeColorToCssValue(theme.colorTitlePrimary)} ${important ? '!important' : ''};
          --color-sys-title-secondary: ${themeColorToCssValue(theme.colorTitleSecondary)} ${important ? '!important' : ''};
          --font-sys-body: ${fontFamily || 'initial'};
        }
          
        .app-page {
          background-image: ${backgroundImage} ${important ? '!important' : ''};
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
        }`}
    </style>
  );
}
