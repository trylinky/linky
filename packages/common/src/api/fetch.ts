export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
    },
    credentials: 'include',
  });

  return res.json();
}

export async function internalApiFetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${input}`, {
    ...init,
    headers: {
      ...init?.headers,
    },
    credentials: 'include',
  });

  return res.json();
}

/**
 * Fetcher for public, session-free endpoints that run on published pages.
 *
 * Published pages are served from user custom domains, which are not trusted
 * origins and therefore get CORS without `Access-Control-Allow-Credentials`.
 * A request sent with `credentials: 'include'` would have its response
 * rejected by the browser, so these must omit credentials.
 */
export async function publicApiFetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${input}`, {
    ...init,
    headers: {
      ...init?.headers,
    },
    credentials: 'omit',
  });

  return res.json();
}
