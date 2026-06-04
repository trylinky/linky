import * as Catalyst from '@trylinky/ui/catalyst';

export function SidebarForms() {
  return (
    <div>
      <div className="w-full aspect-square bg-stone-200 rounded-lg flex items-center justify-center">
        <Catalyst.Text className="text-muted-foreground text-sm text-center px-8 text-pretty">
          Build forms to collect data from your users! Send an email to
          team@lin.ky to request access
        </Catalyst.Text>
      </div>
    </div>
  );
}
