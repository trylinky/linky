import { headers } from 'next/headers';
import 'server-only';

export const apiServerFetch = async (
  path: string,
  requestOptions: RequestInit = {}
) => {
  const headersList = await headers();

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      cookie: headersList.get('cookie') || '',
    },
  });
};
