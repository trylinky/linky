'use client';

import { EditLayout } from '@/app/components/EditLayout';
import { EditModeContextProvider } from '@/app/contexts/Edit';
import { GlobalNavigation } from '@/components/GlobalNavigation';
import { WidthProvideRGL } from '@/components/WidthProvider';
import dynamic from 'next/dynamic';
import { ReactNode, useMemo } from 'react';
import { Layout, Responsive, ResponsiveProps } from 'react-grid-layout';

export interface PageConfig {
  sm: Layout[];
  xxs: Layout[];
}

interface Props {
  layout: PageConfig;
  children: ReactNode[];
  editMode?: boolean;
  isPotentiallyMobile: boolean;
  isLoggedIn: boolean;
}

// Dynamically import EditWrapper
const DynamicEditWrapper = dynamic(
  () =>
    import('@/app/components/EditWrapper').then((mod) => ({
      default: mod.EditWrapper,
    })),
  { ssr: false }
);

export default function Grid({
  layout,
  children,
  editMode = false,
  isPotentiallyMobile,
  isLoggedIn,
}: Props) {
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
    isResizable: editMode ? true : false,
    isDraggable: editMode ? true : false,
    isDroppable: editMode ? true : false,
  };

  const ResponsiveReactGridLayout = useMemo(
    () => WidthProvideRGL(Responsive, isPotentiallyMobile),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  if (editMode) {
    return (
      <EditModeContextProvider>
        <GlobalNavigation isEditMode />
        <EditLayout>
          <DynamicEditWrapper layoutProps={defaultLayoutProps}>
            {children}
          </DynamicEditWrapper>
        </EditLayout>
      </EditModeContextProvider>
    );
  }

  return (
    <>
      {isLoggedIn && <GlobalNavigation isEditMode={false} />}
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
    </>
  );
}
