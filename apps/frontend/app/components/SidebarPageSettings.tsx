import { EditPageSettingsGeneral } from '@/app/components/EditPageSettingsDialog/EditPageSettingsGeneralForm';
import { internalApiFetcher } from '@trylinky/common';
import { Page } from '@trylinky/prisma';
import useSWR, { useSWRConfig } from 'swr';

export function SidebarPageSettings() {
  const { cache } = useSWRConfig();

  const pageId = cache.get('pageId');

  const { data: pageSettings } = useSWR<Partial<Page>>(
    `/pages/${pageId}/settings`,
    internalApiFetcher
  );

  return (
    <EditPageSettingsGeneral
      initialValues={{
        metaTitle: pageSettings?.metaTitle ?? '',
        pageSlug: pageSettings?.slug ?? '',
        published: pageSettings?.publishedAt ? true : false,
      }}
      pageId={pageSettings?.id ?? ''}
    />
  );
}
