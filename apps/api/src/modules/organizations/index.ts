import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { requireSession } from '@/middleware/authenticate';
import type { Context } from 'hono';
import { Hono } from 'hono';

const organizationsRoutes = new Hono<AppBindings>();

organizationsRoutes.get('/me', getOrgsForCurrentUserHandler);

async function getOrgsForCurrentUserHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const orgs = await prisma.organization.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      isPersonal: true,
    },
  });

  return c.json(orgs, 200);
}

export default organizationsRoutes;
