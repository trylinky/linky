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

  return fetch(`https://api.lin.ky${path}`, {
    headers,
    body: requestOptions.body,
    ...requestOptions,
  });
};
