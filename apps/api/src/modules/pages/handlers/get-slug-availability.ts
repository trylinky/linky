import prisma from '@/lib/prisma';
import { Static, Type } from '@fastify/type-provider-typebox';
import { FastifyRequest, FastifyReply } from 'fastify';

export const getSlugAvailabilitySchema = {
  querystring: Type.Object({
    slug: Type.String(),
  }),
  response: {
    200: Type.Object({
      isAvailable: Type.Boolean(),
    }),
  },
};

export async function getSlugAvailabilityHandler(
  request: FastifyRequest<{
    Querystring: Static<typeof getSlugAvailabilitySchema.querystring>;
  }>,
  response: FastifyReply
): Promise<Static<(typeof getSlugAvailabilitySchema.response)[200]>> {
  const { slug } = request.query;

  const headers = request.headers;

  const page = await prisma.page.count({
    where: {
      deletedAt: null,
      slug: slug,
    },
  });

  return response.status(200).send({
    isAvailable: page === 0,
  });
}
