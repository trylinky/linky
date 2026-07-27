// Deliberately not importing the app instance for `httpErrors`: that creates a
// cycle back through src/index.ts, which boots the server on import.
import { httpErrors } from '@fastify/sensible';
import { FastifyReply, FastifyRequest } from 'fastify';
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

/**
 * Authenticates server-to-server callers via the shared internal API key.
 *
 * This was previously declared on FastifyInstance but never registered, so
 * every route calling it threw "authenticateApiKey is not a function" and
 * returned a 500 instead of running.
 */
export async function authenticateApiKeyDecorator(
  request: FastifyRequest,
  reply: FastifyReply,
  options: {
    throwError?: boolean;
  } = {
    throwError: true,
  }
): Promise<boolean> {
  const expected = process.env.INTERNAL_API_KEY;
  const header = request.headers['x-api-key'];
  const provided = Array.isArray(header) ? header[0] : header;

  const isValid = Boolean(
    expected && provided && matchesSecret(provided, expected)
  );

  if (!isValid && options.throwError) {
    throw httpErrors.unauthorized();
  }

  return isValid;
}
