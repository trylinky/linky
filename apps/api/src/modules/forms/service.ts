import prisma from '@/lib/prisma';
import { validateAnswers } from './validate-answers';
import { FormBlockConfig } from '@trylinky/blocks';

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
  const block = await prisma.block.findUnique({
    where: { id: blockId },
    select: {
      id: true,
      type: true,
      data: true,
      pageId: true,
      page: {
        select: {
          publishedAt: true,
          deletedAt: true,
        },
      },
    },
  });

  if (
    !block ||
    block.type !== 'form' ||
    !block.page.publishedAt ||
    block.page.deletedAt
  ) {
    return { status: 'not-found' };
  }

  // Honeypot tripped: pretend success, store nothing — bots get no signal.
  if (honeypot.length > 0) {
    return { status: 'ok' };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.formSubmission.count({
    where: {
      blockId,
      visitorIp: ipAddress,
      createdAt: { gt: oneHourAgo },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX_PER_HOUR) {
    return { status: 'rate-limited' };
  }

  const config = block.data as unknown as FormBlockConfig;
  const result = validateAnswers(config.fields ?? [], answers);

  if (!result.ok) {
    return { status: 'invalid', errors: result.errors };
  }

  await prisma.formSubmission.create({
    data: {
      pageId: block.pageId,
      blockId: block.id,
      answers: result.answers,
      fieldsSnapshot: {
        title: config.title ?? null,
        fields: config.fields as unknown as object[],
      },
      visitorIp: ipAddress,
    },
  });

  return { status: 'ok' };
}

export async function checkUserHasAccessToPage(
  pageId: string,
  userId: string
) {
  const count = await prisma.page.count({
    where: {
      id: pageId,
      organization: {
        members: {
          some: {
            userId,
          },
        },
      },
    },
  });

  return count > 0;
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
    prisma.block.findMany({
      where: { pageId, type: 'form' },
      select: { id: true, data: true },
    }),
    prisma.formSubmission.groupBy({
      by: ['blockId'],
      where: { pageId },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
  ]);

  const countsByBlockId = new Map(
    submissionGroups.map((group) => [group.blockId, group])
  );

  const groups: FormGroup[] = formBlocks.map((block) => {
    const data = block.data as unknown as FormBlockConfig;
    const counts = countsByBlockId.get(block.id);
    countsByBlockId.delete(block.id);

    return {
      blockId: block.id,
      title: data.title || 'Untitled form',
      isDeleted: false,
      submissionCount: counts?._count._all ?? 0,
      latestSubmissionAt: counts?._max.createdAt ?? null,
    };
  });

  // Whatever remains belongs to deleted form blocks; title comes from the
  // latest submission's snapshot so collected data stays reachable.
  for (const [blockId, counts] of countsByBlockId) {
    const latest = await prisma.formSubmission.findFirst({
      where: { blockId },
      orderBy: { createdAt: 'desc' },
      select: { fieldsSnapshot: true },
    });

    const snapshot = latest?.fieldsSnapshot as { title?: string | null } | null;

    groups.push({
      blockId,
      title: snapshot?.title || 'Untitled form',
      isDeleted: true,
      submissionCount: counts._count._all,
      latestSubmissionAt: counts._max.createdAt,
    });
  }

  return groups;
}

export async function listSubmissions(
  pageId: string,
  blockId: string,
  cursor?: string,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const submissions = await prisma.formSubmission.findMany({
    where: { pageId, blockId },
    orderBy: { createdAt: 'desc' },
    take: pageSize + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

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
  const submission = await prisma.formSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      page: {
        select: {
          organization: {
            select: {
              members: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!submission || !submission.page.organization?.members.length) {
    return false;
  }

  await prisma.formSubmission.delete({ where: { id: submissionId } });

  return true;
}
