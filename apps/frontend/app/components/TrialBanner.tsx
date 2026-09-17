'use client';

import { useUpgradeDialog } from '@/app/components/UpgradeDialog';
import { useEntitlements } from '@/lib/hooks/use-entitlements';
import { Button } from '@trylinky/ui';

export function TrialBanner() {
  const { entitlements } = useEntitlements();
  const { open } = useUpgradeDialog();

  const trial = entitlements?.trial;
  if (!trial?.active || trial.daysLeft == null || trial.daysLeft > 3) {
    return null;
  }

  const days = trial.daysLeft === 1 ? '1 day' : `${trial.daysLeft} days`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <span>
        Your Premium trial ends in {days}. Add a card to keep analytics,
        unlimited blocks and private pages.
      </span>
      <Button size="sm" onClick={() => open('analytics', 'trial-banner')}>
        Keep Premium
      </Button>
    </div>
  );
}
