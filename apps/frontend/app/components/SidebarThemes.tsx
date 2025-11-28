import { RenderThemeStyle } from '@/app/[domain]/[slug]/render-page-theme';
import { CreateEditThemeForm } from '@/app/components/EditPageSettingsDialog/CreateNewTheme';
import { PageThemePreview } from '@/app/components/PageThemePreview';
import { setPageTheme } from '@/app/lib/actions/themes';
import { getGoogleFontUrl } from '@/lib/fonts';
import { internalApiFetcher } from '@trylinky/common';
import { Theme } from '@trylinky/prisma';
import {
  toast,
  SidebarContentHeader,
  SidebarGroup,
  SidebarGroupContent,
  Button,
} from '@trylinky/ui';
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
      <SidebarContentHeader title="Themes" />
      <SidebarGroup>
        {editThemeId || (showCreateNewTheme && !editThemeId) ? (
          <SidebarGroupContent className="px-2">
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
          </SidebarGroupContent>
        ) : (
          <SidebarGroupContent className="px-2">
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => {
                setShowCreateNewTheme(true);
              }}
            >
              <Plus size={16} />
              <span>Create theme</span>
            </Button>
            <div className="grid grid-cols-2 gap-4">
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
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-xs text-indigo-600 px-0"
                          onClick={() => {
                            setEditThemeId(theme.id);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SidebarGroupContent>
        )}
      </SidebarGroup>

      {previewTheme &&
        previewThemeValues &&
        !showCreateNewTheme &&
        !editThemeId && (
          <RenderThemeStyle theme={previewThemeValues} important={true} />
        )}
    </>
  );
}
