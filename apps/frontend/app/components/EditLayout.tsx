import { EditSidebar } from '@/app/components/EditSidebar';
import { SidebarInset, SidebarTrigger } from '@trylinky/ui';
import { ReactNode } from 'react';

export function EditLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EditSidebar />
      <SidebarInset className="mt-[68px] app-page" id="tour-canvas">
        <SidebarTrigger className="mt-3 ml-3 text-sys-title-primary" />
        {children}
      </SidebarInset>
    </>
  );
}
