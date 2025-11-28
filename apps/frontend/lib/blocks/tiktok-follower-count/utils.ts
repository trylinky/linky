'use server';

import { decrypt, encrypt } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { TikTokIntegrationConfig } from '@trylinky/blocks';

async function refreshLongLivedToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  return fetch(`https://open.tiktokapis.com/v2/oauth/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
}

function fetchTiktokProfile(accessToken: string) {
  const options = {
    fields: 'avatar_url,display_name,follower_count,username',
  };

  const qs = new URLSearchParams(options).toString();

  return fetch(`https://open.tiktokapis.com/v2/user/info/?${qs}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: {
      revalidate: 60,
    },
  });
}

const fetchTikTokData = async (
  config: TikTokIntegrationConfig,
  isRetry: boolean,
  integrationId: string
) => {
  const profileReq = await fetchTiktokProfile(config.accessToken);

  // The access token might have expired. Try to refresh it.
  if (profileReq.status === 401 && !isRetry) {
    const refreshTokenRequest = await refreshLongLivedToken({
      refreshToken: config.refreshToken,
    });

    const refreshTokenData = await refreshTokenRequest.json();

    if (refreshTokenData?.access_token) {
      const encryptedConfig = await encrypt({
        accessToken: refreshTokenData.access_token,
        refreshToken: config.refreshToken,
      });

      await prisma.integration.update({
        where: {
          id: integrationId,
        },
        data: {
          encryptedConfig,
        },
      });

      fetchTikTokData(
        {
          accessToken: refreshTokenData.access_token,
          refreshToken: config.refreshToken,
        },
        true,
        integrationId
      );
    }
  }

  if (profileReq.status === 200) {
    const profileData = await profileReq.json();

    const { data, error } = profileData;

    if (error.code !== 'ok') {
      captureException(error);
      return null;
    }

    return {
      followerCount: data.user.follower_count,
      profile: {
        username: data.user.username,
        displayName: data.user.display_name,
        avatarUrl: data.user.avatar_url,
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
            type: 'tiktok',
          },
          select: {
            id: true,
            encryptedConfig: true,
          },
        },
      },
    });

    if (!block?.integration || !block.integration.encryptedConfig) {
      return null;
    }

    let decryptedConfig: TikTokIntegrationConfig | null = null;

    try {
      decryptedConfig = await decrypt<TikTokIntegrationConfig>(
        block.integration.encryptedConfig
      );
    } catch (error) {
      captureException(error);
      return null;
    }

    if (!decryptedConfig.accessToken) {
      captureException(
        new Error(
          `TikTok accessToken or refreshToken doesn't exist: Integration ID: ${block.integration.id}`
        )
      );

      return null;
    }

    const tikTokData = await fetchTikTokData(
      decryptedConfig,
      false,
      block.integration.id
    );

    return tikTokData;
  } catch (error) {
    captureException(error);

    return null;
  }
};
