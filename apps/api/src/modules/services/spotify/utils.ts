const url = 'https://accounts.spotify.com/api/token';

export async function requestToken({
  isRefreshToken,
  refreshToken,
  code,
}: {
  isRefreshToken?: boolean;
  refreshToken?: string;
  code?: string;
}) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization:
      'Basic ' +
      new Buffer(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64'),
  };

  const data = new URLSearchParams();

  if (isRefreshToken && refreshToken) {
    data.append('grant_type', 'refresh_token');
    data.append('refresh_token', refreshToken);
  } else {
    data.append('grant_type', 'authorization_code');
    data.append('code', Array.isArray(code) ? code[0] : code);
    data.append('redirect_uri', process.env.SPOTIFY_REDIRECT_URL ?? '');
  }

  return fetch(url, {
    method: 'POST',
    headers,
    body: data,
    cache: 'no-cache',
  });
}

export async function getSpotifyUserInfo(accessToken: string) {
  return fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
