import {
  integrationUIConfig,
  SupportedIntegrations,
} from '@/app/components/BlockIntegrationUI';
import { captureException } from '@sentry/nextjs';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { Integration } from '@trylinky/prisma';
import { toast } from '@trylinky/ui';
import * as Catalyst from '@trylinky/ui/catalyst';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

const AVAILABLE_INTEGRATIONS = Object.entries(integrationUIConfig) as [
  SupportedIntegrations,
  (typeof integrationUIConfig)[SupportedIntegrations],
][];

export function SidebarIntegrations() {
  const params = useParams<{ slug: string }>();
  const blocksTabHref = params?.slug ? `/e/${params.slug}` : '/dashboard';

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

  const hasConnected = !!currentTeamIntegrations?.length;

  return (
    <>
      <div className="flex flex-col gap-10">
        {isLoading ? (
          <div className="w-full rounded-lg bg-stone-100 px-4 py-12 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">
              Loading integrations...
            </span>
          </div>
        ) : (
          <>
            {hasConnected ? (
              <section>
                <Catalyst.Subheading>Connected</Catalyst.Subheading>
                <Catalyst.Text className="mt-1">
                  Accounts currently connected to this team.
                </Catalyst.Text>
                <div className="mt-4 flex flex-col divide-y divide-stone-200 rounded-lg border border-stone-200">
                  {currentTeamIntegrations?.map((integration) => {
                    const integrationConfig =
                      integrationUIConfig[
                        integration.type as SupportedIntegrations
                      ];

                    const IntegrationIcon = integrationConfig?.icon;

                    return (
                      <div
                        className="flex w-full items-center gap-3 p-4"
                        key={integration.id}
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-stone-100">
                          {IntegrationIcon ? (
                            <IntegrationIcon width={20} height={20} />
                          ) : null}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {integrationConfig?.name ?? integration.type}
                          </span>
                          {integration.displayName ? (
                            <span className="text-xs text-muted-foreground">
                              {integration.displayName}
                            </span>
                          ) : null}
                        </div>
                        <Catalyst.Button
                          outline
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
                        </Catalyst.Button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section>
              <Catalyst.Subheading>
                {hasConnected ? 'Available integrations' : 'Get started'}
              </Catalyst.Subheading>
              <Catalyst.Text className="mt-1">
                Connect an account by adding its block to your page. Once added,
                open the block to connect and it will appear under Connected.
              </Catalyst.Text>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {AVAILABLE_INTEGRATIONS.map(([type, config]) => {
                  const IntegrationIcon = config.icon;
                  const blockHint =
                    config.blocks.length === 1
                      ? `Add the “${config.blocks[0]}” block to connect.`
                      : `Add a block like “${config.blocks[0]}” to connect.`;

                  return (
                    <div
                      key={type}
                      className="flex flex-col rounded-lg border border-stone-300 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100">
                          <IntegrationIcon width={28} height={28} />
                        </div>
                        <span className="text-lg font-semibold text-zinc-950">
                          {config.name}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {config.description}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {blockHint}
                      </p>
                      <div className="mt-4">
                        <Catalyst.Button outline href={blocksTabHref}>
                          Add a block
                        </Catalyst.Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      <Catalyst.Dialog
        open={showConfirmDisconnect}
        onClose={setShowConfirmDisconnect}
      >
        <Catalyst.DialogTitle>
          Confirm to disconnect {currentlySelectedIntegration?.type}
        </Catalyst.DialogTitle>
        <Catalyst.DialogDescription>
          Are you sure you want to disconnect this integration?
        </Catalyst.DialogDescription>

        {currentlySelectedIntegration?.blocks?.length ? (
          <Catalyst.DialogBody>
            <Catalyst.DialogDescription className="text-pretty">
              This integration is connected to{' '}
              {currentlySelectedIntegration?.blocks?.length}{' '}
              {currentlySelectedIntegration?.blocks?.length === 1
                ? 'block'
                : 'blocks'}{' '}
              on the following pages:
            </Catalyst.DialogDescription>
            <ul className="text-pretty list-disc list-inside pl-4 my-3">
              {currentlySelectedIntegration?.blocks?.map((block) => (
                <li key={block.page.id}>/{block.page.slug}</li>
              ))}
            </ul>
            <Catalyst.DialogDescription className="text-pretty">
              Disconnecting will stop those pages from syncing data from{' '}
              {currentlySelectedIntegration?.type}.
            </Catalyst.DialogDescription>
          </Catalyst.DialogBody>
        ) : null}

        <Catalyst.DialogActions>
          <Catalyst.Button
            outline
            onClick={() => setShowConfirmDisconnect(false)}
          >
            Cancel
          </Catalyst.Button>
          <Catalyst.Button color="red" onClick={handleDisconnect}>
            Disconnect
          </Catalyst.Button>
        </Catalyst.DialogActions>
      </Catalyst.Dialog>
    </>
  );
}
