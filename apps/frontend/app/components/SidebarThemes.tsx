import { CreateEditThemeForm } from '@/app/components/EditPageSettingsDialog/CreateNewTheme';
import { ThemeMockup } from '@/app/components/ThemeMockup';
import { setPageTheme } from '@/app/lib/actions/themes';
import { getGoogleFontUrl } from '@/lib/fonts';
import { internalApiFetcher } from '@trylinky/common';
import { Theme } from '@trylinky/prisma';
import { toast } from '@trylinky/ui';
import * as Catalyst from '@trylinky/ui/catalyst';
import { Check, ChevronLeft, Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

export function SidebarThemes() {
  const { data: currentTeamThemes } = useSWR<Theme[]>(
    '/themes/me/team',
    internalApiFetcher
  );

  const params = useParams();

  const { cache, mutate } = useSWRConfig();
  const pageId = cache.get('pageId');

  const { data: currentPageTheme } = useSWR<{ theme: Partial<Theme> }>(
    pageId ? `/pages/${pageId}/theme` : null,
    internalApiFetcher
  );

  // The `/pages/:id/theme` endpoint's response schema only exposes the theme's
  // color tokens + font + backgroundImage (no `id`/`name`), so we identify the
  // currently-applied theme by matching its colour signature against the list.
  const currentThemeId = matchThemeId(
    currentPageTheme?.theme,
    currentTeamThemes
  );

  const [editThemeId, setEditThemeId] = useState<string | null>(null);
  const [showCreateNewTheme, setShowCreateNewTheme] = useState(false);
  const [applyingThemeId, setApplyingThemeId] = useState<string | null>(null);

  // Load the fonts used by the available themes so the mockups render with the
  // correct typography (matches the dynamic Google-font loading used elsewhere).
  useEffect(() => {
    const fonts = Array.from(
      new Set(
        (currentTeamThemes ?? [])
          .map((theme) => theme.font)
          .filter((font): font is string => !!font)
      )
    );

    const links = fonts.map((font) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = getGoogleFontUrl(font);
      document.head.appendChild(link);
      return link;
    });

    return () => {
      links.forEach((link) => document.head.removeChild(link));
    };
  }, [currentTeamThemes]);

  const handleSetPageTheme = async (themeId: string) => {
    if (!params.slug) {
      return;
    }

    setApplyingThemeId(themeId);

    const res = await setPageTheme(params.slug as string, themeId);

    if (res.error) {
      toast({
        title: 'Error',
        description: res.error,
      });
    } else {
      toast({
        title: 'Theme updated',
        description: 'We updated the theme for this page',
      });

      mutate(`/pages/${pageId}/theme`);
    }

    setApplyingThemeId(null);
  };

  if (editThemeId || (showCreateNewTheme && !editThemeId)) {
    const handleBack = () => {
      setEditThemeId(null);
      setShowCreateNewTheme(false);
    };

    return (
      <div>
        <div className="mb-6">
          <Catalyst.Button
            type="button"
            plain
            className="mb-2 px-0 text-sm text-stone-500 hover:text-stone-800"
            onClick={handleBack}
          >
            <ChevronLeft size={16} />
            Back to themes
          </Catalyst.Button>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {editThemeId ? 'Edit theme' : 'Create theme'}
          </h1>
        </div>

        {editThemeId && (
          <CreateEditThemeForm action="edit" editThemeId={editThemeId} />
        )}

        {showCreateNewTheme && !editThemeId && (
          <CreateEditThemeForm
            action="create"
            onCreateSuccess={(newThemeId) => {
              setShowCreateNewTheme(false);
              setEditThemeId(newThemeId);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
      {/* Create theme entry */}
      <button
        type="button"
        onClick={() => setShowCreateNewTheme(true)}
        className="group flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 text-stone-500 transition hover:border-stone-400 hover:bg-stone-50 hover:text-stone-700"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 transition group-hover:bg-stone-200">
          <Plus size={22} />
        </span>
        <span className="text-sm font-medium">Create theme</span>
      </button>

      {currentTeamThemes?.map((theme) => {
        const isCurrent = theme.id === currentThemeId;
        const isApplying = applyingThemeId === theme.id;

        return (
          <div className="flex flex-col gap-2" key={theme.id}>
            <button
              type="button"
              onClick={() => handleSetPageTheme(theme.id)}
              disabled={isApplying}
              className={`group relative block w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:shadow-md ${
                isCurrent
                  ? 'ring-2 ring-indigo-500'
                  : 'ring-1 ring-black/5 hover:ring-black/10'
              }`}
            >
              <ThemeMockup theme={theme} />

              {isCurrent && (
                <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white shadow">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}

              {!isCurrent && (
                <span className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-black/60 py-2 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition group-hover:translate-y-0 group-hover:opacity-100">
                  {isApplying ? 'Applying…' : 'Apply theme'}
                </span>
              )}
            </button>

            <div className="flex items-center justify-between px-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-stone-800">
                {theme.name}
                {isCurrent && (
                  <span className="text-xs font-normal text-indigo-600">
                    Current
                  </span>
                )}
              </span>
              {!theme.isDefault && (
                <Catalyst.Button
                  type="button"
                  plain
                  className="px-0 text-xs text-indigo-600"
                  onClick={() => setEditThemeId(theme.id)}
                >
                  Edit
                </Catalyst.Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Build a stable signature from a theme's distinguishing fields (the colour
// tokens + font + background image that the page-theme endpoint exposes).
const SIGNATURE_FIELDS: (keyof Theme)[] = [
  'colorBgBase',
  'colorBgPrimary',
  'colorBgSecondary',
  'colorBorderPrimary',
  'colorLabelPrimary',
  'colorLabelSecondary',
  'colorLabelTertiary',
];

function themeSignature(theme?: Partial<Theme> | null): string | null {
  if (!theme) return null;
  return JSON.stringify({
    font: theme.font ?? '',
    backgroundImage: theme.backgroundImage ?? '',
    colors: SIGNATURE_FIELDS.map((field) => theme[field] ?? null),
  });
}

function matchThemeId(
  current?: Partial<Theme> | null,
  themes?: Theme[]
): string | undefined {
  const target = themeSignature(current);
  if (!target || !themes) return undefined;
  return themes.find((theme) => themeSignature(theme) === target)?.id;
}
