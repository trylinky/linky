import { FastifyRequest } from 'fastify';

export const getIpAddress = (request: FastifyRequest): string => {
  const defaultIpAddress = '127.0.0.1';

  if (process.env.NODE_ENV === 'development') {
    return defaultIpAddress;
  }

  const ip = request.ip;

  const xForwardedFor = request.headers['x-forwarded-for'];
  const xRealIp = request.headers['x-real-ip'];

  return (
    (xForwardedFor as string)?.split(',')[0]?.trim() ||
    (xRealIp as string) ||
    ip ||
    defaultIpAddress
  );
};
