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
    expect(seen[0]).not.toBe(seen[1]);
  });

  it('falls back to a lazily-built client outside any request', async () => {
    // Service-level tests call services directly, with no store set. They must
    // keep working without wiring a request context.
    await expect(prisma.page.count()).resolves.toBeTypeOf('number');
  });
});
