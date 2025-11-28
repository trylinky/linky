'use client';

import { hideOnboardingTour } from '@/app/lib/auth-actions';
import { StepType, TourProvider, useTour } from '@reactour/tour';
import { captureException } from '@sentry/nextjs';
import { fetcher } from '@trylinky/common';
import { SidebarProvider, Button } from '@trylinky/ui';
import { ReactNode } from 'react';
import { SWRConfig, SWRConfiguration } from 'swr';

interface Props {
  children: ReactNode;
  value: SWRConfiguration;

  currentUserIsOwner: boolean;
  pageId: string;
}

const BlockContent = ({
  title,
  stepNumber,
  label,
}: {
  title: string;
  stepNumber: number;
  label: string;
}) => {
  const { setIsOpen } = useTour();

  const handleFinishTour = async () => {
    try {
      await hideOnboardingTour();
    } catch (error) {
      captureException(error);
    } finally {
      setIsOpen(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="text-lg font-bold flex items-center justify-between">
        {title}
        <span className="text-stone-400 text-sm font-medium">
          ({stepNumber}/5)
        </span>
      </span>
      <p>{label}</p>
      {stepNumber === 5 && (
        <Button variant="outline" onClick={handleFinishTour}>
          Finish tour
        </Button>
      )}
    </div>
  );
};
const tourSteps: StepType[] = [
  {
    selector: '#tour-blocks',
    position: 'center',
    content: (
      <BlockContent
        title="Blocks"
        stepNumber={1}
        label="Blocks are the building blocks of your page. They can be added, removed, and rearranged to create your own unique page."
      />
    ),
  },
  {
    selector: '#tour-canvas',
    position: 'center',
    content: (
      <BlockContent
        title="Canvas"
        stepNumber={2}
        label="This is your page! You can drag and drop blocks from the sidebar on
            to the canvas."
      />
    ),
  },
  {
    selector: '#tour-settings',
    position: 'right',
    content: (
      <BlockContent
        title="Settings"
        stepNumber={3}
        label="Here you can edit your page settings, such as the title, description, and theme."
      />
    ),
  },
  {
    selector: '#tour-screen-size-switcher',
    position: 'bottom',
    content: (
      <BlockContent
        title="Screen Size Switcher"
        stepNumber={4}
        label="We want your page to look great on all devices. Use the screen size switcher to switch between desktop and mobile views. You can have a different layout for each screen size."
      />
    ),
  },
  {
    selector: '#tour-page-switcher',
    position: 'bottom',
    content: (
      <BlockContent
        title="Page Switcher"
        stepNumber={5}
        label="And finally, here is where you can switch between your pages, or create a new one."
      />
    ),
  },
];

const WithTourProvider = ({ children }: { children: ReactNode }) => {
  return (
    <TourProvider
      steps={tourSteps}
      showBadge={false}
      onClickMask={() => null}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': '#ff4f17',
          borderRadius: 10,
        }),
        maskArea: (base) => ({ ...base, rx: 4 }),
        badge: (base) => ({ ...base, left: 'auto', right: '-0.8125em' }),
        controls: (base) => ({ ...base }),
        close: () => ({ display: 'none' }),
      }}
    >
      {children}
    </TourProvider>
  );
};

export const LinkyProviders = ({
  children,
  value,
  currentUserIsOwner,
  pageId,
}: Props) => {
  const cache = new Map();
  cache.set('pageId', pageId);

  return (
    <SWRConfig value={{ ...value, fetcher, provider: () => cache }}>
      <WithTourProvider>
        <SidebarProvider
          style={
            {
              '--sidebar-width': '390px',
            } as React.CSSProperties
          }
          skipSidebar={!currentUserIsOwner}
        >
          {children}
        </SidebarProvider>
      </WithTourProvider>
    </SWRConfig>
  );
};
