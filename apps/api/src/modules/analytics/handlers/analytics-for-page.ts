import prisma from '@/lib/prisma';
import { fetchTopLocations } from '@/modules/analytics/service';
import { fetchStats } from '@/modules/analytics/service';
import { checkUserHasAccessToPage } from '@/modules/pages/service';
import { Static, Type } from '@fastify/type-provider-typebox';
import { captureException } from '@sentry/node';
import { FastifyReply, FastifyRequest } from 'fastify';

export const getPageAnalyticsSchema = {
  params: Type.Object({
    pageId: Type.String(),
  }),
  response: {
    200: Type.Object({
      stats: Type.Object({
        totals: Type.Object({
          views: Type.Number(),
          uniqueVisitors: Type.Number(),
        }),
        data: Type.Array(
          Type.Object({
            date: Type.String(),
            total_views: Type.Number(),
            unique_visitors: Type.Number(),
          })
        ),
      }),
      locations: Type.Array(
        Type.Object({
          location: Type.String(),
          visits: Type.Number(),
          hits: Type.Number(),
        })
      ),
    }),
  },
};

export async function getPageAnalyticsHandler(
  request: FastifyRequest<{
    Params: Static<typeof getPageAnalyticsSchema.params>;
  }>,
  response: FastifyReply
): Promise<Static<(typeof getPageAnalyticsSchema.response)[200]>> {
  const { pageId } = request.params;

  const session = await request.server.authenticate(request, response);

  const userHasAccess = await checkUserHasAccessToPage(pageId, session.user.id);

  if (!userHasAccess) {
    return response.status(403).send({});
  }

  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      deletedAt: null,
    },
    select: {
      createdAt: true,
    },
    take: 1,
  });

  if (!page) {
    return response.status(404).send({});
  }

  // If the page was created less than 7 days ago, return null
  if (
    new Date(page.createdAt).getTime() >
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).getTime()
  ) {
    return response.status(400).send({
      error: {
        code: 'NOT_ENOUGH_DATA',
        message: 'There is not enough data to show analytics yet.',
      },
    });
  }

  try {
    const [stats, topLocations] = await Promise.all([
      fetchStats(pageId),
      fetchTopLocations(pageId),
    ]);

    return response.status(200).send({
      stats,
      locations: topLocations,
    });
  } catch (error) {
    captureException(error);
    return response.status(500).send({});
  }
}
