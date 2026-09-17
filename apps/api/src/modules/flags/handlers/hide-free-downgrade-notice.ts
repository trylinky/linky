import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { requireSession } from '@/middleware/authenticate';
import { FREE_DOWNGRADE_NOTICE_FLAG } from '@/modules/billing/utils/sync-subscription';
import { userFlag } from '@trylinky/db/schema';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

export async function hideFreeDowngradeNoticeHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  await db
    .update(userFlag)
    .set({ value: false })
    .where(
      and(
        eq(userFlag.userId, session.user.id),
        eq(userFlag.key, FREE_DOWNGRADE_NOTICE_FLAG)
      )
    );

  return c.json({ success: true }, 200);
}
