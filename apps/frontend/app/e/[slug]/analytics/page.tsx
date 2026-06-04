'use client';

import { SidebarAnalytics } from '@/app/components/SidebarAnalytics';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function AnalyticsTab() {
  return (
    <div className="mx-auto w-full max-w-6xl py-6">
      <Catalyst.Heading>Analytics</Catalyst.Heading>
      <Catalyst.Divider className="my-6" />
      <SidebarAnalytics />
    </div>
  );
}
