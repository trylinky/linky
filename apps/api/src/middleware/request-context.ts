import type { AppBindings } from '@/env';
import { createAuth } from '@/lib/auth';
import { createDb, runWithDb } from '@/lib/db';
import type { MiddlewareHandler } from 'hono';
import { AsyncLocalStorage } from 'node:async_hooks';

type Auth = ReturnType<typeof createAuth>;

const authStore = new AsyncLocalStorage<Auth>();

/**
 * better-auth holds the database adapter, so it inherits the per-request
 * lifetime. It is reached through a store rather than the Hono context so
 * that lib/* modules can use it without taking a Context parameter.
 */
export function getAuth(): Auth {
  const auth = authStore.getStore();

  if (!auth) {
    throw new Error('getAuth() called outside a request context');
  }

  return auth;
}

/** Must be the first middleware registered — everything downstream needs it. */
export const requestContext: MiddlewareHandler<AppBindings> = async (
  c,
  next
) => {
  const { db, close } = createDb(c.env);

  try {
    await runWithDb(db, () => authStore.run(createAuth(), next));
  } finally {
    // Closing a pool that already lost its socket is not an error worth
    // surfacing; the request has finished either way.
    const closing = close().catch(() => undefined);
    try {
      // Let the response go out first; the pool holds one socket.
      c.executionCtx.waitUntil(closing);
    } catch {
      // No execution context (app.request() in tests): it settles on its own.
    }
  }
};
