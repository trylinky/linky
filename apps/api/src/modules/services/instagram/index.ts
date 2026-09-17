import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import { requireSession } from '@/middleware/authenticate';
import { linkIntegrationToBlock } from '@/modules/integrations/service';
import {
  requestLongLivedToken,
  requestLongLivedTokenLegacy,
  requestToken,
  requestTokenLegacy,
  requestUserInfo,
} from '@/modules/services/instagram/utils';
import { captureException } from '@sentry/cloudflare';
import { integration } from '@trylinky/db/schema';
import { Hono } from 'hono';

interface InstagramTokenResponse {
  access_token: string;
  user_id?: number;
}

interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface InstagramUserInfoResponse {
  user_id: string;
  account_type: string;
  username: string;
}

const scopes = ['instagram_business_basic'];

const instagramServiceRoutes = new Hono<AppBindings>();

// These are using the old Instagram Basic Display API and will stop working
// in December 2024
instagramServiceRoutes.get('/', async (c) => {
  requireSession(c);

  const blockId = c.req.query('blockId');

  if (!blockId) {
    return c.json({ error: 'Missing blockId' }, 400);
  }

  if (!process.env.INSTAGRAM_LEGACY_CALLBACK_URL) {
    return c.json({ error: 'Missing INSTAGRAM_LEGACY_CALLBACK_URL' }, 500);
  }

  if (!process.env.INSTAGRAM_LEGACY_CLIENT_ID) {
    return c.json({ error: 'Missing INSTAGRAM_LEGACY_CLIENT_ID' }, 500);
  }

  const options = {
    client_id: process.env.INSTAGRAM_LEGACY_CLIENT_ID,
    redirect_uri: process.env.INSTAGRAM_LEGACY_CALLBACK_URL,
    scope: 'user_profile,user_media',
    response_type: 'code',
    state: await encrypt({
      blockId,
    }),
  };

  const qs = new URLSearchParams(options).toString();

  return c.redirect(`https://api.instagram.com/oauth/authorize?${qs}`);
});

instagramServiceRoutes.get('/callback', async (c) => {
  const session = requireSession(c);

  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code) {
    return c.json({ error: { message: 'Error getting code' } }, 400);
  }

  try {
    const res = await requestTokenLegacy({ code });

    const data = (await res.json()) as InstagramTokenResponse & {
      user_id: number;
    };

    const longLivedTokenResponse = await requestLongLivedTokenLegacy({
      accessToken: data.access_token,
    });

    const longLivedToken =
      (await longLivedTokenResponse.json()) as InstagramLongLivedTokenResponse;

    const encryptedConfig = await encrypt({
      accessToken: longLivedToken.access_token,
      instagramUserId: data.user_id,
    });

    if (!(await isEncrypted(encryptedConfig))) {
      return c.json({ error: { message: 'Failed to encrypt config' } }, 500);
    }

    const [created] = await db
      .insert(integration)
      .values({
        organizationId: session.activeOrganizationId,
        type: 'instagram',
        encryptedConfig,
      })
      .returning({ id: integration.id });

    // If the state is present, we need to update the block with the integration id
    if (state) {
      const decryptedState = await decrypt<{ blockId: string }>(state);

      if (decryptedState?.blockId) {
        // Scoped to the caller: the block id comes from a query string they
        // control, so an unscoped update would let them attach this
        // integration to someone else's block.
        await linkIntegrationToBlock({
          blockId: decryptedState.blockId,
          integrationId: created.id,
          userId: session.user.id,
        });
      }
    }

    return c.redirect(
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/instagram`
    );
  } catch (error) {
    captureException(error);
    return c.json({ error: { message: 'Error getting token' } }, 500);
  }
});

instagramServiceRoutes.get('/v2', async (c) => {
  requireSession(c);

  const blockId = c.req.query('blockId');

  if (!blockId) {
    return c.json({ error: 'Missing blockId' }, 400);
  }

  if (!process.env.INSTAGRAM_CALLBACK_URL) {
    return c.json({ error: 'Missing INSTAGRAM_CALLBACK_URL' }, 500);
  }

  if (!process.env.INSTAGRAM_CLIENT_ID) {
    return c.json({ error: 'Missing INSTAGRAM_CLIENT_ID' }, 500);
  }

  const options = {
    client_id: process.env.INSTAGRAM_CLIENT_ID,
    redirect_uri: process.env.INSTAGRAM_CALLBACK_URL,
    scope: scopes.join(','),
    response_type: 'code',
    state: await encrypt({
      blockId,
    }),
  };

  const qs = new URLSearchParams(options).toString();

  return c.redirect(`https://www.instagram.com/oauth/authorize?${qs}`);
});

instagramServiceRoutes.get('/v2/callback', async (c) => {
  const session = requireSession(c);

  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code) {
    return c.json({ error: { message: 'Error getting code' } }, 400);
  }

  try {
    const res = await requestToken({ code });

    const data = (await res.json()) as InstagramTokenResponse;

    const longLivedTokenResponse = await requestLongLivedToken({
      accessToken: data.access_token,
    });

    const longLivedToken =
      (await longLivedTokenResponse.json()) as InstagramLongLivedTokenResponse;

    const userInfo = await requestUserInfo({
      accessToken: longLivedToken.access_token,
    });

    const userInfoData = (await userInfo.json()) as InstagramUserInfoResponse;

    const encryptedConfig = await encrypt({
      accessToken: longLivedToken.access_token,
      instagramUserId: userInfoData.user_id,
      accountType: userInfoData.account_type,
      username: userInfoData.username,
    });

    if (!(await isEncrypted(encryptedConfig))) {
      return c.json({ error: { message: 'Failed to encrypt config' } }, 500);
    }

    const [created] = await db
      .insert(integration)
      .values({
        organizationId: session.activeOrganizationId,
        type: 'instagram',
        encryptedConfig,
        displayName: `@${userInfoData.username}`,
      })
      .returning({ id: integration.id });

    // If the state is present, we need to update the block with the integration id
    if (state) {
      const decryptedState = await decrypt<{ blockId: string }>(state);

      if (decryptedState?.blockId) {
        // Scoped to the caller: the block id comes from a query string they
        // control, so an unscoped update would let them attach this
        // integration to someone else's block.
        await linkIntegrationToBlock({
          blockId: decryptedState.blockId,
          integrationId: created.id,
          userId: session.user.id,
        });
      }
    }

    return c.redirect(
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/instagram`
    );
  } catch (error) {
    captureException(error);
    console.log('Error', error);
    return c.json({ error: { message: 'Error getting token' } }, 500);
  }
});

export default instagramServiceRoutes;
