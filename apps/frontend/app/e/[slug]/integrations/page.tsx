'use client';

import { SidebarIntegrations } from '@/app/components/SidebarIntegrations';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function IntegrationsTab() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
        Integrations
      </h1>
      <Catalyst.Divider className="my-6" />
      <SidebarIntegrations />
    </div>
  );
}
