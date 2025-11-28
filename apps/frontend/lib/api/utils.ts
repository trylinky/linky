import { headers } from 'next/headers';

export const getIpAddress = async (): Promise<string> => {
  const defaultIpAddress = '127.0.0.1';

  if (process.env.NODE_ENV === 'development') {
    return defaultIpAddress;
  }

  const headersList = await headers();

  const xForwardedFor = headersList.get('x-forwarded-for');
  const xRealIp = headersList.get('x-real-ip');

  return (
    xForwardedFor?.split(',')[0]?.trim() || xRealIp || defaultIpAddress
  );
};
