import { getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditorIndex() {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });
  const { user, session: s } = session?.data ?? {};

  // Match the shell's auth gate: login is surfaced from the root domain with a
  // `redirectTo` return path (NOT a standalone /i/auth/login route).
  if (!user || !s?.activeOrganizationId) {
    redirect('/?redirectTo=/e');
  }

  const pages = await prisma.page.findMany({
    where: {
      organizationId: s.activeOrganizationId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'asc' },
    select: { slug: true },
    take: 1,
  });

  if (!pages.length) {
    redirect('/new?freshOnboarding=true');
  }

  redirect(`/e/${pages[0].slug}`);
}
