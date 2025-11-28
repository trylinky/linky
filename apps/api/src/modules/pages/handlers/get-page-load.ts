import prisma from '@/lib/prisma';
import { Static, Type } from '@fastify/type-provider-typebox';
import { FastifyRequest, FastifyReply } from 'fastify';

export const getPageLoadSchema = {
  params: Type.Object({
    pageId: Type.String(),
  }),
  response: {
    200: Type.Object({
      id: Type.String(),
      organizationId: Type.String(),
      publishedAt: Type.String(),
      metaTitle: Type.String(),
      metaDescription: Type.String(),
      slug: Type.String(),
      customDomain: Type.String(),
      blocks: Type.Array(
        Type.Object({
          id: Type.String(),
          type: Type.String(),
          config: Type.Object({}, { additionalProperties: true }),
          data: Type.Object({}, { additionalProperties: true }),
        })
      ),
    }),
  },
};

export async function getPageLoadHandler(
  request: FastifyRequest<{
    Params: Static<typeof getPageLoadSchema.params>;
  }>,
  response: FastifyReply
): Promise<Static<(typeof getPageLoadSchema.response)[200]>> {
  const { pageId } = request.params;

  const headers = request.headers;

  const apiKey = headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return response.forbidden();
  }

  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      id: pageId,
    },
    select: {
      id: true,
      publishedAt: true,
      organizationId: true,
      customDomain: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      blocks: true,
    },
  });

  return response.status(200).send(page);
}
