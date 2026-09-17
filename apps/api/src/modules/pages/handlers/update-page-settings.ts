import type { AppBindings } from '@/env';
import {
  pageIdCacheTag,
  pageSlugCacheTag,
  revalidatePageCache,
} from '@/lib/revalidate';
import { upgradeRequired } from '@/lib/upgrade-required';
import { requireSession } from '@/middleware/authenticate';
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import { updatePageSettings } from '@/modules/pages/service';
import { tbValidator } from '@hono/typebox-validator';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts.
import { Type } from 'typebox';

const bodySchema = Type.Object({
  pageSlug: Type.String(),
  metaTitle: Type.String(),
  published: Type.Boolean(),
});

// Bound to the route's literal path so `c.req.param('pageId')` is `string`.
const factory = createFactory<AppBindings, '/:pageId/settings'>();

export const updatePageSettingsHandlers = factory.createHandlers(
  tbValidator('json', bodySchema),
  async (c) => {
    const session = requireSession(c);
    const pageId = c.req.param('pageId');
    const { pageSlug, metaTitle, published } = c.req.valid('json');

    if (!published) {
      const entitlements = await getEntitlementsForOrganization(
        session.activeOrganizationId,
        session.user.id
      );

      if (!entitlements.features.privatePages) {
        return upgradeRequired(c, 'privatePages', {
          organizationId: session.activeOrganizationId,
          userId: session.user.id,
          tier: entitlements.tier,
        });
      }
    }

    const result = await updatePageSettings({
      pageId,
      organizationId: session.activeOrganizationId,
      pageSlug,
      metaTitle,
      published,
    });

    if ('error' in result) {
      return c.json({ error: result.error }, 400);
    }

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    void revalidatePageCache([
      pageIdCacheTag(pageId),
      ...(rootDomain
        ? [
            pageSlugCacheTag(result.previousSlug, rootDomain),
            pageSlugCacheTag(result.slug, rootDomain),
          ]
        : []),
    ]);

    return c.json({ slug: result.slug }, 200);
  }
);
