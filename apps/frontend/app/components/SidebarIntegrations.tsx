import {
  integrationUIConfig,
  SupportedIntegrations,
} from '@/app/components/BlockIntegrationUI';
import { captureException } from '@sentry/nextjs';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { Integration } from '@trylinky/prisma';
import {
  SidebarContentHeader,
  SidebarGroup,
  SidebarGroupContent,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from '@trylinky/ui';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

export function SidebarIntegrations() {
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [integrationToDisconnect, setIntegrationToDisconnect] = useState<
    string | null
  >(null);

  const { mutate } = useSWRConfig();

  const { data: currentTeamIntegrations, isLoading } = useSWR<
    Partial<
      Integration & { blocks: { page: { id: string; slug: string } }[] }
    >[]
  >('/integrations/me', internalApiFetcher);

  const handleDisconnect = async () => {
    try {
      const response = await InternalApi.post('/integrations/disconnect', {
        integrationId: integrationToDisconnect,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Integration disconnected',
      });

      setShowConfirmDisconnect(false);

      mutate('/integrations/me');
    } catch (error) {
      captureException(error);
      toast({
        title: 'Error disconnecting integration',
        description: 'Please try again later.',
        variant: 'error',
      });
    }
  };

  const currentlySelectedIntegration = currentTeamIntegrations?.find(
    (integration) => integration.id === integrationToDisconnect
  );

  return (
    <>
      <SidebarContentHeader title="Integrations" />

      <SidebarGroup>
        <SidebarGroupContent>
          {isLoading ? (
            <div className="w-full aspect-square bg-stone-200 rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground text-sm">
                Loading integrations...
              </span>
            </div>
          ) : currentTeamIntegrations?.length ? (
            <div className="flex flex-col gap-2 divide-y divide-stone-200">
              {currentTeamIntegrations?.map((integration) => {
                const integrationConfig =
                  integrationUIConfig[
                    integration.type as SupportedIntegrations
                  ];

                const IntegrationIcon = integrationConfig.icon;

                return (
                  <div
                    className="w-full px-2 pt-2 flex items-center"
                    key={integration.id}
                  >
                    <div className="flex items-center gap-2">
                      <div className="bg-stone-200 rounded-md w-8 h-8 flex items-center justify-center">
                        <IntegrationIcon width={18} height={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {integrationConfig.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {integration.displayName}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!integration.id) {
                          return;
                        }
                        setIntegrationToDisconnect(integration.id);
                        setShowConfirmDisconnect(true);
                      }}
                      className="ml-auto"
                    >
                      Disconnect
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full aspect-square bg-stone-200 rounded-lg flex items-center justify-center px-4">
              <span className="text-muted-foreground text-sm text-center">
                When you connect an integration using a block, it will appear
                here.
              </span>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <Dialog
        open={showConfirmDisconnect}
        onOpenChange={setShowConfirmDisconnect}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm to disconnect {currentlySelectedIntegration?.type}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this integration?
            </DialogDescription>

            {currentlySelectedIntegration?.blocks?.length ? (
              <>
                <DialogDescription className="text-pretty">
                  This integration is connected to{' '}
                  {currentlySelectedIntegration?.blocks?.length}{' '}
                  {currentlySelectedIntegration?.blocks?.length === 1
                    ? 'block'
                    : 'blocks'}{' '}
                  on the following pages:
                </DialogDescription>
                <DialogDescription
                  className="text-pretty list-disc list-inside pl-4 my-3"
                  is="ul"
                >
                  {currentlySelectedIntegration?.blocks?.map((block) => (
                    <li key={block.page.id}>/{block.page.slug}</li>
                  ))}
                </DialogDescription>
                <DialogDescription className="text-pretty">
                  Disconnecting will stop those pages from syncing data from{' '}
                  {currentlySelectedIntegration?.type}.
                </DialogDescription>
              </>
            ) : null}
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowConfirmDisconnect(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
