import { getAuthSession } from '@/lib/api/auth';
import {
  requestLongLivedToken,
  requestToken,
  requestUserInfo,
} from '@/lib/api/services/instagram/utils';
import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import { prisma } from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

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
      return NextResponse.json(
        { error: { message: 'Failed to encrypt config' } },
        { status: 500 }
      );
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

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/i/integration-callback/instagram`
    );
  } catch (error) {
    captureException(error);
    console.log('Error', error);
    return NextResponse.json(
      { error: { message: 'Error getting token' } },
      { status: 500 }
    );
  }
}
