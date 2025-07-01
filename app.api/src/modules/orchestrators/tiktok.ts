import { encrypt } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { uploadAsset } from '@/modules/assets/service';
import { captureException, captureMessage } from '@sentry/node';
import safeAwait from 'safe-await';

// Example output: "x7hj2k9"
const generateRandomCode = () => {
  return Math.random().toString(36).substring(2, 9);
};

const createPage = async ({
  organizationId,
  userId,
  tiktokUsername,
}: {
  organizationId: string;
  userId: string;
  tiktokUsername: string;
}) => {
  let newPageSlug = tiktokUsername;

  const [existingPageError, existingPage] = await safeAwait(
    prisma.page.findFirst({
      where: {
        slug: tiktokUsername,
      },
    })
  );

  if (existingPageError) {
    captureException(existingPageError);
    return null;
  }

  if (existingPage) {
    newPageSlug = `${tiktokUsername}-${generateRandomCode()}`;
  }

  try {
    const page = await prisma.page.create({
      data: {
        organizationId,
        slug: newPageSlug,
        metaTitle: `${tiktokUsername} on Linky`,
        metaDescription: `${tiktokUsername} on Linky`,
        publishedAt: new Date(),
        config: {},
      },
    });

    return page;
  } catch (error) {
    captureException(error);
    return null;
  }
};

const createHeaderBlock = async ({
  pageId,
  tiktokUsername,
  tiktokDisplayName,
  avatarUrl,
}: {
  pageId: string;
  tiktokUsername: string;
  tiktokDisplayName: string;
  avatarUrl?: string | null;
}) => {
  try {
    const block = await prisma.block.create({
      data: {
        pageId,
        type: 'header',
        config: {},
        data: {
          title: tiktokDisplayName,
          description: `@${tiktokUsername} on Linky`,
          avatar: avatarUrl
            ? {
                src: avatarUrl,
              }
            : undefined,
        },
      },
    });

    return block;
  } catch (error) {
    captureException(error);
    return null;
  }
};

const createContentBlock = async ({ pageId }: { pageId: string }) => {
  try {
    const block = await prisma.block.create({
      data: {
        pageId,
        type: 'content',
        config: {},
        data: {
          title: 'Welcome to my page!',
          content:
            "This is my new page on Linky. I'm a TikTok creator, and I post videos about... well, you'll have to see for yourself!",
        },
      },
    });

    return block;
  } catch (error) {
    captureException(error);
    return null;
  }
};

const createStackBlock = async ({ pageId }: { pageId: string }) => {
  try {
    const block = await prisma.block.create({
      data: {
        pageId,
        type: 'stack',
        config: {},
        data: {
          items: [
            {
              icon: {
                src: 'https://cdn.lin.ky/default-data/icons/instagram.svg',
              },
              link: 'https://instagram.com',
              label: '@yourinstagramhandle',
              title: 'Instagram',
            },
            {
              icon: {
                src: 'https://cdn.lin.ky/default-data/icons/twitter.svg',
              },
              link: 'https://x.com',
              label: '@yourxhandle',
              title: 'X / Twitter',
            },
            {
              icon: {
                src: 'https://cdn.lin.ky/default-data/icons/youtube.svg',
              },
              link: 'https://youtube.com',
              label: '@youryoutubechannel',
              title: 'YouTube',
            },
          ],
          label: 'My links',
          title: 'Find me here',
        },
      },
    });

    return block;
  } catch (error) {
    captureException(error);
    return null;
  }
};

const createTikTokFollowersBlock = async ({
  pageId,
  integrationId,
}: {
  pageId: string;
  integrationId: string;
}) => {
  try {
    const block = await prisma.block.create({
      data: {
        pageId,
        type: 'tiktok-follower-count',
        config: {},
        data: {},
      },
    });

    await prisma.block.update({
      where: {
        id: block.id,
      },
      data: {
        integration: {
          connect: {
            id: integrationId,
          },
        },
      },
    });

    return block;
  } catch (error) {
    captureException(error);
    return null;
  }
};

const createTikTokLatestVideoBlock = async ({
  pageId,
  integrationId,
  hasLatestVideo,
}: {
  pageId: string;
  integrationId: string;
  hasLatestVideo: boolean;
}) => {
  if (!hasLatestVideo) {
    return null;
  }

  try {
    const block = await prisma.block.create({
      data: {
        pageId,
        type: 'tiktok-latest-post',
        config: {},
        data: {},
      },
    });

    await prisma.block.update({
      where: {
        id: block.id,
      },
      data: {
        integration: {
          connect: {
            id: integrationId,
          },
        },
      },
    });

    return block;
  } catch (error) {
    captureException(error);
    return null;
  }
};

const createTiktokIntegration = async ({
  organizationId,
  accessToken,
  refreshToken,
  displayName,
}: {
  organizationId: string;
  accessToken: string;
  refreshToken: string;
  displayName: string;
}) => {
  const encryptedConfig = await encrypt({
    accessToken,
    refreshToken,
  });

  try {
    const integration = await prisma.integration.create({
      data: {
        organizationId,
        type: 'tiktok',
        encryptedConfig,
        displayName,
      },
    });

    return integration;
  } catch (error) {
    captureException(error);
    return null;
  }
};

