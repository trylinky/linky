import { validateAnswers } from './validate-answers';
import db from '@/lib/db';
import { pageOwnedByUser, userIsMemberOfOrg } from '@/lib/db-predicates';
import { FormBlockConfig } from '@trylinky/blocks';
import { block, formSubmission, page } from '@trylinky/db/schema';
import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  max,
  or,
  type SQL,
} from 'drizzle-orm';

const RATE_LIMIT_MAX_PER_HOUR = 5;
const DEFAULT_PAGE_SIZE = 50;

export type SubmitResult =
  | { status: 'ok' }
  | { status: 'not-found' }
  | { status: 'rate-limited' }
  | { status: 'invalid'; errors: Record<string, string> };

export async function submitFormResponse({
  blockId,
  answers,
  honeypot,
  ipAddress,
}: {
  blockId: string;
  answers: unknown;
  honeypot: string;
  ipAddress: string;
}): Promise<SubmitResult> {
  const target = await db.query.block.findFirst({
    where: (b, { eq }) => eq(b.id, blockId),
    columns: { id: true, type: true, data: true, pageId: true },
    with: { page: { columns: { publishedAt: true, deletedAt: true } } },
  });

  if (
    !target ||
    target.type !== 'form' ||
    !target.page.publishedAt ||
    target.page.deletedAt
  ) {
    return { status: 'not-found' };
  }

  // Honeypot tripped: pretend success, store nothing — bots get no signal.
  if (honeypot.length > 0) {
    return { status: 'ok' };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  // Count-then-create is not atomic; acceptable at 5/hr.
  const [{ count: recentCount }] = await db
    .select({ count: count() })
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.blockId, blockId),
        eq(formSubmission.visitorIp, ipAddress),
        gt(formSubmission.createdAt, oneHourAgo)
      )
    );

  if (recentCount >= RATE_LIMIT_MAX_PER_HOUR) {
    return { status: 'rate-limited' };
  }

  const config = target.data as unknown as FormBlockConfig;
  const result = validateAnswers(config.fields ?? [], answers);

  if (!result.ok) {
    return { status: 'invalid', errors: result.errors };
  }

  await db.insert(formSubmission).values({
    pageId: target.pageId,
    blockId: target.id,
    answers: result.answers,
    fieldsSnapshot: {
      title: config.title ?? null,
      fields: config.fields as unknown as object[],
    },
    visitorIp: ipAddress,
  });

  return { status: 'ok' };
}

export async function checkUserHasAccessToPage(pageId: string, userId: string) {
  const [{ count: matches }] = await db
    .select({ count: count() })
    .from(page)
    .where(
      and(
        eq(page.id, pageId),
        isNull(page.deletedAt),
        userIsMemberOfOrg(page.organizationId, userId)
      )
    );

  return matches > 0;
}

export interface FormGroup {
  blockId: string;
  title: string;
  isDeleted: boolean;
  submissionCount: number;
  latestSubmissionAt: Date | null;
}

export async function getFormGroupsForPage(
  pageId: string
): Promise<FormGroup[]> {
  const [formBlocks, submissionGroups] = await Promise.all([
    db
      .select({ id: block.id, data: block.data })
      .from(block)
      .where(and(eq(block.pageId, pageId), eq(block.type, 'form'))),
    db
      .select({
        blockId: formSubmission.blockId,
        submissionCount: count(),
        latestSubmissionAt: max(formSubmission.createdAt),
      })
      .from(formSubmission)
      .where(eq(formSubmission.pageId, pageId))
      .groupBy(formSubmission.blockId),
  ]);

  const countsByBlockId = new Map(
    submissionGroups.map((group) => [
      group.blockId,
      {
        submissionCount: group.submissionCount,
        // drizzle's `max()` on a timestamp column comes back as a string
        // over the pg driver; coerce it back to a Date to match Prisma's
        // `_max.createdAt` shape.
        latestSubmissionAt:
          group.latestSubmissionAt === null
            ? null
            : new Date(group.latestSubmissionAt),
      },
    ])
  );

  const groups: FormGroup[] = formBlocks.map((formBlock) => {
    const data = formBlock.data as unknown as FormBlockConfig;
    const counts = countsByBlockId.get(formBlock.id);
    countsByBlockId.delete(formBlock.id);

    return {
      blockId: formBlock.id,
      title: data.title || 'Untitled form',
      isDeleted: false,
      submissionCount: counts?.submissionCount ?? 0,
      latestSubmissionAt: counts?.latestSubmissionAt ?? null,
    };
  });

  // Whatever remains belongs to deleted form blocks; the title comes from
  // the latest submission's snapshot.
  const orphanBlockIds = [...countsByBlockId.keys()];
  if (orphanBlockIds.length > 0) {
    // DISTINCT ON needs the distinct column first in ORDER BY.
    const latestSnapshots = await db
      .selectDistinctOn([formSubmission.blockId], {
        blockId: formSubmission.blockId,
        fieldsSnapshot: formSubmission.fieldsSnapshot,
      })
      .from(formSubmission)
      .where(inArray(formSubmission.blockId, orphanBlockIds))
      .orderBy(formSubmission.blockId, desc(formSubmission.createdAt));

    const snapshotByBlockId = new Map(
      latestSnapshots.map((submission) => [
        submission.blockId,
        submission.fieldsSnapshot as { title?: string | null } | null,
      ])
    );

    for (const [blockId, counts] of countsByBlockId) {
      const snapshot = snapshotByBlockId.get(blockId);

      groups.push({
        blockId,
        title: snapshot?.title || 'Untitled form',
        isDeleted: true,
        submissionCount: counts.submissionCount,
        latestSubmissionAt: counts.latestSubmissionAt,
      });
    }
  }

  return groups;
}

export async function listSubmissions(
  pageId: string,
  blockId: string,
  cursor?: string,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  // Keyset pagination on (createdAt, id): Prisma's cursor/skip:1 walked
  // past the cursor row; this selects everything strictly after it in the
  // same createdAt desc order, with id as the tiebreaker.
  let afterCursor: SQL | undefined;
  if (cursor) {
    const cursorRow = await db.query.formSubmission.findFirst({
      where: (s, { eq }) => eq(s.id, cursor),
      columns: { createdAt: true, id: true },
    });

    if (!cursorRow) {
      return { submissions: [], nextCursor: null };
    }

    afterCursor = or(
      lt(formSubmission.createdAt, cursorRow.createdAt),
      and(
        eq(formSubmission.createdAt, cursorRow.createdAt),
        lt(formSubmission.id, cursorRow.id)
      )
    );
  }

  const submissions = await db
    .select()
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.pageId, pageId),
        eq(formSubmission.blockId, blockId),
        afterCursor
      )
    )
    .orderBy(desc(formSubmission.createdAt), desc(formSubmission.id))
    .limit(pageSize + 1);

  const hasMore = submissions.length > pageSize;
  const pageOfSubmissions = hasMore
    ? submissions.slice(0, pageSize)
    : submissions;

  return {
    submissions: pageOfSubmissions,
    nextCursor: hasMore
      ? pageOfSubmissions[pageOfSubmissions.length - 1].id
      : null,
  };
}

export async function deleteSubmissionById(
  submissionId: string,
  userId: string
) {
  // Ownership check folded into the where clause so a concurrent
  // double-delete cannot race between a find and a delete.
  const deleted = await db
    .delete(formSubmission)
    .where(
      and(
        eq(formSubmission.id, submissionId),
        pageOwnedByUser(formSubmission.pageId, userId)
      )
    )
    .returning({ id: formSubmission.id });

  return deleted.length > 0;
}
