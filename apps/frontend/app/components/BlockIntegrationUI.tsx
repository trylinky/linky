import { InstagramLogo } from '@/app/components/integration-icons/Instagram';
import { SpotifyLogo } from '@/app/components/integration-icons/spotify';
import { ThreadsLogo } from '@/app/components/integration-icons/threads';
import { TikTokLogo } from '@/app/components/integration-icons/tiktok';
import { captureException } from '@sentry/nextjs';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { Integration } from '@trylinky/prisma';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  toast,
} from '@trylinky/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';

export type SupportedIntegrations =
  | 'instagram'
  | 'spotify'
  | 'threads'
  | 'tiktok';

export const integrationUIConfig: Record<
  SupportedIntegrations,
  { name: string; icon: React.ElementType; connectUrl: string }
> = {
  instagram: {
    name: 'Instagram',
    icon: InstagramLogo,
    connectUrl: `${process.env.NEXT_PUBLIC_API_URL}/services/instagram/v2`,
  },
  spotify: {
    name: 'Spotify',
    icon: SpotifyLogo,
    connectUrl: `${process.env.NEXT_PUBLIC_API_URL}/services/spotify`,
  },
  threads: {
    name: 'Threads',
    icon: ThreadsLogo,
    connectUrl: `${process.env.NEXT_PUBLIC_API_URL}/services/threads`,
  },
  tiktok: {
    name: 'TikTok',
    icon: TikTokLogo,
    connectUrl: `${process.env.NEXT_PUBLIC_API_URL}/services/tiktok`,
  },
};

export function BlockIntegrationUI({
  integration,
  blockId,
  integrationType,
}: {
  integration: {
    id: string;
    type: string;
    createdAt: string;
  } | null;
  blockId: string;
  integrationType: SupportedIntegrations;
}) {
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  const { mutate } = useSWRConfig();
  const router = useRouter();

  const { data: currentTeamIntegrations } = useSWR<Partial<Integration>[]>(
    '/integrations/me',
    internalApiFetcher
  );

  const handleDisconnect = async () => {
    if (!integration) {
      return;
    }

    try {
      const response = await InternalApi.post(
        '/integrations/disconnect-block',
        {
          integrationId: integration.id,
          blockId,
        }
      );

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Integration disconnected from block',
      });

      setShowConfirmDisconnect(false);

      mutate(`/blocks/${blockId}`);
    } catch (error) {
      captureException(error);
      toast({
        title: 'Error disconnecting integration',
        description: 'Please try again later.',
        variant: 'error',
      });
    }
  };

  const handleSelectIntegration = async (integrationId: string) => {
    try {
      const response = await InternalApi.post('/integrations/connect-block', {
        integrationId,
        blockId,
      });

      if (response.error) {
        toast({
          title: 'Error connecting integration',
          description: response.error,
          variant: 'error',
        });

        return;
      }

      mutate(`/blocks/${blockId}`);

      toast({
        title: 'Integration connected',
      });
    } catch (error) {
      captureException(error);
    }
  };

  useEffect(() => {
    // Refresh the page to fetch the new data
    router.refresh();
  }, [integration, router]);

  const existingIntegrations = currentTeamIntegrations?.filter(
    (integration) => integration.type === integrationType
  );

  const IntegrationIcon = integrationUIConfig[integrationType].icon;

  if (!integration) {
    return (
      <>
        <div className="bg-stone-100 rounded-md flex flex-col items-center text-center px-4 py-8">
          <div className="bg-stone-200 rounded-md w-14 h-14 flex items-center justify-center">
            <IntegrationIcon width={24} height={24} />
          </div>
          <span className="font-medium text-lg text-stone-800 mt-3">
            Connect your {integrationUIConfig[integrationType].name} Account
          </span>

          {existingIntegrations?.length ? (
            <div className="mt-4">
              <span className="font-normal text-stone-600 mt-1">
                You already have an {integrationUIConfig[integrationType].name}{' '}
                account connected to Linky. Select your account below, or
                connect a new one.
              </span>
              <Select onValueChange={handleSelectIntegration}>
                <SelectTrigger className="w-full max-w-[220px] mx-auto mt-4 bg-white">
                  <SelectValue
                    placeholder={`Select an ${integrationUIConfig[integrationType].name} account`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {existingIntegrations.map((integration) => {
                    const displayName =
                      integration.displayName ||
                      `Connected on ${new Date(integration.createdAt || '').toLocaleDateString()}` ||
                      integrationUIConfig[integrationType].name;
                    return (
                      <SelectItem
                        key={integration.id}
                        value={integration.id as string}
                      >
                        {displayName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <span className="text-xs font-semibold tracking-tight text-stone-600 mt-2 block">
                OR
              </span>
            </div>
          ) : null}

          <Button asChild className="mt-2">
            <Link
              href={`${integrationUIConfig[integrationType].connectUrl}?blockId=${blockId}`}
              prefetch={false}
              target="_blank"
            >
              Connect {integrationUIConfig[integrationType].name}
            </Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-stone-100 rounded-md flex flex-col items-center text-center px-4 py-8">
        <div className="bg-stone-200 rounded-md w-14 h-14 flex items-center justify-center">
          <IntegrationIcon width={24} height={24} />
        </div>
        <span className="font-medium text-lg text-stone-800 mt-3">
          Connected
        </span>
        <span className="font-normal text-stone-600 mt-1">
          Your {integrationUIConfig[integrationType].name} account was connected
          on {new Date(integration.createdAt as string).toLocaleDateString()}
        </span>

        {!showConfirmDisconnect && (
          <Button
            onClick={() => setShowConfirmDisconnect(true)}
            className="mt-4"
          >
            Disconnect Account
          </Button>
        )}
        {showConfirmDisconnect && (
          <div className="flex gap-2 mt-4">
            <Button onClick={handleDisconnect}>Are you sure?</Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDisconnect(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
