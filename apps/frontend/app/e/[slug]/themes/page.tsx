'use client';

import { SidebarThemes } from '@/app/components/SidebarThemes';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function ThemesTab() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
        Themes
      </h1>
      <Catalyst.Text className="mt-1">
        Pick a theme to style your page. Each preview shows how your page will
        look.
      </Catalyst.Text>
      <Catalyst.Divider className="my-6" />
      <SidebarThemes />
    </div>
  );
}
