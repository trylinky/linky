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
 * which is exactly the old behaviour. This path only makes sense when
 * DATABASE_URL is actually set (tests, local scripts); in a deployed Worker
 * there is no DATABASE_URL, and a handler reaching here means some route
 * skipped the request-context middleware. Fail loudly with that diagnosis
 * instead of falling through to an opaque connection error inside the
 * driver, or silently bypassing Hyperdrive if DATABASE_URL ever leaked in.
 */
let fallback: PrismaClient | undefined;

export function resolveClient(): PrismaClient {
  const scoped = store.getStore()?.prisma;

  if (scoped) {
    return scoped;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'prisma accessed outside a request context — did a route skip the requestContext middleware? ' +
        '(no AsyncLocalStorage store bound, and DATABASE_URL is unset, so there is no local fallback either)'
    );
  }

  if (!fallback) {
    fallback = createPrisma({
      HYPERDRIVE: { connectionString: process.env.DATABASE_URL },
    });
  }

  return fallback;
}

export default new Proxy({} as PrismaClient, {
  get: (_target, property, receiver) => {
    const client = resolveClient();
    const value = Reflect.get(client, property, receiver);

    // Bind methods to the real client: called through the proxy, `this`
    // would otherwise be the proxy itself. Prisma 7's $extends() result
    // happens to tolerate that today (it's a closure-based proxy that
    // doesn't rely on `this`), but that's an implementation detail of
    // Prisma's internals, not a contract — don't depend on it here.
    return typeof value === 'function' ? value.bind(client) : value;
  },
  has: (_target, property) => Reflect.has(resolveClient(), property),
  ownKeys: () => Reflect.ownKeys(resolveClient()),
  getOwnPropertyDescriptor: (_target, property) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(
      resolveClient(),
      property
    );

    // ownKeys must agree with a configurable descriptor, or V8's proxy
    // invariant check throws when something walks the keys (e.g.
    // Object.keys). The dummy `{}` target has no matching own properties,
    // so without this override the invariant trips immediately.
    return descriptor && { ...descriptor, configurable: true };
  },
  getPrototypeOf: () => Reflect.getPrototypeOf(resolveClient()),
}) as PrismaClient;
