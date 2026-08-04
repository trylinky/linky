import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
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
      isFeatured: true,
      verifiedAt: true,
      // Explicit field select, not `blocks: true` — the old Fastify response
      // schema only ever declared id/type/config/data, silently stripping
      // the rest (pageId, integrationId, createdAt, updatedAt) off every
      // block on the way out. Hono has no such trimming step, so an
      // unscoped `true` here would newly leak those columns to whichever
      // internal caller hits this route.
      blocks: {
        select: {
          id: true,
          type: true,
          config: true,
          data: true,
        },
      },
      organization: { select: { subscription: { select: { plan: true } } } },
    },
  });

  if (!page) {
    return c.json({}, 404);
  }

  const plan = page.organization?.subscription?.plan;
  const isPaid = plan === 'premium' || plan === 'team';

  // `_organization` is destructured only to keep it out of `rest`.
  const {
    organization: _organization,
    publishedAt,
    verifiedAt,
    ...rest
  } = page;

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
