import { getTiktokUserInfo, requestToken, tiktokScopes } from './service';
import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { captureException } from '@sentry/node';
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteOptions,
} from 'fastify';

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

export default async function tiktokServiceRoutes(
  fastify: FastifyInstance,
  opts: RouteOptions
): Promise<void> {
  fastify.get('/', getTiktokRedirectHandler);
  fastify.get('/callback', getTiktokCallbackHandler);
}

interface TiktokRedirectQueryParams {
  Querystring: {
    blockId: string;
  };
}

async function getTiktokRedirectHandler(
  request: FastifyRequest<TiktokRedirectQueryParams>,
  response: FastifyReply
) {
  const { blockId } = request.query;

  if (!blockId) {
    return response.status(400).send({
      error: 'Missing blockId',
    });
  }

  const session = await request.server.authenticate(request, response);

  if (!session) {
    return response.status(401).send({
      error: 'Unauthorized',
    });
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

  return response.redirect(url.toString());
}

interface TiktokCallbackQueryParams {
  Querystring: {
    code: string;
    state: string;
  };
}

interface TikTokTokenResponse {
  open_id: string;
  scope: string;
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

async function getTiktokCallbackHandler(
  request: FastifyRequest<TiktokCallbackQueryParams>,
  response: FastifyReply
) {
  const session = await request.server.authenticate(request, response);

  if (!session?.user) {
    return response.status(401).send({
      error: {
        message: 'Unauthorized',
      },
    });
  }

  const code = request.query.code as string;

  if (!code) {
    return response.status(400).send({
      error: {
        message: 'Error getting code',
      },
    });
  }

  const state = request.query.state as string;

  const decryptedState = await decrypt<EncryptedState>(state ?? '');

  if (decryptedState.userId !== session.user.id) {
    return response.status(400).send({
      error: {
        message: 'Invalid state',
      },
    });
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
      return response.status(500).send({
        error: {
          message: 'Failed to encrypt config',
        },
      });
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
      if (decryptedState?.blockId) {
        const blockId = decryptedState.blockId;

        await prisma?.block.update({
          where: { id: blockId },
          data: { integrationId: integration?.id },
        });
      }
    }

    return response.redirect(
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/tiktok`
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
