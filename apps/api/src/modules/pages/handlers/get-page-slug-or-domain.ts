import prisma from '@/lib/prisma';
import { Static, Type } from '@fastify/type-provider-typebox';
import { captureException } from '@sentry/node';
import { FastifyRequest, FastifyReply } from 'fastify';
import safeAwait from 'safe-await';

export const getPageBySlugOrDomainSchema = {
  query: Type.Object({
    slug: Type.String(),
    domain: Type.String(),
  }),
  response: {
    200: Type.Object({
      id: Type.String(),
      organizationId: Type.String(),
      slug: Type.String(),
      publishedAt: Type.Union([Type.String(), Type.Null()]),
    }),
    500: Type.Object({
      error: Type.String(),
    }),
  },
};

export async function getPageBySlugOrDomainHandler(
  request: FastifyRequest<{
    Querystring: Static<typeof getPageBySlugOrDomainSchema.query>;
  }>,
  response: FastifyReply
): Promise<Static<(typeof getPageBySlugOrDomainSchema.response)[200]>> {
  const { slug, domain } = request.query;

  const headers = request.headers;

  const apiKey = headers['x-api-key'];

  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return response.forbidden();
  }

  const appDomain = new URL(process.env.APP_FRONTEND_URL as string);
  const rootDomain =
    process.env.NODE_ENV === 'production'
      ? appDomain.hostname
      : `${appDomain.hostname}:${appDomain.port}`;

  const customDomain = decodeURIComponent(domain) !== rootDomain;

  const [error, page] = await safeAwait(
    prisma.page.findFirst({
      where: {
        deletedAt: null,
        slug: customDomain ? undefined : slug,
        customDomain: customDomain ? decodeURIComponent(domain) : undefined,
      },
      select: {
        id: true,
        organizationId: true,
        publishedAt: true,
        slug: true,
      },
    })
  );

  if (error) {
    console.error(error);
    captureException(error);
    return response.internalServerError();
  }

  if (!page) {
    return response.notFound();
  }

  return response.status(200).send(page);
}
