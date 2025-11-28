export const apiServerFetch = async (
  path: string,
  requestOptions: RequestInit = {}
) => {
  const headers: Record<string, string> = (requestOptions.headers as Record<
    string,
    string
  >) || {
    'Content-Type': 'application/json',
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lin.ky';

  return fetch(`${baseUrl}/api${path}`, {
    headers,
    body: requestOptions.body,
    ...requestOptions,
  });
};
