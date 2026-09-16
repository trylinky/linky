import prisma, { createPrisma, resolveClient, runWithPrisma } from './prisma';
import { describe, expect, it } from 'vitest';

const testEnv = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
};

describe('request-scoped prisma', () => {
  it('resolves to the client bound to the current request', async () => {
    const client = createPrisma(testEnv);

    const insideStore = runWithPrisma(client, () => prisma);

    // The proxy must forward to the request's client, not a shared singleton.
    expect(await insideStore.page.count()).toEqual(await client.page.count());
  });

  it('keeps two concurrent requests on their own clients', async () => {
    const a = createPrisma(testEnv);
    const b = createPrisma(testEnv);
    const seen: unknown[] = [];

    await Promise.all([
      runWithPrisma(a, async () => {
        await new Promise((r) => setTimeout(r, 10));
        seen.push(resolveClient());
      }),
      runWithPrisma(b, async () => {
        seen.push(resolveClient());
      }),
    ]);

    expect(seen).toHaveLength(2);
    // Assert identity against a and b directly: a plain "not equal" would
    // also pass if the two contexts' clients were swapped.
    expect(seen).toContain(a);
    expect(seen).toContain(b);
    expect(seen[0]).not.toBe(seen[1]);
  });

  it('falls back to a lazily-built client outside any request', async () => {
    // Service-level tests call services directly, with no store set. They must
    // keep working without wiring a request context.
    await expect(prisma.page.count()).resolves.toBeTypeOf('number');
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

  it('supports "in" checks and Object.keys through the proxy, not the dummy target', () => {
    const client = createPrisma(testEnv);

    runWithPrisma(client, () => {
      expect('page' in prisma).toBe(true);
      expect(Object.keys(prisma)).toEqual(Object.keys(client));
    });
  });

  it('binds methods retrieved from the proxy to the resolved client, not the proxy', () => {
    const client = createPrisma(testEnv);

    // Extracting the method (as `$transaction(...)` calls happen through
    // destructuring or reassignment in some helpers) must not depend on the
    // proxy being the `this` at the call site. A real .bind() shows up as a
    // "bound " prefix on the function name.
    const transaction = runWithPrisma(client, () => prisma.$transaction);

    expect(transaction.name).toBe('bound $transaction');
  });
});
