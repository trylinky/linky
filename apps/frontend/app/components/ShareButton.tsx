'use client';

import { ShareDialog } from './ShareDialog';
import { Share1Icon } from '@radix-ui/react-icons';
import { useState } from 'react';

export function ShareButton() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        className="bg-transparent border-none p-2 rounded-sm hover:bg-sys-title-primary/10"
        onClick={() => setDialogOpen(true)}
      >
        <Share1Icon className="size-5 text-sys-title-primary" />
        <span className="sr-only">Share</span>
      </button>

      <ShareDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
