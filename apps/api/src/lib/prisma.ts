import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@trylinky/prisma';
import { AsyncLocalStorage } from 'node:async_hooks';

// Synchronous console I/O on every query is a measurable tax in production,
// so only surface genuinely slow queries.
const SLOW_QUERY_THRESHOLD_MS = 50;

/**
 * Workers cannot reuse an object holding a socket opened during another
 * request — doing so throws "Cannot perform I/O on behalf of a different
 * request". So the client is built per request and reached through an
 * AsyncLocalStorage store, which leaves all 40 `import prisma` sites
 * unchanged.
 */
const store = new AsyncLocalStorage<{ prisma: PrismaClient }>();

export function createPrisma(env: {
  HYPERDRIVE: { connectionString: string };
}): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: env.HYPERDRIVE.connectionString,
  });

  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const before = Date.now();
        const result = await query(args);
        const duration = Date.now() - before;

        if (duration >= SLOW_QUERY_THRESHOLD_MS) {
          console.log(`Slow query ${model}.${operation} took ${duration}ms`);
        }

        return result;
      },
    },
  }) as unknown as PrismaClient;
}

export function runWithPrisma<T>(prisma: PrismaClient, fn: () => T): T {
  return store.run({ prisma }, fn);
}

/**
 * Outside a request — service-level unit tests, and local scripts — there is
 * no store. Fall back to a process-lifetime client built from DATABASE_URL,
 * which is exactly the old behaviour.
 */
let fallback: PrismaClient | undefined;

export function resolveClient(): PrismaClient {
  const scoped = store.getStore()?.prisma;

  if (scoped) {
    return scoped;
  }

  if (!fallback) {
    fallback = createPrisma({
      HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
    });
  }

  return fallback;
}

export default new Proxy({} as PrismaClient, {
  get: (_target, property, receiver) =>
    Reflect.get(resolveClient(), property, receiver),
}) as PrismaClient;
