import { DraggableBlockButton } from '@/app/components/DraggableBlockButton';
import {
  SidebarContentHeader,
  SidebarGroup,
  SidebarGroupContent,
} from '@trylinky/ui';

export function SidebarForms() {
  return (
    <>
      <SidebarContentHeader title="Forms" />

      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground px-2">
              Use a form to collect email addresses from your visitors. Currently,
              we support <strong>getwaitlist.com</strong> integration.
            </p>
            <DraggableBlockButton type="waitlist-email" />
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
