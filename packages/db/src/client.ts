import * as schema from './schema';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Db = NodePgDatabase<typeof schema>;

const SLOW_QUERY_THRESHOLD_MS = 50;

/**
 * pg's Pool is the only place every statement passes through, so timing is
 * wrapped here. Drizzle's Logger interface fires before execution and has
 * no duration, which is why it is not used for this.
 */
function timedPool(connectionString: string): Pool {
  const pool = new Pool({ connectionString, max: 1 });
  // pg's `query` has callback and promise overloads; Drizzle only uses the
  // promise form, so the wrapper is typed loosely and assigned through an
  // untyped view of the pool.
  const original = pool.query.bind(pool) as (...args: unknown[]) => Promise<unknown>;

  (pool as unknown as { query: unknown }).query = async (...args: unknown[]) => {
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
