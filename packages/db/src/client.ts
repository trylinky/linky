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

  const original = obj.query.bind(obj) as (...args: unknown[]) => Promise<unknown>;

  (obj as unknown as { query: unknown }).query = async (...args: unknown[]) => {
    const before = Date.now();
    try {
      return await original(...args);
    } finally {
      const duration = Date.now() - before;
      if (duration >= SLOW_QUERY_THRESHOLD_MS) {
        const first = args[0];
        const text = typeof first === 'string' ? first : (first as { text?: string })?.text;
        console.log(`Slow query took ${duration}ms: ${(text ?? '').slice(0, 120)}`);
      }
    }
  };

  obj[wrapped] = true;
}

/**
 * pg's Pool is the only place every statement passes through, so timing is
 * wrapped here. Drizzle's Logger interface fires before execution and has
 * no duration, which is why it is not used for this.
 *
 * Additionally, wraps pool.connect so checked-out PoolClients (used in
 * transactions) also have their queries timed.
 */
function timedPool(connectionString: string): Pool {
  const pool = new Pool({ connectionString, max: 1 });

  // Wrap the pool's query method
  wrapQueryTiming(pool);

  // Wrap pool.connect so checked-out clients are wrapped before use
  const originalConnect = (pool.connect as any).bind(pool);
  (pool as unknown as { connect: unknown }).connect = function(callback?: any): any {
    // Handle callback form (not used by Drizzle, but be safe)
    if (typeof callback === 'function') {
      return originalConnect(callback);
    }
    // Promise form - used by Drizzle
    return originalConnect().then((client: any) => {
      wrapQueryTiming(client);
      return client;
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
