import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { requireSession } from '@/middleware/authenticate';
import { userFlag } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';

export async function getFlagsForCurrentUserHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const userFlags = await db
    .select({ key: userFlag.key, value: userFlag.value })
    .from(userFlag)
    .where(eq(userFlag.userId, session.user.id));

  return c.json({ flags: userFlags }, 200);
}
