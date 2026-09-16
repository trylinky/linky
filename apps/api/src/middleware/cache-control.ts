import type { AppBindings } from '@/env';
import type { MiddlewareHandler } from 'hono';

/**
 * Default to no-store, but let individual routes opt into caching by setting
 * their own Cache-Control header.
 */
export const cacheControl: MiddlewareHandler<AppBindings> = async (c, next) => {
  await next();

  if (!c.res.headers.get('Cache-Control')) {
    c.res.headers.set('Cache-Control', 'no-store, must-revalidate');
  }
};
