import { getSpotifyUserInfo, requestToken } from './utils';
import { decrypt, encrypt } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { captureException } from '@sentry/node';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

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

export default async function spotifyServiceRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  fastify.get('/', getSpotifyRedirectHandler);
  fastify.get('/callback', getSpotifyCallbackHandler);
}

async function getSpotifyRedirectHandler(
  request: FastifyRequest<{ Querystring: { blockId: string } }>,
  response: FastifyReply
) {
  await request.server.authenticate(request, response);

  const { blockId } = request.query;

  if (!blockId) {
    return response.status(400).send({
      error: 'Missing blockId',
    });
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

  return response.redirect(`https://accounts.spotify.com/authorize?${query}`);
}

async function getSpotifyCallbackHandler(
  request: FastifyRequest<{ Querystring: { code: string; state: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  if (!session) {
    return response.status(401).send({
      error: 'Unauthorized',
    });
  }

  const { code, state } = request.query;

  if (!code) {
    return response.status(400).send({
      error: 'Error getting token',
    });
  }

  try {
    const res = await requestToken({ code });
    const json = (await res.json()) as SpotifyTokenResponse;

    if (!json.access_token) {
      return Response.json({ error: 'Error getting access_token' });
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
        const blockId = decryptedState.blockId;

        await prisma.block.update({
          where: { id: blockId },
          data: { integrationId: integration.id },
        });
      }
    }

    return response.redirect(
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/spotify`
    );
  } catch (error) {
    console.log('Error', error);
    captureException(error);

    return response.status(500).send({
      error: 'Error getting token',
    });
  }
}