const refreshTikTokToken = async (refreshToken: string) => {
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      captureException(new Error(`TikTok token refresh failed: ${data.error}`));
      return null;
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  } catch (error) {
    captureException(error);
    return null;
  }
};

const fetchTikTokProfile = async ({ 
  accessToken, 
  refreshToken,
  userId 
}: { 
  accessToken: string;
  refreshToken?: string;
  userId?: string;
}) => {
  const options = {
    fields: 'avatar_url,display_name,follower_count,username',
  };

  const qs = new URLSearchParams(options).toString();

  let currentAccessToken = accessToken;

  const makeRequest = async (token: string) => {
    const req = await fetch(`https://open.tiktokapis.com/v2/user/info/?${qs}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return req.json();
  };

  let { data, error } = await makeRequest(currentAccessToken);

  // If token expired and we have refresh token, try to refresh
  if (error && error.code === 'access_token_invalid' && refreshToken && userId) {
    const newTokens = await refreshTikTokToken(refreshToken);
    
    if (newTokens) {
      // Update the stored tokens in database
      await prisma.account.updateMany({
        where: {
          userId,
          providerId: 'tiktok',
        },
        data: {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        },
      });

      // Retry with new token
      const retryResult = await makeRequest(newTokens.accessToken);
      data = retryResult.data;
      error = retryResult.error;
    }
  }

  if (error && error.code !== 'ok') {
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
};

const checkHasPublishedVideo = async ({
  accessToken,
}: {
  accessToken: string;
}) => {
  const fields = ['id', 'title'];

  const qs = new URLSearchParams({
    fields: fields.join(','),
  }).toString();

  const req = await fetch(`https://open.tiktokapis.com/v2/video/list/?${qs}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: 'POST',
    body: JSON.stringify({
      max_count: 1,
    }),
  });

  const { data, error } = await req.json();

  if (error.code !== 'ok') {
    return false;
  }

  if (data.videos && data.videos.length > 0) {
    return true;
  }

  return false;
};

const setPageConfig = async ({
  pageId,
  headerBlockId,
  contentBlockId,
  stackBlockId,
  tiktokFollowersBlockId,
  tiktokLatestVideoBlockId,
}: {
  pageId: string;
  headerBlockId: string;
  contentBlockId: string;
  stackBlockId: string;
  tiktokFollowersBlockId: string;
  tiktokLatestVideoBlockId?: string | null;
}) => {
  const config = [
    {
      h: 5,
      i: headerBlockId,
      w: 12,
      x: 0,
      y: 0,
      moved: false,
      static: true,
    },
    {
      h: 3,
      i: contentBlockId,
      w: 12,
      x: 0,
      y: 5,
      moved: false,
      static: false,
    },
    {
      h: 5,
      i: tiktokFollowersBlockId,
      w: 6,
      x: 0,
      y: 12,
      moved: false,
      static: false,
    },
    {
      h: 8,
      i: stackBlockId,
      w: 6,
      x: tiktokLatestVideoBlockId ? 0 : 6,
      y: tiktokLatestVideoBlockId ? 17 : 12,
      moved: false,
      static: false,
    },
  ];

  if (tiktokLatestVideoBlockId) {
    config.push({
      h: 13,
      i: tiktokLatestVideoBlockId,
      w: 6,
      x: 6,
      y: 12,
      moved: false,
      static: false,
    });
  }

  const mobileConfig = [
    {
      h: 5,
      i: headerBlockId,
      w: 12,
      x: 0,
      y: 0,
      moved: false,
      static: true,
    },
    {
      h: 4,
      i: contentBlockId,
      w: 12,
      x: 0,
      y: 5,
      moved: false,
      static: false,
    },
    {
      h: 4,
      i: tiktokFollowersBlockId,
      w: 12,
      x: 0,
      y: 9,
      moved: false,
      static: false,
    },
    {
      h: 8,
      i: stackBlockId,
      w: 12,
      x: 0,
      y: 13,
      moved: false,
      static: false,
    },
  ];

  if (tiktokLatestVideoBlockId) {
    mobileConfig.push({
      h: 12,
      i: tiktokLatestVideoBlockId,
      w: 10,
      x: 1,
      y: 25,
      moved: false,
      static: false,
    });
  }

  await prisma.page.update({
    where: {
      id: pageId,
    },
    data: {
      config,
      mobileConfig,
      themeId: '14fc9bdf-f363-4404-b05e-856670722fda',
    },
  });
};

const getTikTokAccessToken = async ({ userId }: { userId: string }) => {
  const tiktokAccount = await prisma.account.findFirst({
    where: {
      userId,
      providerId: 'tiktok',
    },
  });

  if (!tiktokAccount) {
    return null;
  }

  return {
    refreshToken: tiktokAccount?.refreshToken,
    accessToken: tiktokAccount?.accessToken,
  };
};

