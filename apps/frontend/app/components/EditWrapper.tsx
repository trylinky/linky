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
  useRef,
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
  }, [layout]);

  useEffect(() => {
    if (nextToAddBlock) {
      handleAddNewBlock([], nextToAddBlock, null, true);
    }
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

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleLayoutChange = (newLayout: Layout[], _currentLayouts: Layouts) => {
    if (newLayout.length === 0 || !layout) return;
    if (newLayout.some((block) => block.i === 'tmp-block')) return;

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

    const sortedNewLayout = JSON.stringify(sortAndNormalizeLayout(newLayout));
    const sortedLayout = JSON.stringify(
      sortAndNormalizeLayout(
        editLayoutMode === 'mobile' ? layout.xxs : layout.sm
      )
    );

    if (sortedNewLayout === sortedLayout) return;

    const nextLayout = {
      xxs: editLayoutMode === 'mobile' ? newLayout : layout.xxs,
      sm: editLayoutMode === 'desktop' ? newLayout : layout.sm,
    };

    if (newLayout.length !== (layout.xxs.length || layout.sm.length)) {
      const difference = newLayout.filter((item) => {
        if (editLayoutMode === 'mobile') {
          return !layout.xxs.some((item2) => item2.i === item.i);
        }
        return !layout.sm.some((item2) => item2.i === item.i);
      });

      if (difference.length === 1) {
        if (editLayoutMode === 'mobile') {
          nextLayout.sm.push(difference[0]);
        } else {
          nextLayout.xxs.push(difference[0]);
        }
      }
    }

    // Update the cache immediately so react-grid-layout keeps the user's
    // new positions on the next render and doesn't snap back while we wait
    // to save.
    mutateLayout(nextLayout, { revalidate: false });

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const response = await InternalApi.post(`/pages/${pageId}/layout`, {
          newLayout: nextLayout,
        });

        if (response.error) {
          toast({
            variant: 'error',
            title: 'Something went wrong',
            description: response.error.message,
          });
          return;
        }

        // Reconcile with the server's canonical layout, but keep the
        // existing values if the response is missing them so we don't
        // clobber the optimistic update with undefined.
        mutateLayout(
          (current) => ({
            sm: response.sm ?? current?.sm ?? nextLayout.sm,
            xxs: response.xxs ?? current?.xxs ?? nextLayout.xxs,
          }),
          { revalidate: false }
        );
      } catch (error) {
        captureException(error);
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: "We couldn't update your page layout",
        });
      }
    }, 500);
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
