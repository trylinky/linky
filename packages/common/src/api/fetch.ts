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
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api${input}`, {
    ...init,
    headers: {
      ...init?.headers,
    },
    credentials: 'include',
  });

  return res.json();
}
