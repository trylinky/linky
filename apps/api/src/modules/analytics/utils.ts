import { FastifyRequest } from 'fastify';

export const getIpAddress = (request: FastifyRequest): string => {
  // No NODE_ENV short-circuit here: the API bundle inlines process.env at
  // build time, so an env-dependent branch can get baked into production.
  // In local dev there are no proxy headers, so request.ip already resolves
  // to 127.0.0.1 via the fallback chain.
  const defaultIpAddress = '127.0.0.1';

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
