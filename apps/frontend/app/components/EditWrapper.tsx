'use client';

import { PageConfig } from '@/app/[domain]/[slug]/grid';
import { useEditModeContext } from '@/app/contexts/Edit';
import { CoreBlock } from '@/components/CoreBlock';
import { enableDragDropTouch } from '@/lib/polyfills/drag-drop-touch.esm.min.js';
import { captureException } from '@sentry/nextjs';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { Skeleton, useToast, cn } from '@trylinky/ui';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactNode,
  useEffect,
  useMemo,
  useOptimistic,
  useTransition,
} from 'react';
import {
  Layout,
  Layouts,
  Responsive,
  ResponsiveProps,
  WidthProvider,
} from 'react-grid-layout';
import useSWR, { useSWRConfig } from 'swr';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  children: ReactNode[];
  layoutProps: ResponsiveProps;
}

// Enable touch support for drag and drop
enableDragDropTouch();
export function EditWrapper({ children, layoutProps }: Props) {
  const { draggingItem, editLayoutMode, nextToAddBlock } = useEditModeContext();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const { cache } = useSWRConfig();

  const pageId = cache.get(`pageId`);

  const { data: layout, mutate: mutateLayout } = useSWR<PageConfig>(
    `/pages/${pageId}/layout`,
    internalApiFetcher
  );

  const [isPending, startTransition] = useTransition();

  const ResponsiveReactGridLayout = useMemo(
    () => WidthProvider(Responsive),
    []
  );

  const [optimisticItems, setOptimisticItems] =
    useOptimistic<ReactNode[]>(children);

  useEffect(() => {
    if (!optimisticItems) return;

    const filteredItems = (optimisticItems as ReactNode[])?.filter(
      (item: any) => {
        return layout?.sm?.some((layoutItem) => layoutItem.i === item.key);
      }
    );

    startTransition(() => {
      setOptimisticItems(filteredItems);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  useEffect(() => {
    if (nextToAddBlock) {
      handleAddNewBlock([], nextToAddBlock, null, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextToAddBlock]);

  const handleAddNewBlock = async (
    newLayout: Layout[],
    layoutItem: any,
    _event: Event | null,
    isMobile?: boolean
  ) => {
    // Get the last item from the newLayout
    const lastItem = layoutItem;

    const newItemId = uuidv4();

    const newItemConfig: Layout = {
      h: isMobile ? layoutItem.h : draggingItem.h,
      i: newItemId,
      w: isMobile ? layoutItem.w : draggingItem.w,
      x: isMobile ? 0 : lastItem.x,
      y: isMobile ? 0 : lastItem.y - 1,
      minW: 4,
      minH: 2,
    };

    startTransition(async () => {
      setOptimisticItems([
        ...optimisticItems,
        <div key={newItemId} data-grid={newItemConfig} className="w-full h-14">
          <CoreBlock
            blockId={newItemId}
            blockType="default"
            pageId="tmp-unknown"
            isEditable={false}
          >
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
          </CoreBlock>
        </div>,
      ]);

      const response = await InternalApi.post('/blocks/add', {
        block: {
          id: newItemId,
          type: isMobile ? layoutItem.type : draggingItem.type,
        },
        pageSlug: params.slug,
      });

      if (response.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: response.error.message,
        });
        return;
      }

      // Refresh the current route and fetch new data from the server without
      // losing client-side browser or React state.
      router.refresh();
    });
  };

  // Function to handle layout changes
  const handleLayoutChange = async (
    newLayout: Layout[],
    currentLayouts: Layouts
  ) => {
    // If the new layout is empty or there's no existing layout, exit early
    if (newLayout.length === 0 || !layout) {
      return;
    }

    // Helper function to sort and normalize layout for comparison
    const sortAndNormalizeLayout = (layout: Layout[]) => {
      return layout
        .sort((a, b) => a.i.localeCompare(b.i))
        .map((obj) =>
          Object.keys(obj)
            .sort()
            .reduce((result: Layout, key: string) => {
              // @ts-ignore
              result[key] = obj[key];
              return result;
            }, {} as Layout)
        );
    };

    // Stringify sorted layouts for comparison
    const sortedNewLayout = JSON.stringify(sortAndNormalizeLayout(newLayout));
    const sortedLayout = JSON.stringify(
      sortAndNormalizeLayout(
        editLayoutMode === 'mobile' ? layout.xxs : layout.sm
      )
    );

    // If layouts are the same, no need to update
    if (sortedNewLayout === sortedLayout) {
      return;
    }

    // If there's a temporary block, exit early
    if (newLayout.some((block) => block.i === 'tmp-block')) {
      return;
    }

    // Prepare the next layout based on the edit mode
    const nextLayout = {
      xxs: editLayoutMode === 'mobile' ? newLayout : layout.xxs,
      sm: editLayoutMode === 'desktop' ? newLayout : layout.sm,
    };

    // Handle cases where a new block might have been added
    if (newLayout.length !== (layout.xxs.length || layout.sm.length)) {
      // Find the new block
      const difference = newLayout.filter((item) => {
        if (editLayoutMode === 'mobile') {
          return !layout.xxs.some((item2) => item2.i === item.i);
        }
        return !layout.sm.some((item2) => item2.i === item.i);
      });

      // If there's exactly one new block, add it to the other layout
      if (difference.length === 1) {
        if (editLayoutMode === 'mobile') {
          nextLayout.sm.push(difference[0]);
        } else {
          nextLayout.xxs.push(difference[0]);
        }
      }
    }

    try {
      const response = await InternalApi.post(`/pages/${pageId}/layout`, {
        newLayout: nextLayout,
      });

      // Handle server-side errors
      if (response.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: response.error.message,
        });
        return;
      }

      // Update the layout in the client-side cache
      mutateLayout(nextLayout);
    } catch (error) {
      captureException(error);
      toast({
        variant: 'error',
        title: 'Something went wrong',
        description: "We couldn't update your page layout",
      });
    }
  };

  const editableLayoutProps: ResponsiveProps = {
    ...layoutProps,
    onDrop: handleAddNewBlock,
    onLayoutChange: handleLayoutChange,
    droppingItem: draggingItem,
    draggableCancel: '.noDrag',
    useCSSTransforms: true,
    resizeHandles: ['se'],
  };

  return (
    <>
      <div
        className={cn(
          'min-h-screen bg-black/0 transition-colors hover:bg-black/5 w-full mx-auto pb-24 md:pb-0',
          editLayoutMode === 'mobile' ? 'max-w-[400px]' : 'max-w-[624px]'
        )}
      >
        <ResponsiveReactGridLayout
          {...editableLayoutProps}
          className="!overflow-auto w-full min-h-[100vh]"
          layouts={{
            lg: layout?.sm ?? [],
            md: layout?.sm ?? [],
            sm: layout?.sm ?? [],
            xs: layout?.sm ?? [],
            xxs: layout?.xxs ?? [],
          }}
        >
          {optimisticItems}
        </ResponsiveReactGridLayout>
      </div>
    </>
  );
}
