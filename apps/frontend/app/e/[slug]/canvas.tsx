'use client';

import { SidebarBlockForm } from '@/app/components/SidebarBlockForm';
import { SidebarBlocks } from '@/app/components/SidebarBlocks';
import { useEditModeContext } from '@/app/contexts/Edit';
import * as Catalyst from '@trylinky/ui/catalyst';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { ResponsiveProps } from 'react-grid-layout';

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

  return (
    // Full-bleed out of the StackedLayout content card's p-6/lg:p-10 padding so
    // the theme background reaches the container edges (no white frame), then
    // re-add inner padding.
    <div className="app-page bg-sys-bg-base -m-6 flex flex-col gap-6 p-6 md:flex-row lg:-m-10 lg:rounded-lg lg:p-10">
      {/* Docked, non-modal block palette so HTML5 drag-to-add still works
          (a modal would block dragging onto the grid). Stacked above the grid
          on mobile (click-to-add), docked rail on desktop (drag-to-add). */}
      <aside className="w-full shrink-0 md:w-72">
        {/* Theme-adaptive frosted glass: tints with the page's own surface + text
            tokens, so it's a light frost on light themes and a dark frost on dark
            themes (rather than a fixed white panel that clashes on dark themes). */}
        <div className="rounded-2xl bg-sys-bg-base/70 shadow-lg ring-1 ring-sys-bg-border/50 backdrop-blur-md md:sticky md:top-6 md:flex md:h-[calc(100svh-7rem)] md:flex-col md:overflow-hidden">
          <h2 className="text-sys-title-primary shrink-0 border-b border-sys-bg-border/40 p-4 text-xl font-bold">
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
