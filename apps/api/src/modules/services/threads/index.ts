import {
  getThreadsUserInfo,
  requestLongLivedToken,
  requestToken,
} from './utils';
import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import { requireSession } from '@/middleware/authenticate';
import { linkIntegrationToBlock } from '@/modules/integrations/service';
import { captureException } from '@sentry/cloudflare';
import { integration } from '@trylinky/db/schema';
import { Hono } from 'hono';

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

const threadsServiceRoutes = new Hono<AppBindings>();

threadsServiceRoutes.get('/', async (c) => {
  requireSession(c);

  const blockId = c.req.query('blockId');

  if (!blockId) {
    return c.json({ error: 'Missing blockId' }, 400);
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
  return c.redirect(`https://threads.net/oauth/authorize?${qs}`);
});

threadsServiceRoutes.get('/callback', async (c) => {
  const session = requireSession(c);

  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code) {
    return c.json({ error: { message: 'Error getting code' } }, 400);
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
      return c.json({ error: { message: 'Failed to encrypt config' } }, 500);
    }

    const [created] = await db
      .insert(integration)
      .values({
        organizationId: session.activeOrganizationId,
        type: 'threads',
        encryptedConfig,
        displayName: userInfoData.username || 'Threads',
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
      `${process.env.APP_FRONTEND_URL}/i/integration-callback/threads`
    );
  } catch (error) {
    captureException(error);
    return c.json({ error: { message: 'Error getting token' } }, 500);
  }
});

export default threadsServiceRoutes;
