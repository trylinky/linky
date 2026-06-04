'use client';

import { SidebarBlockForm } from '@/app/components/SidebarBlockForm';
import { SidebarBlocks } from '@/app/components/SidebarBlocks';
import { useEditModeContext } from '@/app/contexts/Edit';
import { internalApiFetcher } from '@trylinky/common';
import * as Catalyst from '@trylinky/ui/catalyst';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { ResponsiveProps } from 'react-grid-layout';
import useSWR, { useSWRConfig } from 'swr';

const DynamicEditWrapper = dynamic(
  () =>
    import('@/app/components/EditWrapper').then((m) => ({
      default: m.EditWrapper,
    })),
  { ssr: false }
);

// Copied from grid.tsx's defaultLayoutProps (edit-mode values: draggable/
// resizable/droppable true). Keep in sync; Task 12 makes grid.tsx static-only
// so the two no longer share the edit path.
const layoutProps: ResponsiveProps = {
  useCSSTransforms: true,
  width: 624,
  rowHeight: 32,
  cols: { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 },
  margin: [10, 10],
  containerPadding: {
    lg: [0, 20],
    md: [0, 20],
    sm: [0, 20],
    xs: [0, 20],
    xxs: [10, 20],
  },
  compactType: 'vertical',
  isResizable: true,
  isDraggable: true,
  isDroppable: true,
};

export function EditorCanvas({ children }: { children: ReactNode[] }) {
  // EditWrapper reads layout from SWR (seeded by the shell's LinkyProviders
  // fallback) and owns drag/drop. The shell provides EditModeContextProvider.
  const { currentEditingBlock, setCurrentEditingBlock } = useEditModeContext();

  // Pick a light- or dark-glass palette based on the theme background's
  // lightness (theme colors are { h, l, s } with l in 0..1).
  const { cache } = useSWRConfig();
  const pageId = cache.get('pageId');
  const { data: pageTheme } = useSWR<{ theme: { colorBgBase?: { l?: number } } }>(
    pageId ? `/pages/${pageId}/theme` : null,
    internalApiFetcher
  );
  const bgLightness = pageTheme?.theme?.colorBgBase?.l;
  const isDarkTheme = typeof bgLightness === 'number' ? bgLightness < 0.5 : false;

  return (
    // Full-bleed out of the StackedLayout content card's p-6/lg:p-10 padding so
    // the theme background reaches the container edges (no white frame), then
    // re-add inner padding.
    <div className="app-page bg-sys-bg-base -m-6 flex flex-col gap-6 p-6 md:flex-row lg:-m-10 lg:rounded-lg lg:p-10">
      {/* Docked, non-modal block palette so HTML5 drag-to-add still works
          (a modal would block dragging onto the grid). Stacked above the grid
          on mobile (click-to-add), docked rail on desktop (drag-to-add). */}
      {/* `dark` toggles the glass between light- and dark-frost based on the
          theme background lightness (Tailwind dark: variants below + in the
          block cards). */}
      <aside className={`w-full shrink-0 md:w-72 ${isDarkTheme ? 'dark' : ''}`}>
        {/* Glassy frosted palette: light frost by default, dark frost on dark themes. */}
        <div className="rounded-2xl bg-white/80 shadow-[0_0_0_1px_#2000241c,0_2px_2px_#2000240d] backdrop-blur-sm md:sticky md:top-6 md:flex md:h-[calc(100svh-7rem)] md:flex-col md:overflow-hidden dark:bg-zinc-900/70 dark:shadow-[0_0_0_1px_#ffffff1f,0_2px_2px_#00000040]">
          <h2 className="shrink-0 border-b border-black/5 p-4 text-xl font-bold text-zinc-950 dark:border-white/10 dark:text-white">
            Blocks
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <SidebarBlocks />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 justify-center">
        <DynamicEditWrapper layoutProps={layoutProps}>
          {children}
        </DynamicEditWrapper>
      </div>

      {/* Per-block edit form. A modal is fine here — you're not dragging
          while editing. */}
      <Catalyst.Dialog
        open={!!currentEditingBlock}
        onClose={() => setCurrentEditingBlock(null)}
        size="xl"
      >
        <SidebarBlockForm onClose={() => setCurrentEditingBlock(null)} />
      </Catalyst.Dialog>
    </div>
  );
}
