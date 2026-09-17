import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { upgradeRequired } from '@/lib/upgrade-required';
import { requireSession } from '@/middleware/authenticate';
import { fetchStats, fetchTopLocations } from '@/modules/analytics/service';
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import { checkUserHasAccessToPage } from '@/modules/pages/service';
import { captureException } from '@sentry/cloudflare';
import type { Context } from 'hono';

const MINIMUM_PAGE_AGE_DAYS = 3;

// Bound to the route's literal path so `c.req.param('pageId')` below comes
// back as `string`, not `string | undefined` — see the comment on the
// factory in forms/index.ts.
export async function getPageAnalyticsHandler(
  c: Context<AppBindings, '/pages/:pageId'>
) {
  const pageId = c.req.param('pageId');
  const session = requireSession(c);

  const userHasAccess = await checkUserHasAccessToPage(pageId, session.user.id);

  if (!userHasAccess) {
    return c.json({}, 403);
  }

  const row = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.id, pageId), isNull(p.deletedAt)),
    columns: { createdAt: true, organizationId: true },
  });

  if (!row) {
    return c.json({}, 404);
  }

  if (!row.organizationId) {
    return c.json({}, 404);
  }

  const entitlements = await getEntitlementsForOrganization(
    row.organizationId,
    session.user.id
  );

  if (!entitlements.features.analytics) {
    return upgradeRequired(c, 'analytics', {
      organizationId: row.organizationId,
      userId: session.user.id,
      tier: entitlements.tier,
    });
  }

  // Too new to have meaningful analytics yet. The comment here used to say
  // 7 days while the code used 3; 3 is the behaviour that shipped.
  const minimumAgeMs = MINIMUM_PAGE_AGE_DAYS * 24 * 60 * 60 * 1000;

  if (new Date(row.createdAt).getTime() > Date.now() - minimumAgeMs) {
    return c.json(
      {
        error: {
          code: 'NOT_ENOUGH_DATA',
          message: 'There is not enough data to show analytics yet.',
        },
      },
      400
    );
  }

  try {
    const [stats, topLocations] = await Promise.all([
      fetchStats(pageId),
      fetchTopLocations(pageId),
    ]);

    // The old Fastify response schema listed `stats.data` and `locations` as
    // arrays of objects with an explicit property list
    // (date/total_views/unique_visitors and location/visits/hits), which
    // fast-json-stringify used to strip any other key off each element
    // before it reached the client — Tinybird's pipes are not contractually
    // limited to exactly these fields. Hono has no equivalent serialization
    // step, so the same trim is done by hand here rather than spreading the
    // raw rows through.
    return c.json(
      {
        stats: stats
          ? {
              totals: stats.totals,
              data: stats.data.map(
                (row: {
                  date: string;
                  total_views: number;
                  unique_visitors: number;
                }) => ({
                  date: row.date,
                  total_views: row.total_views,
                  unique_visitors: row.unique_visitors,
                })
              ),
            }
          : null,
        locations: Array.isArray(topLocations)
          ? topLocations.map(
              (row: { location: string; visits: number; hits: number }) => ({
                location: row.location,
                visits: row.visits,
                hits: row.hits,
              })
            )
          : null,
      },
      200
    );
  } catch (error) {
    captureException(error);
    return c.json({}, 500);
  }
}
