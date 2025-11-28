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
