'use client';

import { SidebarPageSettings } from '@/app/components/SidebarPageSettings';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function SettingsTab() {
  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <Catalyst.Heading>Settings</Catalyst.Heading>
      <Catalyst.Divider className="my-6" />
      <SidebarPageSettings />
    </div>
  );
}
