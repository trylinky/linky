import { createApp } from '@/app';
import { describe, expect, it } from 'vitest';

// Regression test for the final-review finding: `/:blockId` was registered
// before `/enabled-blocks` in index.ts, and Hono resolves competing GET
// patterns by registration order (unlike Fastify's find-my-way, which tried
// static children before parametric ones regardless of order). That bug
// shadowed `/enabled-blocks` behind the parametric handler, with `blockId`
// binding to the literal string "enabled-blocks" — silently emptying the
// editor's block picker in production.
//
// Both the correct handler and the shadowing one return 401 when
// unauthenticated, so status code alone doesn't distinguish them. Their
// *bodies* do: `getEnabledBlocksHandler` returns `c.json([], 401)`, while the
// shadowing `getBlockHandler` throws `HTTPException(401, { message:
// 'Unauthorized' })`, which Hono serializes as the plain-text body
// "Unauthorized" — not valid JSON. If `/:blockId` is ever moved back above
// `/enabled-blocks`, `response.json()` below throws a SyntaxError and this
// test fails.
const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
  AUTH_RATE_LIMIT: {
    limit: async () => ({ success: true }),
  },
} as unknown as Parameters<ReturnType<typeof createApp>['request']>[2];

describe('GET /blocks/enabled-blocks', () => {
  it('resolves to the enabled-blocks handler, not the shadowing /:blockId route', async () => {
    const response = await createApp().request(
      '/blocks/enabled-blocks',
      {},
      env
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual([]);
  });
});
