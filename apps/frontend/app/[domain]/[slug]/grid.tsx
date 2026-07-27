'use client';

import { WidthProvideRGL } from '@/components/WidthProvider';
import { ReactNode } from 'react';
import { Layout, Responsive, ResponsiveProps } from 'react-grid-layout';

export interface PageConfig {
  sm: Layout[];
  xxs: Layout[];
}

interface Props {
  layout: PageConfig;
  children: ReactNode[];
  isPotentiallyMobile: boolean;
}

/**
 * WidthProvideRGL returns a component *type*, so it has to keep a stable
 * identity - rebuilding it on render would unmount and remount the whole grid.
 * Both variants are built once at module scope, which keeps that guarantee
 * without a useMemo whose dependency array had to lie about what it read.
 */
const ResponsiveGridDesktop = WidthProvideRGL(Responsive, false);
const ResponsiveGridMobile = WidthProvideRGL(Responsive, true);

export default function Grid({ layout, children, isPotentiallyMobile }: Props) {
  const defaultLayoutProps: ResponsiveProps = {
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
    isResizable: false,
    isDraggable: false,
    isDroppable: false,
  };

  const ResponsiveReactGridLayout = isPotentiallyMobile
    ? ResponsiveGridMobile
    : ResponsiveGridDesktop;

  return (
    <ResponsiveReactGridLayout
      layouts={{
        lg: layout.sm,
        md: layout.sm,
        sm: layout.sm,
        xs: layout.sm,
        xxs: layout.xxs,
      }}
      {...defaultLayoutProps}
    >
      {children}
    </ResponsiveReactGridLayout>
  );
}
