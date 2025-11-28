export const tiktokScopes = [
  'user.info.basic',
  'user.info.profile',
  'user.info.stats',
  'video.list',
];

export async function requestToken({ code }: { code: string }) {
  if (!process.env.TIKTOK_CLIENT_KEY) {
    throw new Error('Missing TIKTOK_CLIENT_KEY');
  }

  if (!process.env.TIKTOK_CLIENT_SECRET) {
    throw new Error('Missing TIKTOK_CLIENT_SECRET');
  }

  if (!process.env.TIKTOK_CALLBACK_URL) {
    throw new Error('Missing TIKTOK_CALLBACK_URL');
  }

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const options = {
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.TIKTOK_CALLBACK_URL,
    code,
  };

  return fetch(`https://open.tiktokapis.com/v2/oauth/token/`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(options),
  });
}

export async function refreshLongLivedToken({
  refreshToken,
}: {
  refreshToken: string;
}) {
  if (!process.env.TIKTOK_CLIENT_SECRET) {
    throw new Error('Missing TIKTOK_CLIENT_SECRET');
  }

  return fetch(`https://open.tiktokapis.com/v2/oauth/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
}

export async function getTiktokUserInfo({
  accessToken,
}: {
  accessToken: string;
}) {
  const url = new URL('https://open.tiktokapis.com/v2/user/info/');

  const qs = new URLSearchParams({
    fields: 'username',
  });

  url.search = qs.toString();

  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
