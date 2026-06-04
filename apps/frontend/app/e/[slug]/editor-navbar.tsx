'use client';

import { useEditModeContext } from '@/app/contexts/Edit';
import { PageSwitcher } from '@/app/components/PageSwitcher';
import { TeamSwitcher } from '@/app/components/TeamSwitcher';
import { UserWidget } from '@/app/components/UserWidget';
import { auth } from '@/app/lib/auth';
import * as Catalyst from '@trylinky/ui/catalyst';
import { internalApiFetcher } from '@trylinky/common';
import type { Page } from '@trylinky/prisma';
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';

const tabs = (slug: string) => [
  { label: 'Blocks', href: `/e/${slug}` },
  { label: 'Themes', href: `/e/${slug}/themes` },
  { label: 'Settings', href: `/e/${slug}/settings` },
  { label: 'Integrations', href: `/e/${slug}/integrations` },
  { label: 'Analytics', href: `/e/${slug}/analytics` },
  { label: 'Forms', href: `/e/${slug}/forms` },
];

export function EditorNavbar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { data: orgs } = auth.useListOrganizations();
  const { data: teamPages } = useSWR<Partial<Page>[]>(
    '/pages/me',
    internalApiFetcher
  );
  const onBlocks = pathname === `/e/${slug}`;

  return (
    <Catalyst.Navbar>
      <Catalyst.NavbarSection>
        {orgs && orgs.length > 1 && <TeamSwitcher usersOrganizations={orgs} />}
        <PageSwitcher teamPages={teamPages} />
      </Catalyst.NavbarSection>
      <Catalyst.NavbarDivider className="max-lg:hidden" />
      <Catalyst.NavbarSection className="max-lg:hidden">
        {tabs(slug).map((t) => (
          <Catalyst.NavbarItem
            key={t.href}
            href={t.href}
            current={pathname === t.href}
          >
            {t.label}
          </Catalyst.NavbarItem>
        ))}
      </Catalyst.NavbarSection>
      <Catalyst.NavbarSpacer />
      <Catalyst.NavbarSection>
        {onBlocks && <ScreenSizeSwitcher className="max-lg:hidden" />}
        <UserWidget usersOrganizations={orgs} />
      </Catalyst.NavbarSection>
    </Catalyst.Navbar>
  );
}

function ScreenSizeSwitcher({ className }: { className?: string }) {
  const { editLayoutMode, setEditLayoutMode } = useEditModeContext();
  const base =
    'inline-flex items-center justify-center rounded-md p-1.5 transition-colors';
  const active = 'bg-white text-zinc-950 shadow-sm';
  const inactive = 'text-zinc-500 hover:text-zinc-950';
  return (
    <span
      id="tour-screen-size-switcher"
      className={`inline-flex items-center gap-0.5 rounded-lg bg-zinc-100 p-0.5${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        aria-label="Desktop preview"
        aria-pressed={editLayoutMode === 'desktop'}
        onClick={() => setEditLayoutMode('desktop')}
        className={`${base} ${editLayoutMode === 'desktop' ? active : inactive}`}
      >
        <ComputerDesktopIcon className="size-5" />
      </button>
      <button
        type="button"
        aria-label="Mobile preview"
        aria-pressed={editLayoutMode === 'mobile'}
        onClick={() => setEditLayoutMode('mobile')}
        className={`${base} ${editLayoutMode === 'mobile' ? active : inactive}`}
      >
        <DevicePhoneMobileIcon className="size-5" />
      </button>
    </span>
  );
}
