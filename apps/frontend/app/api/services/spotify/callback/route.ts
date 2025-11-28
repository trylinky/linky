import { getAuthSession } from '@/lib/api/auth';
import {
  getSpotifyUserInfo,
  requestToken,
} from '@/lib/api/services/spotify/utils';
import { decrypt, encrypt } from '@/lib/encrypt';
import { prisma } from '@/lib/prisma';
import { captureException } from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

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
  [key: string]: unknown;
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
    return NextResponse.json({ error: 'Error getting token' }, { status: 400 });
  }

  try {
    const res = await requestToken({ code });
    const json = (await res.json()) as SpotifyTokenResponse;

    if (!json.access_token) {
      return NextResponse.json(
        { error: 'Error getting access_token' },
        { status: 500 }
      );
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

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/i/integration-callback/spotify`
    );
  } catch (error) {
    console.log('Error', error);
    captureException(error);

    return NextResponse.json({ error: 'Error getting token' }, { status: 500 });
  }
}
