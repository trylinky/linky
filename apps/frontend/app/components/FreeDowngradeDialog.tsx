'use client';

import { useUpgradeDialog } from '@/app/components/UpgradeDialog';
import { captureException } from '@sentry/nextjs';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { UserFlag } from '@trylinky/prisma';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@trylinky/ui';
import { useState } from 'react';
import useSWR from 'swr';

export function FreeDowngradeDialog() {
  const [dismissed, setDismissed] = useState(false);
  const { open } = useUpgradeDialog();
  const { data: userFlags, mutate } = useSWR<{ flags: Partial<UserFlag>[] }>(
    '/flags/me',
    internalApiFetcher
  );

  const show = userFlags?.flags.find(
    (f) => f.key === 'showFreeDowngradeNotice'
  )?.value;

  if (!show || dismissed) {
    return null;
  }

  const dismiss = async () => {
    setDismissed(true);
    try {
      await InternalApi.post('/flags/hide-free-downgrade-notice');
      await mutate();
    } catch (error) {
      captureException(error);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your trial has ended</DialogTitle>
          <DialogDescription>
            You&apos;re now on Free. Your page is still live and nothing has
            been removed.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>One page, up to 5 blocks</li>
          <li>Analytics, private pages and the verified badge are paused</li>
          <li>Custom domains are paused</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={dismiss}>
            Got it
          </Button>
          <Button
            onClick={() => {
              dismiss();
              open('blocks', 'free-downgrade-dialog');
            }}
          >
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
