'use server';

import { decrypt, encrypt } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { InstagramIntegrationConfig } from '@trylinky/blocks';

async function refreshLongLivedToken({ accessToken }: { accessToken: string }) {
  const options = {
    grant_type: 'ig_refresh_token',
    access_token: accessToken,
  };

  const qs = new URLSearchParams(options).toString();

  return fetch(`https://graph.instagram.com/refresh_access_token?${qs}`, {
    method: 'GET',
  });
}

function fetchInstagramProfile(accessToken: string, instagramUserId: string) {
  const url = new URL(`https://graph.instagram.com/v21.0/${instagramUserId}`);

  const qs = new URLSearchParams({
    fields: 'id,followers_count,profile_picture_url,username,name',
    access_token: accessToken,
  });

  url.search = qs.toString();

  return fetch(url.toString(), {
    next: {
      revalidate: 60,
    },
  });
}

const fetchInstagramData = async (
  config: InstagramIntegrationConfig,
  isRetry: boolean,
  integrationId: string
) => {
  const req = await fetchInstagramProfile(
    config.accessToken,
    config.instagramUserId
  );

  // The access token might have expired. Try to refresh it.
  if (req.status === 401 && !isRetry) {
    const refreshTokenRequest = await refreshLongLivedToken({
      accessToken: config.accessToken,
    });

    const refreshTokenData = await refreshTokenRequest.json();

    if (refreshTokenData?.access_token) {
      const encryptedConfig = await encrypt({
        accessToken: refreshTokenData.access_token,
        instagramUserId: config.instagramUserId,
      });

      await prisma.integration.update({
        where: {
          id: integrationId,
        },
        data: {
          encryptedConfig,
        },
      });

      fetchInstagramData(
        {
          accessToken: refreshTokenData.access_token,
          instagramUserId: config.instagramUserId,
        },
        true,
        integrationId
      );
    }
  }

  if (req.status === 200) {
    const data = await req.json();

    return {
      followerCount: data.followers_count,
      profile: {
        username: data.username,
        profilePictureUrl: data.profile_picture_url,
        name: data.name,
      },
    };
  }

  // Is this is a retry, bail out to prevent an infinite loop.
  if (isRetry) {
    return null;
  }
};

export const fetchData = async ({ blockId }: { blockId: string }) => {
  try {
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      select: {
        integration: {
          where: {
            type: 'instagram',
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

    let decryptedConfig: InstagramIntegrationConfig | null = null;

    try {
      decryptedConfig = await decrypt<InstagramIntegrationConfig>(
        block.integration.encryptedConfig
      );
    } catch (error) {
      captureException(error);
      return null;
    }

    if (!decryptedConfig.accessToken) {
      captureException(
        new Error(
          `Instagram accessToken or refreshToken doesn't exist: Integration ID: ${block.integration.id}`
        )
      );

      return null;
    }

    const instagramData = await fetchInstagramData(
      decryptedConfig,
      false,
      block.integration.id
    );

    return instagramData;
  } catch (error) {
    captureException(error);

    return null;
  }
};
