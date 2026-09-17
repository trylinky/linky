import * as schema from './schema';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Db = NodePgDatabase<typeof schema>;

const SLOW_QUERY_THRESHOLD_MS = 50;
const wrapped = Symbol('queryTimingWrapped');

/**
 * Wraps a query method (on Pool or PoolClient) with timing logic.
 * Guards against double wrapping via a symbol marker.
 */
function wrapQueryTiming(obj: any): void {
  if (obj[wrapped]) return;

  const original = obj.query.bind(obj);

  (obj as unknown as { query: unknown }).query = function (
    ...args: unknown[]
  ): any {
    const before = Date.now();
    const lastArg = args[args.length - 1];
    const hasCallback = typeof lastArg === 'function';

    if (hasCallback) {
      // Callback form: client.query(sql, values, callback) -> undefined
      const callback = lastArg as any;
      const queryArgs = args.slice(0, -1);
      return original(...queryArgs, (err: any, result: any) => {
        const duration = Date.now() - before;
        if (duration >= SLOW_QUERY_THRESHOLD_MS) {
          const first = queryArgs[0];
          const text =
            typeof first === 'string'
              ? first
              : (first as { text?: string })?.text;
          console.log(
            `Slow query took ${duration}ms: ${(text ?? '').slice(0, 120)}`
          );
        }
        callback(err, result);
      });
    } else {
      // Promise form: client.query(sql, values) -> Promise
      const result = original(...args);
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = Date.now() - before;
          if (duration >= SLOW_QUERY_THRESHOLD_MS) {
            const first = args[0];
            const text =
              typeof first === 'string'
                ? first
                : (first as { text?: string })?.text;
            console.log(
              `Slow query took ${duration}ms: ${(text ?? '').slice(0, 120)}`
            );
          }
        });
      }
      return result;
    }
  };

  obj[wrapped] = true;
}

/**
 * Every pg pool.query() call internally goes through pool.connect(callback),
 * checks out a client, runs the query, and releases it. By wrapping clients
 * at connect time, we time each query exactly once whether it's plain or
 * inside a transaction.
 */
function timedPool(connectionString: string): Pool {
  const pool = new Pool({ connectionString, max: 1 });

  // pg-pool emits 'error' on the pool itself when an idle client in it
  // errors out (e.g. the connection is dropped by the server). Node's
  // EventEmitter throws if an 'error' event has no listener, which would
  // crash the whole request; @prisma/adapter-pg registered a handler for
  // this before the Drizzle port, so keep doing the same here.
  pool.on('error', (err) => {
    console.error('Idle database client error', err);
  });

  // Wrap pool.connect for BOTH callback and promise forms. Every pool.query
  // call goes through pool.connect, and transactions check out clients via
  // pool.connect as well, so this is the single point to wrap queries.
  const originalConnect = (pool.connect as any).bind(pool);
  (pool as unknown as { connect: unknown }).connect = function (
    callback?: any
  ): any {
    // Promise form - used by Drizzle for transactions
    if (!callback) {
      return originalConnect().then((client: any) => {
        wrapQueryTiming(client);
        return client;
      });
    }

    // Callback form - used by pool.query internally and legacy code
    return originalConnect((err: any, client: any, release: any) => {
      if (!err && client) {
        wrapQueryTiming(client);
      }
      callback(err, client, release);
    });
  };

  return pool;
}

export function createDb({ connectionString }: { connectionString: string }): {
  db: Db;
  close: () => Promise<void>;
} {
  const pool = timedPool(connectionString);
  const db = drizzle({ client: pool, schema });

  return { db, close: () => pool.end() };
}
