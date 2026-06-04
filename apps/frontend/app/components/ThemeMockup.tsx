import { getFontFamilyValue } from '@/lib/fonts';
import { themeColorToCssValue } from '@/lib/theme';
import { Theme } from '@trylinky/prisma';
import { CSSProperties } from 'react';

/**
 * Renders a representative mini page mockup styled with a single theme's tokens.
 *
 * The theme's color tokens become `--color-sys-*` CSS variables (matching the
 * approach in render-page-theme.tsx) scoped to this component's wrapper, plus a
 * `--font-sys-body` variable for the theme font. All inner content reads from
 * those scoped variables, so many mockups can render side by side, each with its
 * own theme, without leaking tokens to the rest of the page.
 */
export function ThemeMockup({ theme }: { theme: Partial<Theme> }) {
  const fontFamily = theme.font ? getFontFamilyValue(theme.font) : undefined;
  const hasBackgroundImage = !!theme.backgroundImage;

  // Scope the theme tokens to this wrapper only.
  const scopedVars = {
    '--color-sys-bg-base': themeColorToCssValue(theme.colorBgBase),
    '--color-sys-bg-primary': themeColorToCssValue(theme.colorBgPrimary),
    '--color-sys-bg-secondary': themeColorToCssValue(theme.colorBgSecondary),
    '--color-sys-bg-border': themeColorToCssValue(theme.colorBorderPrimary),
    '--color-sys-label-primary': themeColorToCssValue(theme.colorLabelPrimary),
    '--color-sys-label-secondary': themeColorToCssValue(
      theme.colorLabelSecondary
    ),
    '--color-sys-title-primary': themeColorToCssValue(
      theme.colorTitlePrimary ?? theme.colorLabelPrimary
    ),
    '--color-sys-title-secondary': themeColorToCssValue(
      theme.colorTitleSecondary ?? theme.colorLabelSecondary
    ),
    '--font-sys-body': fontFamily || 'inherit',
  } as CSSProperties;

  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden"
      style={{
        ...scopedVars,
        backgroundColor: 'hsl(var(--color-sys-bg-base))',
        fontFamily: 'var(--font-sys-body)',
        backgroundImage: hasBackgroundImage
          ? `url(${theme.backgroundImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex h-full flex-col items-center gap-3 px-5 pt-8">
        {/* Avatar */}
        <div
          className="h-12 w-12 rounded-full shadow-sm ring-2 ring-black/5"
          style={{ backgroundColor: 'hsl(var(--color-sys-bg-primary))' }}
        />

        {/* Handle / title */}
        <div
          className="text-sm font-semibold"
          style={{ color: 'hsl(var(--color-sys-title-primary))' }}
        >
          @handle
        </div>

        {/* Subtitle */}
        <div
          className="-mt-1 text-[10px]"
          style={{ color: 'hsl(var(--color-sys-label-secondary))' }}
        >
          Your bio goes here
        </div>

        {/* Block-like cards */}
        <div className="mt-2 flex w-full flex-col gap-2.5">
          <MockBlock lines={1} />
          <MockBlock lines={2} />
          <MockBlock lines={1} />
        </div>
      </div>
    </div>
  );
}

function MockBlock({ lines }: { lines: number }) {
  return (
    <div
      className="rounded-lg p-3 shadow-sm"
      style={{
        backgroundColor: 'hsl(var(--color-sys-bg-primary))',
        border: '1px solid hsl(var(--color-sys-bg-border))',
      }}
    >
      <div
        className="h-2 w-1/2 rounded-full"
        style={{ backgroundColor: 'hsl(var(--color-sys-label-primary))' }}
      />
      {lines > 1 && (
        <div
          className="mt-1.5 h-1.5 w-3/4 rounded-full opacity-70"
          style={{ backgroundColor: 'hsl(var(--color-sys-label-secondary))' }}
        />
      )}
    </div>
  );
}
