'use client';

import { useSession } from '@/app/lib/auth';
import {
  InternalApi,
  PricingTable,
  type PaywallFeature,
  type UpgradeRequiredError,
} from '@trylinky/common';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@trylinky/ui';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const TITLES: Record<PaywallFeature, string> = {
  blocks: "You've used your 5 free blocks",
  pages: 'Free includes one page',
  analytics: "See who's visiting",
  privatePages: 'Keep pages private with Premium',
  verification: 'Get verified',
  customDomain: 'Use your own domain',
};

type UpgradeDialogContextValue = {
  open: (feature: PaywallFeature, source: string) => void;
};

const UpgradeDialogContext = createContext<UpgradeDialogContextValue | null>(
  null
);

export function useUpgradeDialog(): UpgradeDialogContextValue {
  const ctx = useContext(UpgradeDialogContext);
  if (!ctx) {
    throw new Error(
      'useUpgradeDialog must be used within UpgradeDialogProvider'
    );
  }
  return ctx;
}

export function UpgradeDialogProvider({ children }: { children: ReactNode }) {
  const [feature, setFeature] = useState<PaywallFeature | null>(null);
  const posthog = usePostHog();
  const router = useRouter();
  const { data } = useSession();

  const open = useCallback(
    (nextFeature: PaywallFeature, source: string) => {
      posthog?.capture('upgrade-dialog-opened', {
        feature: nextFeature,
        source,
      });
      setFeature(nextFeature);
    },
    [posthog]
  );

  useEffect(() => {
    InternalApi.setUpgradeRequiredListener((error: UpgradeRequiredError) =>
      open(error.feature, 'api-402')
    );
    return () => InternalApi.setUpgradeRequiredListener(null);
  }, [open]);

  const value = useMemo(() => ({ open }), [open]);

  const handleComplete = () => {
    setFeature(null);
    router.push(window.location.pathname + '?showPremiumOnboarding=true');
  };

  return (
    <UpgradeDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={feature !== null}
        onOpenChange={(o) => !o && setFeature(null)}
      >
        <DialogContent className="max-w-2xl w-full p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{feature ? TITLES[feature] : ''}</DialogTitle>
            <DialogDescription>
              Premium unlocks unlimited pages and blocks, analytics, private
              pages, a verified badge and your own domain.
            </DialogDescription>
          </DialogHeader>
          <section className="bg-[#f5f3ea] px-6 py-8">
            <PricingTable
              isLoggedIn={!!data?.session}
              onComplete={handleComplete}
            />
          </section>
        </DialogContent>
      </Dialog>
    </UpgradeDialogContext.Provider>
  );
}
