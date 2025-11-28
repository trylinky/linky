import { captureException } from '@sentry/nextjs';

export async function fetchData(spotifyAssetUrl: string) {
  try {
    const req = await fetch(
      `https://open.spotify.com/oembed?url=${spotifyAssetUrl}`,
      {
        method: 'GET',
      }
    );

    const data = await req.json();

    if (data.error) {
      captureException(new Error(data.error));
      return null;
    }

    return data;
  } catch (error) {
    captureException(error);

    return null;
  }
}
