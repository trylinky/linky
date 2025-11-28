'use server';

import { decrypt, encrypt } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { ThreadsIntegrationConfig } from '@trylinky/blocks';

async function refreshLongLivedToken({ accessToken }: { accessToken: string }) {
  const options = {
    grant_type: 'th_refresh_token',
    access_token: accessToken,
  };

  const qs = new URLSearchParams(options).toString();

  return fetch(`https://graph.threads.net/refresh_access_token?${qs}`, {
    method: 'GET',
  });
}

function fetchThreadsFollowerCount(accessToken: string, threadsUserId: string) {
  const options = {
    metric: 'followers_count',
  };

  const qs = new URLSearchParams(options).toString();

  return fetch(
    `https://graph.threads.net/v1.0/${threadsUserId}/threads_insights?${qs}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      next: {
        revalidate: 60,
      },
    }
  );
}

function fetchThreadsProfileInfo(accessToken: string, threadsUserId: string) {
  const options = {
    fields: 'username,threads_profile_picture_url,name',
  };

  const qs = new URLSearchParams(options).toString();

  return fetch(`https://graph.threads.net/v1.0/${threadsUserId}?${qs}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: {
      revalidate: 60,
    },
  });
}

const fetchThreadsData = async (
  config: ThreadsIntegrationConfig,
  isRetry: boolean,
  integrationId: string
) => {
  const [followerCountReq, profileInfoReq] = await Promise.all([
    fetchThreadsFollowerCount(config.accessToken, config.threadsUserId),
    fetchThreadsProfileInfo(config.accessToken, config.threadsUserId),
  ]);

  // The access token might have expired. Try to refresh it.
  if (followerCountReq.status === 401 && !isRetry) {
    const refreshTokenRequest = await refreshLongLivedToken({
      accessToken: config.accessToken,
    });

    const refreshTokenData = await refreshTokenRequest.json();

    if (refreshTokenData?.access_token) {
      const encryptedConfig = await encrypt({
        accessToken: refreshTokenData.access_token,
        threadsUserId: config.threadsUserId,
      });

      await prisma.integration.update({
        where: {
          id: integrationId,
        },
        data: {
          encryptedConfig,
        },
      });

      fetchThreadsData(
        {
          accessToken: refreshTokenData.access_token,
          threadsUserId: config.threadsUserId,
        },
        true,
        integrationId
      );
    }
  }

  if (followerCountReq.status === 200) {
    const [followerCountData, profileInfoData] = await Promise.all([
      followerCountReq.json(),
      profileInfoReq.json(),
    ]);

    return {
      followerCount: followerCountData.data[0]?.total_value?.value ?? 0,
      profile: {
        username: profileInfoData.username,
        profilePictureUrl: profileInfoData.threads_profile_picture_url,
        name: profileInfoData.name,
      },
    };
  }

  // Is this is a retry, bail out to prevent an infinite loop.
  if (isRetry) {
    return null;
  }
};

export const fetchData = async (blockId: string) => {
  try {
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      select: {
        integration: {
          where: {
            type: 'threads',
          },
          select: {
            id: true,
            encryptedConfig: true,
          },
        },
      },
    });

    const integration = block?.integration;

    if (!integration || !integration.encryptedConfig) {
      return null;
    }

    let decryptedConfig: ThreadsIntegrationConfig | null = null;

    try {
      decryptedConfig = await decrypt<ThreadsIntegrationConfig>(
        integration.encryptedConfig
      );
    } catch (error) {
      captureException(error);
      return null;
    }

    if (!decryptedConfig.accessToken) {
      captureException(
        new Error(
          `Threads accessToken or refreshToken doesn't exist: Integration ID: ${integration.id}`
        )
      );

      return null;
    }

    const threadsData = await fetchThreadsData(
      decryptedConfig,
      false,
      integration.id
    );

    return threadsData;
  } catch (error) {
    captureException(error);

    return null;
  }
};
