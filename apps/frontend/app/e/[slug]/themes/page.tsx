'use client';

import { SidebarThemes } from '@/app/components/SidebarThemes';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function ThemesTab() {
  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <Catalyst.Heading>Themes</Catalyst.Heading>
      <Catalyst.Divider className="my-6" />
      <SidebarThemes />
    </div>
  );
}
