import {
  getThreadsUserInfo,
  requestLongLivedToken,
  requestToken,
} from './utils';
import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { captureException } from '@sentry/node';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

interface TokenResponse {
  access_token: string;
  user_id: number;
}

interface LongLivedTokenResponse {
  access_token: string;
  expires_in: number;
}

interface ThreadsUserInfoResponse {
  username: string;
  id: string;
}

export default async function threadsServiceRoutes(
  fastify: FastifyInstance,
  opts: any
) {
  fastify.get('/', getThreadsRedirectHandler);
  fastify.get('/callback', getThreadsCallbackHandler);
}

async function getThreadsRedirectHandler(
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

  if (!process.env.THREADS_CALLBACK_URL) {
    throw new Error('Missing THREADS_CALLBACK_URL');
  }

  if (!process.env.THREADS_CLIENT_ID) {
    throw new Error('Missing THREADS_CLIENT_ID');
  }

  const options = {
    client_id: process.env.THREADS_CLIENT_ID,
    redirect_uri: process.env.THREADS_CALLBACK_URL,
    scope: 'threads_basic,threads_manage_insights',
    response_type: 'code',
    state: await encrypt({
      blockId,
    }),
  };

  const qs = new URLSearchParams(options).toString();
  return response.redirect(`https://threads.net/oauth/authorize?${qs}`);
}

async function getThreadsCallbackHandler(
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

    const data = (await res.json()) as TokenResponse;

    const longLivedTokenResponse = await requestLongLivedToken({
      accessToken: data.access_token,
    });

    const longLivedToken =
      (await longLivedTokenResponse.json()) as LongLivedTokenResponse;

    const userInfo = await getThreadsUserInfo({
      accessToken: longLivedToken.access_token,
    });

    const userInfoData = (await userInfo.json()) as ThreadsUserInfoResponse;

    const encryptedConfig = await encrypt({
      accessToken: longLivedToken.access_token,
      threadsUserId: data.user_id,
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
        type: 'threads',
        encryptedConfig,
        displayName: userInfoData.username || 'Threads',
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
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/threads`
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
