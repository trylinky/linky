import { createDb as createDbClient, type Db } from '@trylinky/db';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Workers cannot reuse an object holding a socket opened during another
 * request; doing so throws "Cannot perform I/O on behalf of a different
 * request". So the client is built per request and reached through an
 * AsyncLocalStorage store, which leaves every `import db` site unchanged.
 */
const store = new AsyncLocalStorage<{ db: Db }>();

export function createDb(env: { HYPERDRIVE: { connectionString: string } }) {
  return createDbClient({ connectionString: env.HYPERDRIVE.connectionString });
}

export function runWithDb<T>(db: Db, fn: () => T): T {
  return store.run({ db }, fn);
}

/**
 * Outside a request (service-level tests, local scripts) there is no store.
 * Fall back to a process-lifetime client built from DATABASE_URL. In a
 * deployed Worker there is no DATABASE_URL, so reaching this means a route
 * skipped the request-context middleware: fail loudly with that diagnosis.
 */
let fallback: Db | undefined;

export function resolveClient(): Db {
  const scoped = store.getStore()?.db;

  if (scoped) {
    return scoped;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'db accessed outside a request context — did a route skip the requestContext middleware? ' +
        '(no AsyncLocalStorage store bound, and DATABASE_URL is unset, so there is no local fallback either)'
    );
  }

  if (!fallback) {
    fallback = createDb({
      HYPERDRIVE: { connectionString: process.env.DATABASE_URL },
    }).db;
  }

  return fallback;
}

export default new Proxy({} as Db, {
  get: (_target, property, receiver) => {
    const client = resolveClient();
    const value = Reflect.get(client, property, receiver);

    // Bind methods to the real client: called through the proxy, `this`
    // would otherwise be the proxy itself.
    return typeof value === 'function' ? value.bind(client) : value;
  },
  has: (_target, property) => Reflect.has(resolveClient(), property),
  ownKeys: () => Reflect.ownKeys(resolveClient()),
  getOwnPropertyDescriptor: (_target, property) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(resolveClient(), property);

    // ownKeys must agree with a configurable descriptor, or V8's proxy
    // invariant check throws when something walks the keys.
    return descriptor && { ...descriptor, configurable: true };
  },
  getPrototypeOf: () => Reflect.getPrototypeOf(resolveClient()),
}) as Db;
