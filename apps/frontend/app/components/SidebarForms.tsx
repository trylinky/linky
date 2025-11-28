import {
  SidebarContentHeader,
  SidebarGroup,
  SidebarGroupContent,
} from '@trylinky/ui';

export function SidebarForms() {
  return (
    <>
      <SidebarContentHeader title="Forms"></SidebarContentHeader>

      <SidebarGroup>
        <SidebarGroupContent>
          <div className="w-full aspect-square bg-stone-200 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground text-sm text-center px-8 text-pretty">
              Build forms to collect data from your users! Send an email to
              team@lin.ky to request access
            </span>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
