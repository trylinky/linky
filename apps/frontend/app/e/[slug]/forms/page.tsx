'use client';
import { SidebarForms } from '@/app/components/SidebarForms';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function FormsTab() {
  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <Catalyst.Heading>Forms</Catalyst.Heading>
      <Catalyst.Divider className="my-6" />
      <SidebarForms />
    </div>
  );
}
