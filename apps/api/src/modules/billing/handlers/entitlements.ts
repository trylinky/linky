import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import type { Context } from 'hono';

export async function getEntitlementsHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const entitlements = await getEntitlementsForOrganization(
    session.activeOrganizationId,
    session.user.id
  );

  return c.json(entitlements, 200);
}
