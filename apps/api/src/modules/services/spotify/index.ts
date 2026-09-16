import { getSpotifyUserInfo, requestToken } from './utils';
import type { AppBindings } from '@/env';
import { decrypt, encrypt } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { requireSession } from '@/middleware/authenticate';
import { linkIntegrationToBlock } from '@/modules/integrations/service';
import { captureException } from '@sentry/cloudflare';
import { Hono } from 'hono';

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface SpotifyUserInfoResponse {
  display_name: string;
  id: string;
  images: { url: string }[];
  uri: string;
  [key: string]: any;
}

const spotifyServiceRoutes = new Hono<AppBindings>();

spotifyServiceRoutes.get('/', async (c) => {
  requireSession(c);

  const blockId = c.req.query('blockId');

  if (!blockId) {
    return c.json({ error: 'Missing blockId' }, 400);
  }

  if (!process.env.SPOTIFY_CLIENT_ID) {
    throw new Error('Missing SPOTIFY_CLIENT_ID');
  }

  if (!process.env.SPOTIFY_REDIRECT_URL) {
    throw new Error('Missing SPOTIFY_REDIRECT_URL');
  }

  const query = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
    scope: 'user-read-currently-playing, user-read-recently-played',
    state: await encrypt({
      blockId,
    }),
  });

  return c.redirect(`https://accounts.spotify.com/authorize?${query}`);
});

spotifyServiceRoutes.get('/callback', async (c) => {
  const session = requireSession(c);

  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code) {
    return c.json({ error: 'Error getting token' }, 400);
  }

  try {
    const res = await requestToken({ code });
    const json = (await res.json()) as SpotifyTokenResponse;

    if (!json.access_token) {
      return c.json({ error: 'Error getting access_token' });
    }

    const encryptedConfig = await encrypt({
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
    });

    const userInfo = await getSpotifyUserInfo(json.access_token);
    const userInfoData = (await userInfo.json()) as SpotifyUserInfoResponse;

    const integration = await prisma.integration.create({
      data: {
        organizationId: session.activeOrganizationId,
        type: 'spotify',
        encryptedConfig,
        displayName: userInfoData.display_name || 'Spotify',
      },
    });

    // If the state is present, we need to update the block with the integration id
    if (state) {
      const decryptedState = await decrypt<{ blockId: string }>(state);

      if (decryptedState?.blockId) {
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
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/spotify`
    );
  } catch (error) {
    console.log('Error', error);
    captureException(error);

    return c.json({ error: 'Error getting token' }, 500);
  }
});

export default spotifyServiceRoutes;
