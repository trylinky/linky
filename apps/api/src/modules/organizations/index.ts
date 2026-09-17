import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { requireSession } from '@/middleware/authenticate';
import type { Context } from 'hono';
import { Hono } from 'hono';

const organizationsRoutes = new Hono<AppBindings>();

organizationsRoutes.get('/me', getOrgsForCurrentUserHandler);

async function getOrgsForCurrentUserHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const orgs = await db.query.organization.findMany({
    where: (o) => userIsMemberOfOrg(o.id, session.user.id),
    columns: {
      id: true,
      name: true,
      isPersonal: true,
    },
  });

  return c.json(orgs, 200);
}

export default organizationsRoutes;
