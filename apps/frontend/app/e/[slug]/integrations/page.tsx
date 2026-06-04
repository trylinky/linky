'use client';

import { SidebarIntegrations } from '@/app/components/SidebarIntegrations';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function IntegrationsTab() {
  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <Catalyst.Heading>Integrations</Catalyst.Heading>
      <Catalyst.Divider className="my-6" />
      <SidebarIntegrations />
    </div>
  );
}
