import type { AuthenticatedSession } from '@/decorators/authenticate';
import 'fastify';

/**
 * These declarations previously referenced `HttpError` and `FastifyReply`
 * without importing them. `skipLibCheck` hid the resulting errors and TypeScript
 * fell back to `any`, which made the whole `authenticate` return type `any` and
 * left every route handler's `session` unchecked. That is how the
 * `session.currentOrganizationId` typo in modules/blocks and the missing
 * `authenticateApiKey` decorator both went unnoticed.
 */
declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
    // `rawBody` is declared by fastify-raw-body; re-declaring it here with a
    // narrower type conflicts with that declaration.
  }

  interface FastifyInstance {
    /**
     * Resolves the caller's session. Throws a 401 when there is none, unless
     * `throwError: false` is passed, in which case it resolves to null.
     */
    authenticate: {
      (
        request: FastifyRequest,
        reply: FastifyReply
      ): Promise<AuthenticatedSession>;
      (
        request: FastifyRequest,
        reply: FastifyReply,
        options: { throwError?: true }
      ): Promise<AuthenticatedSession>;
      (
        request: FastifyRequest,
        reply: FastifyReply,
        options: { throwError: false }
      ): Promise<AuthenticatedSession | null>;
    };

    /**
     * Authenticates a server-to-server caller via the internal API key.
     * Throws a 401 unless `throwError: false` is passed.
     */
    authenticateApiKey: (
      request: FastifyRequest,
      reply: FastifyReply,
      options?: { throwError?: boolean }
    ) => Promise<boolean>;
  }
}
