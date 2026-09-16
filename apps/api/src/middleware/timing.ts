import type { AppBindings } from '@/env';
import type { MiddlewareHandler } from 'hono';

const SLOW_REQUEST_THRESHOLD_MS = 200;

export const timing: MiddlewareHandler<AppBindings> = async (c, next) => {
  const startTime = Date.now();

  await next();

  const responseTime = Date.now() - startTime;

  if (responseTime > SLOW_REQUEST_THRESHOLD_MS) {
    console.warn(
      JSON.stringify({ url: c.req.url, responseTime, msg: 'Slow request' })
    );
  }
};
