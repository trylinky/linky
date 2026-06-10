'use client';

import { defaultThemeSeeds, themeColorToCssValue } from '@/lib/theme';

interface PagePreviewProps {
  pageSlug: string;
  themeId: string;
}

export function PagePreview({ pageSlug, themeId }: PagePreviewProps) {
  const theme =
    Object.values(defaultThemeSeeds).find((t) => t.id === themeId) ||
    defaultThemeSeeds.Default;

  const color = (key: string) => `hsl(${themeColorToCssValue(theme[key])})`;
  const initial = pageSlug ? pageSlug.charAt(0).toUpperCase() : null;

  return (
    <div className="relative flex size-full flex-col items-center justify-center gap-5 overflow-hidden bg-slate-100 p-6 dark:bg-slate-900">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle,rgb(15_23_42/0.07)_1px,transparent_1px)] bg-[size:18px_18px] dark:bg-[radial-gradient(circle,rgb(255_255_255/0.08)_1px,transparent_1px)]"
      />

      <div className="relative flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        Live preview
      </div>

      <div
        className="relative aspect-9/16 w-full max-w-[210px] overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/10"
        style={{ backgroundColor: color('colorBgBase') }}
      >
        <div className="flex h-full flex-col items-center px-4 pt-8">
          <div
            className={`flex size-14 items-center justify-center rounded-full text-xl font-semibold ${
              initial ? '' : 'animate-pulse opacity-20'
            }`}
            style={{
              backgroundColor: color('colorLabelPrimary'),
              color: color('colorBgBase'),
            }}
          >
            {initial}
          </div>

          {pageSlug ? (
            <div
              className="mt-3 w-full truncate text-center text-sm font-semibold"
              style={{ color: color('colorLabelPrimary') }}
            >
              @{pageSlug}
            </div>
          ) : (
            <div
              className="mt-4 h-2.5 w-20 rounded-full opacity-40"
              style={{ backgroundColor: color('colorLabelPrimary') }}
            />
          )}
          <div
            className="mt-2 h-2 w-28 rounded-full opacity-30"
            style={{ backgroundColor: color('colorLabelSecondary') }}
          />

          <div className="mt-6 flex w-full flex-col gap-2">
            {(['w-16', 'w-24', 'w-20'] as const).map((width, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg p-2.5 shadow-xs"
                style={{ backgroundColor: color('colorBgPrimary') }}
              >
                <div
                  className="size-4 shrink-0 rounded-full opacity-80"
                  style={{ backgroundColor: color('colorLabelPrimary') }}
                />
                <div
                  className={`h-2 ${width} rounded-full opacity-50`}
                  style={{ backgroundColor: color('colorLabelSecondary') }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative max-w-full truncate rounded-full bg-white px-3.5 py-1.5 font-mono text-sm shadow-xs ring-1 ring-slate-900/10 dark:bg-slate-950 dark:ring-white/10">
        <span className="text-slate-400 dark:text-slate-500">lin.ky/</span>
        <span className="font-semibold text-slate-900 dark:text-white">
          {pageSlug || 'your_name'}
        </span>
      </div>
    </div>
  );
}
