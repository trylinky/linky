'use client';

import { PageThemePreview } from '@/app/components/PageThemePreview';
import { defaultThemeSeeds, themeColorToCssValue } from '@/lib/theme';
import { Theme } from '@trylinky/prisma';

interface PagePreviewProps {
  pageSlug: string;
  themeId: string;
  currentStep: number;
}

export function PagePreview({
  pageSlug,
  themeId,
  currentStep,
}: PagePreviewProps) {
  const selectedThemeObject =
    Object.values(defaultThemeSeeds).find((t) => t.id === themeId) ||
    defaultThemeSeeds.Default;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 p-4">
      <div
        className="w-full max-w-[200px] aspect-[9/16] shadow-lg rounded-xl overflow-hidden bg-white dark:bg-black"
        style={{
          backgroundColor: `hsl(${themeColorToCssValue(
            selectedThemeObject.colorBgBase
          )})`,
        }}
      >
        {currentStep === 1 && (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex flex-col items-center justify-center p-4">
            {/* Placeholder for a more generic step 1 preview */}
            <div className="w-12 h-12 bg-slate-400 dark:bg-slate-600 rounded-full mb-4"></div>
            <div className="w-3/4 h-4 bg-slate-400 dark:bg-slate-600 rounded mb-2"></div>
            <div className="w-1/2 h-4 bg-slate-400 dark:bg-slate-600 rounded"></div>
          </div>
        )}
        {currentStep === 2 && selectedThemeObject && (
          <PageThemePreview
            themeValues={selectedThemeObject as unknown as Theme}
          />
        )}
      </div>

      <p className="mt-4 text-sm font-mono text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
        lin.ky/{pageSlug}
      </p>

      {currentStep === 2 && selectedThemeObject && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Selected theme:{' '}
          {Object.keys(defaultThemeSeeds).find(
            (key) =>
              defaultThemeSeeds[key as keyof typeof defaultThemeSeeds].id ===
              themeId
          ) || 'Default'}
        </p>
      )}
    </div>
  );
}
