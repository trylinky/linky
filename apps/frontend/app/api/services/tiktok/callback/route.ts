import { getAuthSession } from '@/lib/api/auth';
import {
  getTiktokUserInfo,
  requestToken,
} from '@/lib/api/services/tiktok/utils';
import { decrypt, encrypt, isEncrypted } from '@/lib/encrypt';
import { prisma } from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

interface TikTokUserInfoResponse {
  data?: {
    user?: {
      username?: string;
      open_id?: string;
      avatar_url?: string;
    };
  };
}

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

export async function GET(request: NextRequest) {
  const session = await getAuthSession();

  if (!session?.user) {
    return NextResponse.json(
      { error: { message: 'Unauthorized' } },
      { status: 401 }
    );
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

  const decryptedState = await decrypt<EncryptedState>(state ?? '');

  if (decryptedState.userId !== session.user.id) {
    return NextResponse.json(
      { error: { message: 'Invalid state' } },
      { status: 400 }
    );
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
      return NextResponse.json(
        { error: { message: 'Failed to encrypt config' } },
        { status: 500 }
      );
    }

    const userInfo = await getTiktokUserInfo({
      accessToken: data.access_token,
    });

    const userInfoData = (await userInfo.json()) as TikTokUserInfoResponse;

    const integration = await prisma.integration.create({
      data: {
        organizationId: session.activeOrganizationId,
        type: 'tiktok',
        encryptedConfig,
        displayName: userInfoData?.data?.user?.username || 'TikTok',
      },
    });

    // If the state is present, we need to update the block with the integration id
    if (decryptedState?.blockId) {
      const blockId = decryptedState.blockId;

      await prisma.block.update({
        where: { id: blockId },
        data: { integrationId: integration.id },
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/i/integration-callback/tiktok`
    );
  } catch (error) {
    captureException(error);
    return NextResponse.json(
      { error: { message: 'Error getting token' } },
      { status: 500 }
    );
  }
}
