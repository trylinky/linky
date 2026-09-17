import type { AppBindings } from '@/env';
import { upgradeRequired } from '@/lib/upgrade-required';
import { requireSession } from '@/middleware/authenticate';
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import { createVerificationRequest } from '@/modules/verification/service';
import { tbValidator } from '@hono/typebox-validator';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts.
import { Type } from 'typebox';

const bodySchema = Type.Object({
  pageId: Type.String(),
  requestedPageTitle: Type.String(),
});

const factory = createFactory<AppBindings>();

const createHandlers = factory.createHandlers(
  tbValidator('json', bodySchema),
  async (c) => {
    const session = requireSession(c);
    const { pageId, requestedPageTitle } = c.req.valid('json');

    const entitlements = await getEntitlementsForOrganization(
      session.activeOrganizationId,
      session.user.id
    );

    if (!entitlements.features.verification) {
      return upgradeRequired(c, 'verification', {
        organizationId: session.activeOrganizationId,
        userId: session.user.id,
        tier: entitlements.tier,
      });
    }

    const result = await createVerificationRequest({
      pageId,
      userId: session.user.id,
      organizationId: session.activeOrganizationId,
      requestedPageTitle,
    });

    if ('error' in result) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result, 200);
  }
);

const verificationRoutes = new Hono<AppBindings>();

verificationRoutes.post('/', ...createHandlers);

export default verificationRoutes;
