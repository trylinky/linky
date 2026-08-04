import type { AppBindings } from '@/env';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time comparison, so a wrong key cannot be narrowed down by timing
 * how long the rejection takes.
 */
function matchesSecret(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);

  // timingSafeEqual throws on a length mismatch, which would leak the length.
  if (providedBytes.length !== expectedBytes.length) {
    return false;
  }

  return timingSafeEqual(providedBytes, expectedBytes);
}

/** Authenticates server-to-server callers via the shared internal API key. */
export const requireApiKey: MiddlewareHandler<AppBindings> = async (
  c,
  next
) => {
  const expected = process.env.INTERNAL_API_KEY;
  const provided = c.req.header('x-api-key');

  const isValid = Boolean(
    expected && provided && matchesSecret(provided, expected)
  );

  if (!isValid) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  await next();
};
