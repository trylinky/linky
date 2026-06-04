'use client';

import { SidebarThemes } from '@/app/components/SidebarThemes';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function ThemesTab() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Catalyst.Heading>Themes</Catalyst.Heading>
      <Catalyst.Text className="mt-1">
        Pick a theme to style your page. Each preview shows how your page will
        look.
      </Catalyst.Text>
      <Catalyst.Divider className="my-6" />
      <SidebarThemes />
    </div>
  );
}
