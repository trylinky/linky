import { EditPageSettingsGeneral } from '@/app/components/EditPageSettingsDialog/EditPageSettingsGeneralForm';
import { internalApiFetcher } from '@trylinky/common';
import { type PageModel } from '@trylinky/prisma/types';
import {
  SidebarContentHeader,
  SidebarGroup,
  SidebarGroupContent,
} from '@trylinky/ui';
import useSWR, { useSWRConfig } from 'swr';

export function SidebarPageSettings() {
  const { cache } = useSWRConfig();

  const pageId = cache.get('pageId');

  const { data: pageSettings } = useSWR<Partial<PageModel>>(
    `/pages/${pageId}/settings`,
    internalApiFetcher
  );

  return (
    <>
      <SidebarContentHeader title="Settings"></SidebarContentHeader>

      <SidebarGroup>
        <SidebarGroupContent>
          <EditPageSettingsGeneral
            initialValues={{
              metaTitle: pageSettings?.metaTitle ?? '',
              pageSlug: pageSettings?.slug ?? '',
              published: pageSettings?.publishedAt ? true : false,
            }}
            pageId={pageSettings?.id ?? ''}
          />
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
