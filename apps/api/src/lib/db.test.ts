import db, { createDb, resolveClient, runWithDb } from './db';
import { page } from '@trylinky/db/schema';
import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

const testEnv = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
};

const countPages = async (client: typeof db) =>
  (await client.select({ count: count() }).from(page))[0].count;

describe('request-scoped db', () => {
  it('resolves to the client bound to the current request', async () => {
    const { db: client, close } = createDb(testEnv);

    const insideStore = runWithDb(client, () => db);

    expect(await countPages(insideStore)).toEqual(await countPages(client));
    await close();
  });

  it('keeps two concurrent requests on their own clients', async () => {
    const a = createDb(testEnv);
    const b = createDb(testEnv);
    const seen: unknown[] = [];

    await Promise.all([
      runWithDb(a.db, async () => {
        await new Promise((r) => setTimeout(r, 10));
        seen.push(resolveClient());
      }),
      runWithDb(b.db, async () => {
        seen.push(resolveClient());
      }),
    ]);

    expect(seen).toHaveLength(2);
    expect(seen).toContain(a.db);
    expect(seen).toContain(b.db);
    expect(seen[0]).not.toBe(seen[1]);
    await Promise.all([a.close(), b.close()]);
  });

  it('falls back to a lazily-built client outside any request', async () => {
    await expect(countPages(db)).resolves.toBeTypeOf('number');
  });

  it('throws a clear error when accessed outside a request with no DATABASE_URL to fall back to', () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect(() => resolveClient()).toThrow(
        /accessed outside a request context/
      );
    } finally {
      process.env.DATABASE_URL = original;
    }
  });

  it('supports "in" checks and Object.keys through the proxy, not the dummy target', async () => {
    const { db: client, close } = createDb(testEnv);

    runWithDb(client, () => {
      expect('query' in db).toBe(true);
      expect(Object.keys(db)).toEqual(Object.keys(client));
    });
    await close();
  });

  it('binds methods retrieved from the proxy to the resolved client, not the proxy', async () => {
    const { db: client, close } = createDb(testEnv);

    const transaction = runWithDb(client, () => db.transaction);

    expect(transaction.name).toBe('bound transaction');
    await close();
  });

  it('does not throw when the underlying pool emits an idle client error', async () => {
    const { db: client, close } = createDb(testEnv);
    // drizzle() attaches the driver it was built with as `$client`; the
    // return type of createDb narrows that away, so reach it with a cast
    // (to the minimal EventEmitter shape used below, not `pg`'s `Pool` —
    // apps/api does not depend on `pg` directly) rather than widening the
    // public createDb/Db surface for this test.
    const pool = (
      client as unknown as {
        $client: { emit: (event: string, ...args: unknown[]) => boolean };
      }
    ).$client;

    try {
      expect(() =>
        pool.emit('error', new Error('idle client error'))
      ).not.toThrow();
    } finally {
      await close();
    }
  });
});
