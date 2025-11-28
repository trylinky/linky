'server-only';

import { decrypt, encrypt } from '@/lib/encrypt';
import prisma from '@/lib/prisma';
import { captureException, captureMessage } from '@sentry/nextjs';
import { SpotifyIntegrationConfig } from '@trylinky/blocks';
import safeAwait from 'safe-await';

/**
 * Refreshes the Spotify access token using the provided refresh token.
 * @param refreshToken The refresh token for the Spotify API.
 * @returns A promise resolving to the new access token and refresh token.
 */
async function refreshToken({ refreshToken }: { refreshToken: string }) {
  return fetch(`https://accounts.spotify.com/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ':' +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.SPOTIFY_CLIENT_ID as string,
    }),
  });
}

/**
 * Fetches the currently playing track for the user.
 * @param accessToken The Spotify access token.
 * @returns A promise resolving to the currently playing track or null.
 */
async function fetchPlayingNow(accessToken: string) {
  return fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 45 },
  });
}

/**
 * Fetches the most recently played track for the user.
 * @param accessToken The Spotify access token.
 * @returns A promise resolving to the recently played track or null.
 */
function fetchRecentlyPlayed(accessToken: string) {
  return fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 60 },
  });
}

/**
 * Fetches Spotify data (currently playing or recently played track).
 * @param config Spotify integration configuration.
 * @param isRetry Indicates whether this is a retry attempt.
 * @param integrationId The ID of the Spotify integration.
 * @returns A promise resolving to track data or null.
 */
const fetchSpotifyData = async (
  config: SpotifyIntegrationConfig,
  isRetry: boolean = false,
  integrationId: string
) => {
  const updateAccessToken =
    async (): Promise<SpotifyIntegrationConfig | null> => {
      try {
        const refreshTokenResponse = await refreshToken({
          refreshToken: config.refreshToken,
        });

        const refreshTokenData = await refreshTokenResponse.json();

        if (refreshTokenData?.access_token) {
          const newConfig: SpotifyIntegrationConfig = {
            accessToken: refreshTokenData.access_token,
            refreshToken: refreshTokenData.refresh_token ?? config.refreshToken,
          };

          const [updateError] = await safeAwait(
            prisma.integration.update({
              where: { id: integrationId },
              data: { encryptedConfig: await encrypt(newConfig) },
            })
          );

          if (updateError) captureException(updateError);

          return newConfig;
        }
      } catch (error) {
        captureException(error);
      }
      return null;
    };

  const fetchData = async (
    fetchFunction: (token: string) => Promise<Response>,
    token: string
  ) => {
    const [error, response] = await safeAwait(fetchFunction(token));

    if (error) {
      captureException(error);
      return {
        data: null,
        statusCode: 401,
      };
    }

    // Spotify returns 204 if the user is not playing anything, which is a
    // successful response, so we need to handle it accordingly.
    if (response?.status === 204) {
      return {
        data: null,
        statusCode: 204,
      };
    }

    if (response?.ok) {
      const data = await response.json();

      return {
        data,
        statusCode: response.status,
      };
    }

    return {
      data: null,
      statusCode: response?.status || 401,
    };
  };

  const processTrackData = (data: any, isPlayingNow: boolean) => {
    if (data?.item || data?.items?.length) {
      const track = isPlayingNow ? data.item : data.items[0]?.track;
      return {
        artistName: track?.artists?.[0]?.name,
        name: track?.name,
        imageUrl: track?.album?.images?.[2]?.url,
        hyperlink: track?.external_urls?.spotify,
        isPlayingNow,
      };
    }
    return null;
  };

  // Try fetching currently playing track

  let playingNowResponse = await fetchData(fetchPlayingNow, config.accessToken);

  // Handle token refresh if necessary
  if (
    (!playingNowResponse.data || playingNowResponse?.statusCode === 401) &&
    !isRetry
  ) {
    const newConfig = await updateAccessToken();

    if (newConfig) {
      playingNowResponse = await fetchData(
        fetchPlayingNow,
        newConfig.accessToken
      );

      // 200 and 204 are successful responses from Spotify
      if ([200, 204].includes(playingNowResponse.statusCode)) {
        config = newConfig; // Update config for further requests
      }
    }
  }

  // If a currently playing track is found, return it
  const playingNowTrack = processTrackData(playingNowResponse.data, true);

  if (playingNowTrack) return playingNowTrack;

  // Fallback to recently played track

  const recentlyPlayedData = await fetchData(
    fetchRecentlyPlayed,
    config.accessToken
  );

  return processTrackData(recentlyPlayedData.data, false);
};

/**
 * Fetches Spotify data for the specified block.
 * @param blockId The ID of the block.
 * @returns A promise resolving to the Spotify track data or error state.
 */
export const fetchData = async (blockId: string) => {
  try {
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      select: {
        integration: {
          where: { type: 'spotify' },
          select: { id: true, encryptedConfig: true },
        },
      },
    });

    const integration = block?.integration;

    if (!integration || !integration.encryptedConfig) {
      return { noIntegration: true, data: null };
    }

    const [decryptedConfigError, decryptedConfig] = await safeAwait(
      decrypt<SpotifyIntegrationConfig>(integration.encryptedConfig)
    );

    if (decryptedConfigError) {
      captureException(decryptedConfigError);
      return { data: null };
    }

    if (!decryptedConfig.accessToken) {
      captureMessage(
        `Spotify token missing: Integration ID: ${integration.id}`
      );
      return { data: null };
    }

    const spotifyData = await fetchSpotifyData(
      decryptedConfig,
      false,
      integration.id
    );
    return { data: spotifyData };
  } catch (error) {
    captureException(error);
    return { data: null };
  }
};
