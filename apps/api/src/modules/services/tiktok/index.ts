import { getTiktokUserInfo, requestToken, tiktokScopes } from './service';
import type { AppBindings } from '@/env';
import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { requireSession } from '@/middleware/authenticate';
import { linkIntegrationToBlock } from '@/modules/integrations/service';
import { captureException } from '@sentry/cloudflare';
import { Hono } from 'hono';

// Define TikTok user info response type
interface TikTokUserInfoResponse {
  data?: {
    user?: {
      username?: string;
      open_id?: string;
      avatar_url?: string;
    };
  };
}

// Define encrypted state type
interface EncryptedState {
  userId: string;
  blockId?: string;
}

interface TikTokTokenResponse {
  open_id: string;
  scope: string;
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

const tiktokServiceRoutes = new Hono<AppBindings>();

tiktokServiceRoutes.get('/', async (c) => {
  const session = requireSession(c);
  const blockId = c.req.query('blockId');

  if (!blockId) {
    return c.json({ error: 'Missing blockId' }, 400);
  }

  if (!process.env.TIKTOK_CALLBACK_URL) {
    throw new Error('Missing TIKTOK_CALLBACK_URL');
  }

  if (!process.env.TIKTOK_CLIENT_KEY) {
    throw new Error('Missing TIKTOK_CLIENT_KEY');
  }

  const url = new URL('https://www.tiktok.com/v2/auth/authorize');

  const qs = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    redirect_uri: process.env.TIKTOK_CALLBACK_URL,
    scope: tiktokScopes.join(','),
    response_type: 'code',
    // This is used to confirm the request has not been tampered with, when we
    // receive the callback.
    state: await encrypt({
      userId: session.user.id,
      blockId,
    }),
  }).toString();

  url.search = qs;

  return c.redirect(url.toString());
});

tiktokServiceRoutes.get('/callback', async (c) => {
  const session = requireSession(c);

  const code = c.req.query('code');

  if (!code) {
    return c.json({ error: { message: 'Error getting code' } }, 400);
  }

  const state = c.req.query('state');

  const decryptedState = await decrypt<EncryptedState>(state ?? '');

  if (decryptedState.userId !== session.user.id) {
    return c.json({ error: { message: 'Invalid state' } }, 400);
  }

  try {
    const res = await requestToken({ code });

    const data = (await res.json()) as TikTokTokenResponse;

    const encryptedConfig = await encrypt({
      accessToken: data.access_token,
      tikTokOpenId: data.open_id,
      refreshToken: data.refresh_token,
    });

    if (!(await isEncrypted(encryptedConfig))) {
      return c.json({ error: { message: 'Failed to encrypt config' } }, 500);
    }

    const userInfo = await getTiktokUserInfo({
      accessToken: data.access_token,
    });

    const userInfoData = (await userInfo.json()) as TikTokUserInfoResponse;

    const integration = await prisma?.integration.create({
      data: {
        organizationId: session.activeOrganizationId,
        type: 'tiktok',
        encryptedConfig,
        displayName: userInfoData?.data?.user?.username || 'TikTok',
      },
    });

    // If the state is present, we need to update the block with the integration id
    if (state) {
      if (decryptedState?.blockId && integration?.id) {
        // Scoped to the caller: the block id comes from a query string they
        // control, so an unscoped update would let them attach this
        // integration to someone else's block.
        await linkIntegrationToBlock({
          blockId: decryptedState.blockId,
          integrationId: integration.id,
          userId: session.user.id,
        });
      }
    }

    return c.redirect(
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/tiktok`
    );
  } catch (error) {
    captureException(error);
    return c.json({ error: { message: 'Error getting token' } }, 500);
  }
});

export default tiktokServiceRoutes;
