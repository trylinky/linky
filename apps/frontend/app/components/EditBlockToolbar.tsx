'use client';

import { PageConfig } from '@/app/[domain]/[slug]/grid';
import { useEditModeContext } from '@/app/contexts/Edit';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { captureException } from '@sentry/nextjs';
import { Blocks } from '@trylinky/blocks';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { useSidebar, useToast } from '@trylinky/ui';
import { useParams, useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';

interface Props {
  blockId: string;
  blockType: Blocks;
}

export function EditBlockToolbar({ blockId, blockType }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;
  const { setOpen, setOpenMobile, setSidebarView } = useSidebar();

  const { setCurrentEditingBlock } = useEditModeContext();

  const { cache } = useSWRConfig();

  const pageId = cache.get(`pageId`);

  const { mutate } = useSWR(`/blocks/${blockId}`, internalApiFetcher);
  const { data: layout, mutate: mutateLayout } = useSWR<PageConfig>(
    `/pages/${pageId}/layout`,
    internalApiFetcher
  );

  const handleDeleteBlock = async (blockId: string, blockType: Blocks) => {
    if (blockType === 'header') {
      toast({
        variant: 'error',
        title: 'You cannot delete the header block',
      });
      return;
    }

    try {
      const response = await InternalApi.delete(`/blocks/${blockId}`);

      if (response.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: response.error.message,
        });
        return;
      }

      mutate();

      if (layout) {
        const newSmLayout = layout.sm.filter((item) => {
          return item.i !== blockId;
        });
        const newXxsLayout = layout.xxs.filter((item) => {
          return item.i !== blockId;
        });

        mutateLayout({
          xxs: newXxsLayout,
          sm: newSmLayout,
        });
      }

      router.refresh();

      toast({
        title: 'Block deleted',
      });
    } catch (error) {
      captureException(error);
      toast({
        variant: 'error',
        title: "We couldn't delete the block",
      });
    }
  };
  return (
    <>
      <span className="isolate inline-flex rounded-full shadow-md z-40 absolute top-2 right-2 block-toolbar">
        <button
          type="button"
          className="relative inline-flex items-center rounded-l-full bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-stone-100 focus:z-10"
          onTouchStart={() => {
            setOpen(true);
            setOpenMobile(true);
            setSidebarView('blockForm');
            setCurrentEditingBlock({ id: blockId, type: blockType });
          }}
          onClick={() => {
            setOpen(true);
            setOpenMobile(true);
            setSidebarView('blockForm');
            setCurrentEditingBlock({ id: blockId, type: blockType });
          }}
        >
          <PencilSquareIcon width={16} height={16} className="text-slate-700" />
        </button>
        <button
          type="button"
          className="relative -ml-px inline-flex items-center rounded-r-full bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-stone-100 focus:z-10"
          disabled={blockType === 'header'}
          onClick={() => handleDeleteBlock(blockId, blockType)}
          onTouchStart={() => handleDeleteBlock(blockId, blockType)}
        >
          <TrashIcon width={16} height={16} className="text-slate-700" />
        </button>
      </span>
    </>
  );
}
