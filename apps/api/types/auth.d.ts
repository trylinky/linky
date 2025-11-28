import fastify from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    startTime?: number;
    rawBody?: string;
  }
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
      options?: {
        throwError?: boolean;
      }
    ) => Promise<{ user: { id: string } } | HttpError>;
    authenticateApiKey: (
      request: FastifyRequest,
      reply: FastifyReply,
      options?: {
        throwError?: boolean;
      }
    ) => Promise<boolean | HttpError>;
  }
}
