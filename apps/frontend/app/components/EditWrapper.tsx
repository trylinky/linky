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
  Children,
  ReactElement,
  ReactNode,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
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

  const ResponsiveReactGridLayout = useMemo(
    () => WidthProvider(Responsive),
    []
  );

  // Skeletons for blocks that have been dropped but whose real React
  // element hasn't yet arrived from the server (post `router.refresh`).
  // Stored separately from `useOptimistic` so the skeleton survives until
  // the real block lands in `children`, instead of vanishing the moment
  // the transition resolves.
  const [pendingAdds, setPendingAdds] = useState<Map<string, ReactElement>>(
    () => new Map()
  );

  // Drop a pending skeleton as soon as the real block appears in children.
  useEffect(() => {
    if (pendingAdds.size === 0) return;
    const childKeys = new Set<string>();
    Children.forEach(children, (child) => {
      if (isValidElement(child) && child.key != null) {
        childKeys.add(String(child.key));
      }
    });
    let changed = false;
    const next = new Map(pendingAdds);
    for (const key of pendingAdds.keys()) {
      if (childKeys.has(key)) {
        next.delete(key);
        changed = true;
      }
    }
    if (changed) setPendingAdds(next);
  }, [children, pendingAdds]);

  // Block handleLayoutChange while a drop is in flight so its debounced
  // POST can't race with the drop's authoritative POST and persist a
  // half-baked layout.
  const dropInFlightRef = useRef(false);

  useEffect(() => {
    if (nextToAddBlock) {
      handleAddNewBlock([], nextToAddBlock, null, true);
    }
  }, [nextToAddBlock]);

  const handleAddNewBlock = async (
    _newLayout: Layout[],
    layoutItem: any,
    _event: Event | null,
    isMobile?: boolean
  ) => {
    if (!layout || !pageId) return;

    const newItemId = uuidv4();
    const blockType = isMobile ? layoutItem.type : draggingItem.type;

    const newItemConfig: Layout = {
      h: isMobile ? layoutItem.h : draggingItem.h,
      i: newItemId,
      w: isMobile ? layoutItem.w : draggingItem.w,
      x: isMobile ? 0 : layoutItem.x,
      y: isMobile ? 0 : layoutItem.y - 1,
      minW: 4,
      minH: 2,
    };

    // Build the post-add layout for both breakpoints up front so the
    // server save and the optimistic cache stay in lockstep.
    const layoutWithNewBlock = {
      sm: [...layout.sm, newItemConfig],
      xxs: [...layout.xxs, newItemConfig],
    };

    // Cancel any pending resize-debounce save — the drop save below is
    // authoritative for the layout while the drop is in flight.
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    dropInFlightRef.current = true;

    // Optimistically place the block in the SWR cache so the grid renders
    // it immediately at the dropped position.
    mutateLayout(layoutWithNewBlock, { revalidate: false });

    const skeleton = (
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
      </div>
    );

    setPendingAdds((prev) => {
      const next = new Map(prev);
      next.set(newItemId, skeleton);
      return next;
    });

    try {
      const blockResponse = await InternalApi.post('/blocks/add', {
        block: { id: newItemId, type: blockType },
        pageSlug: params.slug,
      });

      if (blockResponse.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: blockResponse.error.message,
        });
        // Roll back optimistic state so the ghost block doesn't linger.
        mutateLayout(layout, { revalidate: false });
        setPendingAdds((prev) => {
          const next = new Map(prev);
          next.delete(newItemId);
          return next;
        });
        return;
      }

      // Persist the layout with the new block BEFORE router.refresh() so
      // the server-rendered children and the saved layout agree about
      // which blocks exist on this page.
      const layoutResponse = await InternalApi.post(
        `/pages/${pageId}/layout`,
        { newLayout: layoutWithNewBlock }
      );

      if (layoutResponse.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: layoutResponse.error.message,
        });
        return;
      }

      mutateLayout(
        (current) => ({
          sm: layoutResponse.sm ?? current?.sm ?? layoutWithNewBlock.sm,
          xxs: layoutResponse.xxs ?? current?.xxs ?? layoutWithNewBlock.xxs,
        }),
        { revalidate: false }
      );

      router.refresh();
    } finally {
      dropInFlightRef.current = false;
    }
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
    // While a drop is mid-flight, handleAddNewBlock owns the layout save.
    // Skipping here prevents a stale-closure POST from clobbering it.
    if (dropInFlightRef.current) return;

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
          {[...children, ...pendingAdds.values()]}
        </ResponsiveReactGridLayout>
      </div>
    </>
  );
}
