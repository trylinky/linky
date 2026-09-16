import type { AppBindings } from '@/env';
import { createAuth } from '@/lib/auth';
import { createPrisma, runWithPrisma } from '@/lib/prisma';
import type { MiddlewareHandler } from 'hono';
import { AsyncLocalStorage } from 'node:async_hooks';

type Auth = ReturnType<typeof createAuth>;

const authStore = new AsyncLocalStorage<Auth>();

/**
 * better-auth holds the Prisma adapter, so it inherits Prisma's per-request
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
export const requestContext: MiddlewareHandler<AppBindings> = (c, next) =>
  runWithPrisma(createPrisma(c.env), () => authStore.run(createAuth(), next));
