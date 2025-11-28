export async function requestToken({ code }: { code: string }) {
  if (!process.env.THREADS_CLIENT_ID) {
    throw new Error('Missing THREADS_CLIENT_ID');
  }

  if (!process.env.THREADS_CLIENT_SECRET) {
    throw new Error('Missing THREADS_CLIENT_SECRET');
  }

  if (!process.env.THREADS_CALLBACK_URL) {
    throw new Error('Missing THREADS_CALLBACK_URL');
  }

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const options = {
    client_id: process.env.THREADS_CLIENT_ID,
    client_secret: process.env.THREADS_CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: process.env.THREADS_CALLBACK_URL,
    code,
  };

  return fetch(`https://graph.threads.net/oauth/access_token`, {
    method: 'POST',
    headers,
    body: new URLSearchParams(options),
  });
}

export async function requestLongLivedToken({
  accessToken,
}: {
  accessToken: string;
}) {
  if (!process.env.THREADS_CLIENT_SECRET) {
    throw new Error('Missing THREADS_CLIENT_SECRET');
  }

  const options = {
    grant_type: 'th_exchange_token',
    client_secret: process.env.THREADS_CLIENT_SECRET,
    access_token: accessToken,
  };

  const qs = new URLSearchParams(options).toString();

  return fetch(`https://graph.threads.net/access_token?${qs}`, {
    method: 'GET',
  });
}

export async function refreshLongLivedToken({
  accessToken,
}: {
  accessToken: string;
}) {
  if (!process.env.THREADS_CLIENT_SECRET) {
    throw new Error('Missing THREADS_CLIENT_SECRET');
  }

  const options = {
    grant_type: 'th_refresh_token',
    access_token: accessToken,
  };

  const qs = new URLSearchParams(options).toString();

  return fetch(`https://graph.threads.net/refresh_access_token?${qs}`, {
    method: 'GET',
  });
}

export async function getThreadsUserInfo({
  accessToken,
}: {
  accessToken: string;
}) {
  const url = new URL('https://graph.threads.net/me');

  const qs = new URLSearchParams({
    access_token: accessToken,
    fields: 'username',
  });

  url.search = qs.toString();

  return fetch(url.toString(), {
    method: 'GET',
  });
}
