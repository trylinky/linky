'use client';

import {
  SidebarAnalytics,
  SidebarAnalyticsComingsoon,
} from './SidebarAnalytics';
import { SidebarBlockForm } from './SidebarBlockForm';
import { SidebarBlocks } from './SidebarBlocks';
import { SidebarIntegrations } from './SidebarIntegrations';
import { SidebarPageSettings } from './SidebarPageSettings';
import { SidebarThemes } from './SidebarThemes';
import { SidebarForms } from '@/app/components/SidebarForms';
import { useEditModeContext } from '@/app/contexts/Edit';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@trylinky/ui';
import {
  BlocksIcon,
  CableIcon,
  ChartNoAxesCombined,
  Cog,
  MailIcon,
  Palette,
} from 'lucide-react';

const pageMenuItems: {
  label: string;
  viewId: SidebarView;
  icon: React.ElementType;
  id?: string;
}[] = [
  {
    label: 'Blocks',
    viewId: 'blocks',
    icon: BlocksIcon,
  },
  {
    label: 'Themes',
    viewId: 'themes',
    icon: Palette,
  },
  {
    label: 'Settings',
    viewId: 'settings',
    icon: Cog,
    id: 'tour-settings',
  },
  {
    label: 'Integrations',
    viewId: 'integrations',
    icon: CableIcon,
  },
  {
    label: 'Analytics',
    viewId: 'analytics',
    icon: ChartNoAxesCombined,
  },
  {
    label: 'Forms',
    viewId: 'forms',
    icon: MailIcon,
  },
];

type SidebarView =
  | 'blocks'
  | 'themes'
  | 'settings'
  | 'integrations'
  | 'blockForm'
  | 'forms'
  | 'analytics';

export function EditSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { setOpen, isMobile, sidebarView, setSidebarView } = useSidebar();

  const { currentEditingBlock } = useEditModeContext();

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row !border-r mt-[58px] h-[calc(100svh-58px)]"
        {...props}
      >
        <Sidebar
          collapsible="none"
          className="!w-[calc(var(--sidebar-width-icon)_+_1px)] border-r bg-white h-auto"
        >
          <SidebarContent className="flex-auto">
            <SidebarGroup>
              <SidebarGroupContent className="px-1.5 md:px-0">
                {isMobile ? (
                  <div className="w-full overflow-x-auto">
                    <div className="w-auto flex flex-row gap-1">
                      {pageMenuItems.map((menuItem) => {
                        return (
                          <SidebarMenuButton
                            key={menuItem.label}
                            className="flex-shrink-0 w-auto"
                            onClick={() => {
                              setOpen(true);
                              setSidebarView(menuItem.viewId);
                            }}
                          >
                            <span>{menuItem.label}</span>
                          </SidebarMenuButton>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <SidebarMenu className="gap-3">
                    {pageMenuItems.map((menuItem) => {
                      return (
                        <SidebarMenuItem key={menuItem.label}>
                          <SidebarMenuButton
                            tooltip={{
                              children: menuItem.label,
                              hidden: false,
                            }}
                            className="px-2.5 md:px-2"
                            onClick={() => {
                              setOpen(true);
                              setSidebarView(menuItem.viewId);
                            }}
                            id={menuItem.id}
                            isActive={sidebarView === menuItem.viewId}
                          >
                            <menuItem.icon />
                            <span>{menuItem.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <Sidebar
          variant="inset"
          collapsible="none"
          className="flex-1 md:flex bg-stone-50  h-[calc(100svh-58px)]"
          {...props}
        >
          <SidebarContent>
            {sidebarView === 'blocks' && <SidebarBlocks />}
            {sidebarView === 'blockForm' && currentEditingBlock && (
              <SidebarBlockForm onClose={() => setSidebarView('blocks')} />
            )}
            {sidebarView === 'settings' && <SidebarPageSettings />}
            {sidebarView === 'themes' && <SidebarThemes />}
            {sidebarView === 'integrations' && <SidebarIntegrations />}
            {sidebarView === 'analytics' && <SidebarAnalytics />}
            {sidebarView === 'forms' && <SidebarForms />}
          </SidebarContent>
        </Sidebar>
      </Sidebar>
    </>
  );
}
