import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { requireSession } from '@/middleware/authenticate';
import type { Context } from 'hono';

export async function hideOnboardingTourHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  await prisma.userFlag.updateMany({
    where: { userId: session.user.id, key: 'showOnboardingTour' },
    data: { value: false },
  });

  return c.json({ success: true }, 200);
}
