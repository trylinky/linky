'use client';

import { SidebarPageSettings } from '@/app/components/SidebarPageSettings';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function SettingsTab() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-2">
        <Catalyst.Heading>Settings</Catalyst.Heading>
        <Catalyst.Text className="mt-2">
          Manage your page handle, visibility, verification, and more.
        </Catalyst.Text>
      </div>
      <Catalyst.Divider className="my-8" />
      <SidebarPageSettings />
    </div>
  );
}
