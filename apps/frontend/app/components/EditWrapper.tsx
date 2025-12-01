'use client';

import { PageConfig } from '@/app/[domain]/[slug]/grid';
import { useEditModeContext } from '@/app/contexts/Edit';
import { addBlock } from '@/app/lib/actions/blocks-actions';
import { updatePageLayout } from '@/app/lib/actions/pages';
import { CoreBlock } from '@/components/CoreBlock';
import { enableDragDropTouch } from '@/lib/polyfills/drag-drop-touch.esm.min.js';
import { captureException } from '@sentry/nextjs';
import { internalApiFetcher } from '@trylinky/common';
import { Skeleton, useToast, cn } from '@trylinky/ui';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react';
import {
  ItemCallback,
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

  const pageId = cache.get(`pageId`) as string;

  const { data: layout, mutate: mutateLayout } = useSWR<PageConfig>(
    pageId ? `/pages/${pageId}/layout` : null,
    internalApiFetcher
  );

  // Local working layout state - this is what react-grid-layout uses for rendering
  // We only sync this to server/SWR when drag/resize ENDS, not during intermediate states
  const [workingLayout, setWorkingLayout] = useState<PageConfig | null>(null);

  // Sync working layout when SWR data changes (initial load or external updates)
  useEffect(() => {
    if (layout) {
      setWorkingLayout(layout);
    }
  }, [layout]);

  const isUpdatingLayout = useRef(false);
  const hasMounted = useRef(false);
  const hasUserInteracted = useRef(false);

  // Skip layout changes until component has fully mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      hasMounted.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
        return workingLayout?.sm?.some((layoutItem) => layoutItem.i === item.key);
      }
    );

    startTransition(() => {
      setOptimisticItems(filteredItems);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingLayout]);

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
    // Mark that user has interacted - allows layout changes to be saved
    hasUserInteracted.current = true;

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


      const response = await addBlock(
        {
          id: newItemId,
          type: isMobile ? layoutItem.type : draggingItem.type,
        },
        params.slug as string,
        {
          x: newItemConfig.x,
          y: newItemConfig.y,
          w: newItemConfig.w,
          h: newItemConfig.h,
          minW: newItemConfig.minW,
          minH: newItemConfig.minH,
        }
      );

      if ('error' in response && response.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: response.error.message,
        });
        return;
      }

      // Update working layout with the new block's position
      // The server has already saved this atomically with the block creation
      if (workingLayout) {
        const updatedLayout = {
          sm: [...(workingLayout.sm ?? []), newItemConfig],
          xxs: [...(workingLayout.xxs ?? []), newItemConfig],
        };
        setWorkingLayout(updatedLayout);
        // Also update SWR cache to keep it in sync
        mutateLayout(updatedLayout, { revalidate: false });
      }

      // Refresh the current route and fetch new data from the server without
      // losing client-side browser or React state.
      router.refresh();
    });
  };

  // Helper function to validate and filter layout
  const validateLayout = useCallback((newLayout: Layout[]): Layout[] | null => {
    // Filter out any items with invalid dimensions (0 width or 0 height)
    // Also filter out items with suspiciously small dimensions (w < minW or h < minH)
    const validLayout = newLayout.filter(
      (item) => item.w >= (item.minW ?? 1) && item.h >= (item.minH ?? 1)
    );

    // If filtering removed items, the layout is invalid
    if (validLayout.length !== newLayout.length) {
      return null;
    }

    // If there's a temporary block, layout is not ready
    if (validLayout.some((block) => block.i === 'tmp-block')) {
      return null;
    }

    return validLayout;
  }, []);

  // Function to save layout to server - only called on drag/resize END
  const saveLayoutToServer = useCallback(async (nextLayout: PageConfig) => {
    if (isUpdatingLayout.current) return;

    isUpdatingLayout.current = true;

    try {
      const response = await updatePageLayout(pageId, nextLayout);

      if ('error' in response && response.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: response.error.message,
        });
        return;
      }

      // Update SWR cache to keep it in sync
      mutateLayout(nextLayout, { revalidate: false });
    } catch (error) {
      captureException(error);
      toast({
        variant: 'error',
        title: 'Something went wrong',
        description: "We couldn't update your page layout",
      });
    } finally {
      isUpdatingLayout.current = false;
    }
  }, [pageId, mutateLayout, toast]);

  // Handle layout changes during drag/resize - only updates local state for visual feedback
  // Does NOT save to server - that happens in onDragStop/onResizeStop
  const handleLayoutChange = useCallback((
    newLayout: Layout[],
    _currentLayouts: Layouts
  ) => {
    // Skip until mounted or user has interacted
    if (!hasMounted.current && !hasUserInteracted.current) {
      return;
    }

    // Skip if we're in the middle of a server update
    if (isUpdatingLayout.current) {
      return;
    }

    if (newLayout.length === 0 || !workingLayout) {
      return;
    }

    const validLayout = validateLayout(newLayout);
    if (!validLayout) {
      return;
    }

    // Update local working state for immediate visual feedback
    const nextWorkingLayout = {
      xxs: editLayoutMode === 'mobile' ? validLayout : workingLayout.xxs,
      sm: editLayoutMode === 'desktop' ? validLayout : workingLayout.sm,
    };

    setWorkingLayout(nextWorkingLayout);
  }, [workingLayout, editLayoutMode, validateLayout]);

  // Handle drag/resize END - this is when we actually save to server
  const handleDragStop: ItemCallback = useCallback((newLayout, _oldItem, _newItem) => {
    if (!workingLayout) return;

    const validLayout = validateLayout(newLayout);
    if (!validLayout) return;

    const currentLayout = editLayoutMode === 'mobile' ? workingLayout.xxs : workingLayout.sm;

    // Check if layout actually changed
    const hasChanged = JSON.stringify(validLayout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h }))) !==
      JSON.stringify(currentLayout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })));

    if (!hasChanged) return;

    const nextLayout = {
      xxs: editLayoutMode === 'mobile' ? validLayout : workingLayout.xxs,
      sm: editLayoutMode === 'desktop' ? validLayout : workingLayout.sm,
    };

    setWorkingLayout(nextLayout);
    saveLayoutToServer(nextLayout);
  }, [workingLayout, editLayoutMode, validateLayout, saveLayoutToServer]);

  const handleResizeStop: ItemCallback = useCallback((newLayout, _oldItem, _newItem) => {
    if (!workingLayout) return;

    const validLayout = validateLayout(newLayout);
    if (!validLayout) return;

    const currentLayout = editLayoutMode === 'mobile' ? workingLayout.xxs : workingLayout.sm;

    // Check if layout actually changed
    const hasChanged = JSON.stringify(validLayout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h }))) !==
      JSON.stringify(currentLayout.map(l => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h })));

    if (!hasChanged) return;

    const nextLayout = {
      xxs: editLayoutMode === 'mobile' ? validLayout : workingLayout.xxs,
      sm: editLayoutMode === 'desktop' ? validLayout : workingLayout.sm,
    };

    setWorkingLayout(nextLayout);
    saveLayoutToServer(nextLayout);
  }, [workingLayout, editLayoutMode, validateLayout, saveLayoutToServer]);

  const handleDragStart = () => {
    hasUserInteracted.current = true;
  };

  const handleResizeStart = () => {
    hasUserInteracted.current = true;
  };

  const editableLayoutProps: ResponsiveProps = {
    ...layoutProps,
    onDrop: handleAddNewBlock,
    onLayoutChange: handleLayoutChange,
    onDragStart: handleDragStart,
    onDragStop: handleDragStop,
    onResizeStart: handleResizeStart,
    onResizeStop: handleResizeStop,
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
            lg: workingLayout?.sm ?? [],
            md: workingLayout?.sm ?? [],
            sm: workingLayout?.sm ?? [],
            xs: workingLayout?.sm ?? [],
            xxs: workingLayout?.xxs ?? [],
          }}
        >
          {optimisticItems}
        </ResponsiveReactGridLayout>
      </div>
    </>
  );
}
