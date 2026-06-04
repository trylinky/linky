'use client';

import { PageSwitcher } from '@/app/components/PageSwitcher';
import { TeamSwitcher } from '@/app/components/TeamSwitcher';
import { UserWidget } from '@/app/components/UserWidget';
import { auth } from '@/app/lib/auth';
import * as Catalyst from '@trylinky/ui/catalyst';
import { internalApiFetcher } from '@trylinky/common';
import type { Page } from '@trylinky/prisma';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';

const tabs = (slug: string) => [
  { label: 'Editor', href: `/e/${slug}` },
  { label: 'Themes', href: `/e/${slug}/themes` },
  { label: 'Settings', href: `/e/${slug}/settings` },
  { label: 'Integrations', href: `/e/${slug}/integrations` },
  { label: 'Analytics', href: `/e/${slug}/analytics` },
  { label: 'Forms', href: `/e/${slug}/forms` },
];

export function EditorMobileSidebar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { data: orgs } = auth.useListOrganizations();
  const { data: teamPages } = useSWR<Partial<Page>[]>(
    '/pages/me',
    internalApiFetcher
  );

  return (
    <Catalyst.Sidebar>
      <Catalyst.SidebarHeader>
        {orgs && orgs.length > 1 && <TeamSwitcher usersOrganizations={orgs} />}
        <PageSwitcher teamPages={teamPages} />
      </Catalyst.SidebarHeader>
      <Catalyst.SidebarBody>
        <Catalyst.SidebarSection>
          {tabs(slug).map((t) => (
            <Catalyst.SidebarItem
              key={t.href}
              href={t.href}
              current={pathname === t.href}
            >
              <Catalyst.SidebarLabel>{t.label}</Catalyst.SidebarLabel>
            </Catalyst.SidebarItem>
          ))}
        </Catalyst.SidebarSection>
      </Catalyst.SidebarBody>
      <Catalyst.SidebarFooter>
        <UserWidget usersOrganizations={orgs} />
      </Catalyst.SidebarFooter>
    </Catalyst.Sidebar>
  );
}
