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
      <Catalyst.NavbarDivider />
      <Catalyst.NavbarSection>
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
        {onBlocks && <ScreenSizeSwitcher />}
        <UserWidget usersOrganizations={orgs} />
      </Catalyst.NavbarSection>
    </Catalyst.Navbar>
  );
}

function ScreenSizeSwitcher() {
  const { editLayoutMode, setEditLayoutMode } = useEditModeContext();
  return (
    <span
      id="tour-screen-size-switcher"
      className="inline-flex items-center gap-1"
    >
      <Catalyst.NavbarItem
        current={editLayoutMode === 'desktop'}
        onClick={() => setEditLayoutMode('desktop')}
        aria-label="Desktop preview"
      >
        <ComputerDesktopIcon />
      </Catalyst.NavbarItem>
      <Catalyst.NavbarItem
        current={editLayoutMode === 'mobile'}
        onClick={() => setEditLayoutMode('mobile')}
        aria-label="Mobile preview"
      >
        <DevicePhoneMobileIcon />
      </Catalyst.NavbarItem>
    </span>
  );
}
