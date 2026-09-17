import db from '@/lib/db';
import { VerificationRequestStatus } from '@trylinky/db';
import { verificationRequest } from '@trylinky/db/schema';

export async function createVerificationRequest({
  pageId,
  userId,
  organizationId,
  requestedPageTitle,
}: {
  pageId: string;
  userId: string;
  organizationId: string;
  requestedPageTitle: string;
}): Promise<{ success: true } | { error: { message: string } }> {
  if (!requestedPageTitle.trim()) {
    return { error: { message: 'Page title is required' } };
  }

  const target = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(
        eq(p.id, pageId),
        isNull(p.deletedAt),
        eq(p.organizationId, organizationId)
      ),
    columns: { id: true },
  });

  if (!target) {
    return { error: { message: 'Page not found' } };
  }

  const existing = await db.query.verificationRequest.findFirst({
    where: (r, { and, eq, inArray }) =>
      and(
        eq(r.pageId, pageId),
        inArray(r.status, [
          VerificationRequestStatus.PENDING,
          VerificationRequestStatus.APPROVED,
        ])
      ),
    columns: { status: true },
  });

  if (existing?.status === VerificationRequestStatus.APPROVED) {
    return {
      error: { message: 'A verification request already exists for this page' },
    };
  }

  if (existing?.status === VerificationRequestStatus.PENDING) {
    return {
      error: {
        message: 'A verification request is already pending for this page',
      },
    };
  }

  await db.insert(verificationRequest).values({
    pageId,
    requestedByUserId: userId,
    requestedPageTitle,
  });

  return { success: true };
}
