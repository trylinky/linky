import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function coreRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    handler: async (req: FastifyRequest, res: FastifyReply) => {
      return res.status(200).send({
        message: 'Welcome to the Linky API',
      });
    },
  });

  fastify.get('/ping', {
    handler: async (req: FastifyRequest, res: FastifyReply) => {
      return res.status(200).send({
        ping: 'pong',
      });
    },
  });

  fastify.get('/session/me', {
    handler: async (req: FastifyRequest, res: FastifyReply) => {
      const session = await req.server.authenticate(req, res);

      return res.status(200).send({
        session,
      });
    },
  });
}
