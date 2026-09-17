import type { AppBindings } from '@/env';
import db from '@/lib/db';
import type { Context } from 'hono';

// Bound to the route's literal mount path (`/:pageId/internal/load` in
// index.ts) so `c.req.param('pageId')` below comes back as `string`, not
// `string | undefined` — see the comment on the `factory` in
// forms/index.ts for why this has to match the literal used at the mount
// site exactly.
//
// Server-to-server only — mounted behind `requireApiKey` in index.ts rather
// than here, matching how `bodyLimit` is applied at the mount site for
// forms' submission route.
export async function getPageLoadHandler(
  c: Context<AppBindings, '/:pageId/internal/load'>
) {
  const pageId = c.req.param('pageId');

  const row = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(isNull(p.deletedAt), eq(p.id, pageId)),
    columns: {
      id: true,
      publishedAt: true,
      organizationId: true,
      customDomain: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      isFeatured: true,
      verifiedAt: true,
    },
    with: {
      // Explicit column list: the old Fastify response schema stripped
      // pageId/integrationId/createdAt/updatedAt off every block, and Hono
      // has no such trimming step.
      blocks: { columns: { id: true, type: true, config: true, data: true } },
      organization: {
        columns: { id: true },
        with: { subscription: { columns: { plan: true } } },
      },
    },
  });

  if (!row) {
    return c.json({}, 404);
  }

  const plan = row.organization?.subscription?.plan;
  const isPaid = plan === 'premium' || plan === 'team';

  // `_organization` is destructured only to keep it out of `rest`.
  const { organization: _organization, publishedAt, verifiedAt, ...rest } = row;

  return c.json(
    {
      ...rest,
      publishedAt: publishedAt?.toISOString() ?? '',
      verifiedAt: verifiedAt ? verifiedAt.toISOString() : null,
      isPaid,
    },
    200
  );
}
