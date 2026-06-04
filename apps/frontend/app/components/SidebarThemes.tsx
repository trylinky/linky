import { RenderThemeStyle } from '@/app/[domain]/[slug]/render-page-theme';
import { CreateEditThemeForm } from '@/app/components/EditPageSettingsDialog/CreateNewTheme';
import { PageThemePreview } from '@/app/components/PageThemePreview';
import { setPageTheme } from '@/app/lib/actions/themes';
import { getGoogleFontUrl } from '@/lib/fonts';
import { internalApiFetcher } from '@trylinky/common';
import { Theme } from '@trylinky/prisma';
import { toast } from '@trylinky/ui';
import * as Catalyst from '@trylinky/ui/catalyst';
import { Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';

export function SidebarThemes() {
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);
  const { data: currentTeamThemes } = useSWR<Theme[]>(
    '/themes/me/team',
    internalApiFetcher
  );

  const params = useParams();

  const { cache, mutate } = useSWRConfig();
  const pageId = cache.get('pageId');

  const [editThemeId, setEditThemeId] = useState<string | null>(null);
  const [showCreateNewTheme, setShowCreateNewTheme] = useState(false);

  const previewThemeValues = currentTeamThemes?.find(
    (theme) => theme.id === previewTheme
  );

  // Load the font if specified in the preview theme
  useEffect(() => {
    if (previewThemeValues?.font) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = getGoogleFontUrl(previewThemeValues.font);
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [previewThemeValues?.font]);

  const handleSetPageTheme = async (themeId: string) => {
    if (!params.slug) {
      return;
    }

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
  };

  return (
    <>
      {editThemeId || (showCreateNewTheme && !editThemeId) ? (
        <div>
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
      ) : (
        <div>
          <Catalyst.Button
            outline
            className="mb-4 w-full"
            onClick={() => {
              setShowCreateNewTheme(true);
            }}
          >
            <Plus size={16} />
            <span>Create theme</span>
          </Catalyst.Button>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {currentTeamThemes?.map((theme) => {
              return (
                <div className="flex flex-col gap-1" key={theme.id}>
                  <button
                    onClick={() => {
                      setEditThemeId(null);
                      setShowCreateNewTheme(false);
                      handleSetPageTheme(theme.id);
                    }}
                    onMouseEnter={() => setPreviewTheme(theme.id)}
                    onMouseLeave={() => setPreviewTheme(null)}
                  >
                    <PageThemePreview themeValues={theme} />
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-800">
                      {theme.name}
                    </span>
                    {!theme.isDefault && (
                      <Catalyst.Button
                        type="button"
                        plain
                        className="px-0 text-xs text-indigo-600"
                        onClick={() => {
                          setEditThemeId(theme.id);
                        }}
                      >
                        Edit
                      </Catalyst.Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {previewTheme &&
        previewThemeValues &&
        !showCreateNewTheme &&
        !editThemeId && (
          <RenderThemeStyle theme={previewThemeValues} important={true} />
        )}
    </>
  );
}
