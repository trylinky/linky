import type { AuthenticatedSession } from '@/decorators/authenticate';
// Side-effect imports only: pull in `@fastify/sensible`'s and
// `fastify-raw-body`'s `declare module 'fastify'` augmentations
// (reply.notFound()/.forbidden()/etc., and request.rawBody) so the handlers
// in modules/billing and modules/pages that use them still typecheck. They
// used to get this for free because src/index.ts registered both plugins and
// every route went through that one file; now that index.ts is a Hono
// entrypoint that no longer touches Fastify at all, nothing else in the
// program pulls these types in. Remove once Tasks 12-16 port the last
// Fastify handler off both.
import '@fastify/sensible';
import 'fastify';
import 'fastify-raw-body';

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
