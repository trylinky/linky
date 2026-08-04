import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { requireSession } from '@/middleware/authenticate';
import type { Context } from 'hono';

export async function getFlagsForCurrentUserHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const userFlags = await prisma.userFlag.findMany({
    where: { userId: session.user.id },
    select: { key: true, value: true },
  });

  return c.json({ flags: userFlags }, 200);
}