const uploadAvatar = async ({
  avatarUrl,
  referenceId,
}: {
  avatarUrl: string;
  referenceId: string;
}) => {
  if (!avatarUrl) {
    return null;
  }

  const imageResponse = await fetch(avatarUrl);

  if (!imageResponse.ok || !imageResponse.body) {
    captureException(new Error('Failed to fetch avatar image'));
    return null;
  }

  const blob = await imageResponse.blob();
  const file = new File([blob], 'avatar.png', { type: blob.type });

  const uploadResult = await uploadAsset({
    context: 'blockAsset',
    file,
    referenceId,
  });

  if (!uploadResult.data || uploadResult.error) {
    captureException(new Error('Failed to upload avatar image'));
    return null;
  }

  return uploadResult.data.url;
};

export async function orchestrateTikTok({
  orchestrationId,
  organizationId,
  userId,
}: {
  orchestrationId: string;
  organizationId: string;
  userId: string;
}) {
  const orchestration = await prisma.orchestration.findUnique({
    where: {
      id: orchestrationId,
      pageGeneratedAt: null,
    },
  });

  if (!orchestration) {
    return {
      error: 'Orchestration not found',
    };
  }

  if (orchestration.expiresAt < new Date()) {
    return {
      error: 'Orchestration expired',
    };
  }

  // Tmp delay to allow token to be refreshed
  await new Promise((resolve) => setTimeout(resolve, 1400));

  const tiktokTokens = await getTikTokAccessToken({ userId });

  if (!tiktokTokens?.accessToken) {
    return {
      error: 'No access token found',
    };
  }

  if (!tiktokTokens?.refreshToken) {
    return {
      error: 'No refresh token found',
    };
  }

  const tiktokData = await fetchTikTokProfile({
    accessToken: tiktokTokens.accessToken,
    refreshToken: tiktokTokens.refreshToken,
    userId,
  });

  if (!tiktokData) {
    return {
      error: 'Unable to fetch TikTok profile',
    };
  }

  const hasPublishedVideo = await checkHasPublishedVideo({
    accessToken: tiktokTokens.accessToken,
  });

  const page = await createPage({
    organizationId,
    userId,
    tiktokUsername: tiktokData?.profile?.username,
  });

  if (!page) {
    captureMessage('TIKTOK: Unable to create page');
    return {
      error: 'Unable to create page',
    };
  }

  const uploadedAvatarUrl = await uploadAvatar({
    avatarUrl: tiktokData?.profile?.avatarUrl,
    referenceId: `orchestrator-tiktok-avatar-${page.id}`,
  });

  const tiktokIntegration = await createTiktokIntegration({
    organizationId,
    accessToken: tiktokTokens.accessToken,
    refreshToken: tiktokTokens.refreshToken,
    displayName: `@${tiktokData?.profile?.username}`,
  });

  if (!tiktokIntegration) {
    captureMessage('TIKTOK: Unable to create TikTok integration');
    return {
      error: 'Unable to create TikTok integration',
    };
  }

  const headerBlock = await createHeaderBlock({
    pageId: page.id,
    tiktokUsername: tiktokData?.profile?.username,
    tiktokDisplayName: tiktokData?.profile?.displayName,
    avatarUrl: uploadedAvatarUrl,
  });

  if (!headerBlock) {
    return {
      error: 'Unable to create header block',
    };
  }

  const contentBlock = await createContentBlock({
    pageId: page.id,
  });

  if (!contentBlock) {
    captureMessage('TIKTOK: Unable to create content block');
    return {
      error: 'Unable to create content block',
    };
  }

  const stackBlock = await createStackBlock({
    pageId: page.id,
  });

  if (!stackBlock) {
    captureMessage('TIKTOK: Unable to create stack block');
    return {
      error: 'Unable to create stack block',
    };
  }

  const tiktokFollowersBlock = await createTikTokFollowersBlock({
    pageId: page.id,
    integrationId: tiktokIntegration.id,
  });

  if (!tiktokFollowersBlock) {
    captureMessage('TIKTOK: Unable to create TikTok followers block');
    return {
      error: 'Unable to create TikTok followers block',
    };
  }

  const tiktokLatestVideoBlock = await createTikTokLatestVideoBlock({
    pageId: page.id,
    integrationId: tiktokIntegration.id,
    hasLatestVideo: hasPublishedVideo,
  });

  await setPageConfig({
    pageId: page.id,
    headerBlockId: headerBlock.id,
    tiktokFollowersBlockId: tiktokFollowersBlock.id,
    contentBlockId: contentBlock.id,
    stackBlockId: stackBlock.id,
    tiktokLatestVideoBlockId: tiktokLatestVideoBlock?.id,
  });

  await prisma.orchestration.update({
    where: {
      id: orchestrationId,
    },
    data: {
      pageGeneratedAt: new Date(),
      page: {
        connect: {
          id: page.id,
        },
      },
    },
  });

  // Experience some delay to simulate the page being built
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    success: true,
    data: {
      pageSlug: page.slug,
    },
  };
}
