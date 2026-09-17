import type { createApp } from '@/app';
import type { AuthenticatedSession } from '@/middleware/authenticate';

type RequestEnv = Parameters<ReturnType<typeof createApp>['request']>[2];

/**
 * The env every route test passes to `app.request`. Mirrors the shape used
 * ad hoc in forms/routes.test.ts; the optional session flows through the
 * Vitest-only TEST_SESSION bypass in middleware/authenticate.ts.
 */
export function testEnv(session?: AuthenticatedSession): RequestEnv {
  return {
    HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
    AUTH_RATE_LIMIT: { limit: async () => ({ success: true }) },
    AUTH_STRICT_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...(session ? { TEST_SESSION: session } : {}),
  } as unknown as RequestEnv;
}
