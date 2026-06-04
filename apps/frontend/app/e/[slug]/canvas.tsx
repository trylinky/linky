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
    <div className="flex w-full flex-col gap-6 md:flex-row">
      {/* Docked, non-modal block palette so HTML5 drag-to-add still works
          (a modal would block dragging onto the grid). Stacked above the grid
          on mobile (click-to-add), docked rail on desktop (drag-to-add). */}
      <aside className="w-full shrink-0 md:w-72">
        <div className="rounded-xl border border-zinc-950/10 bg-white md:sticky md:top-6 md:flex md:h-[calc(100svh-7rem)] md:flex-col md:overflow-hidden">
          <Catalyst.Heading level={2} className="shrink-0 border-b border-zinc-950/5 p-4">
            Blocks
          </Catalyst.Heading>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <SidebarBlocks />
          </div>
        </div>
      </aside>

      <div className="app-page flex min-w-0 flex-1 justify-center rounded-xl">
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
