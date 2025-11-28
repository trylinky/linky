import { getAuthSession } from '@/lib/api/auth';
import {
  getThreadsUserInfo,
  requestLongLivedToken,
  requestToken,
} from '@/lib/api/services/threads/utils';
import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import { prisma } from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json(
      { error: { message: 'Error getting code' } },
      { status: 400 }
    );
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
      return NextResponse.json(
        { error: { message: 'Failed to encrypt config' } },
        { status: 500 }
      );
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

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/i/integration-callback/threads`
    );
  } catch (error) {
    captureException(error);
    return NextResponse.json(
      { error: { message: 'Error getting token' } },
      { status: 500 }
    );
  }
}
