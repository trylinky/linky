import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import {
  requestLongLivedToken,
  requestLongLivedTokenLegacy,
  requestToken,
  requestTokenLegacy,
  requestUserInfo,
} from '@/modules/services/instagram/utils';
import { captureException } from '@sentry/node';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

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

export default async function instagramServiceRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  // These are using the old Instagram Basic Display API and will stop
  // working in December 2024
  fastify.get('/', getInstagramLegacyRedirectHandler);
  fastify.get('/callback', getInstagramLegacyCallbackHandler);

  fastify.get('/v2', getInstagramRedirectHandler);
  fastify.get('/v2/callback', getInstagramCallbackHandler);
}

const scopes = ['instagram_business_basic'];

async function getInstagramRedirectHandler(
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

  if (!process.env.INSTAGRAM_CALLBACK_URL) {
    return response.status(500).send({
      error: 'Missing INSTAGRAM_CALLBACK_URL',
    });
  }

  if (!process.env.INSTAGRAM_CLIENT_ID) {
    return response.status(500).send({
      error: 'Missing INSTAGRAM_CLIENT_ID',
    });
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

  return response.redirect(`https://www.instagram.com/oauth/authorize?${qs}`);
}

async function getInstagramCallbackHandler(
  request: FastifyRequest<{ Querystring: { code: string; state: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const { code, state } = request.query;

  if (!code) {
    return response.status(400).send({
      error: {
        message: 'Error getting code',
      },
    });
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
      return response.status(500).send({
        error: {
          message: 'Failed to encrypt config',
        },
      });
    }

    const integration = await prisma.integration.create({
      data: {
        organizationId: session.activeOrganizationId,
        type: 'instagram',
        encryptedConfig,
        displayName: `@${userInfoData.username}`,
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
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/instagram`
    );
  } catch (error) {
    captureException(error);
    console.log('Error', error);
    return response.status(500).send({
      error: {
        message: 'Error getting token',
      },
    });
  }
}

async function getInstagramLegacyRedirectHandler(
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

  if (!process.env.INSTAGRAM_LEGACY_CALLBACK_URL) {
    return response.status(500).send({
      error: 'Missing INSTAGRAM_LEGACY_CALLBACK_URL',
    });
  }

  if (!process.env.INSTAGRAM_LEGACY_CLIENT_ID) {
    return response.status(500).send({
      error: 'Missing INSTAGRAM_LEGACY_CLIENT_ID',
    });
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

  return response.redirect(`https://api.instagram.com/oauth/authorize?${qs}`);
}

async function getInstagramLegacyCallbackHandler(
  request: FastifyRequest<{ Querystring: { code: string; state: string } }>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  const { code, state } = request.query;

  if (!code) {
    return response.status(400).send({
      error: {
        message: 'Error getting code',
      },
    });
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
      return response.status(500).send({
        error: {
          message: 'Failed to encrypt config',
        },
      });
    }

    const integration = await prisma.integration.create({
      data: {
        organizationId: session.activeOrganizationId,
        type: 'instagram',
        encryptedConfig,
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
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/instagram`
    );
  } catch (error) {
    captureException(error);
    return response.status(500).send({
      error: {
        message: 'Error getting token',
      },
    });
  }
}
