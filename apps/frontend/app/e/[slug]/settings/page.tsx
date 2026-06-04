'use client';

import { SidebarPageSettings } from '@/app/components/SidebarPageSettings';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function SettingsTab() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Settings
        </h1>
        <Catalyst.Text className="mt-2">
          Manage your page handle, visibility, verification, and more.
        </Catalyst.Text>
      </div>
      <Catalyst.Divider className="my-8" />
      <SidebarPageSettings />
    </div>
  );
}
