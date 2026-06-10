import prisma from '@/lib/prisma';
import {
  checkUserHasAccessToPage,
  deleteSubmissionById,
  getFormGroupsForPage,
  listSubmissions,
  submitFormResponse,
} from './service';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const suffix = randomUUID().slice(0, 8);
const IP = '198.51.100.7';

const testFormConfig = {
  title: 'Contact me',
  submitLabel: 'Submit',
  successMessage: 'Thanks!',
  fields: [
    { id: 'f-name', type: 'text', label: 'Name', required: false },
    { id: 'f-email', type: 'email', label: 'Email', required: true },
    {
      id: 'f-topic',
      type: 'select',
      label: 'Topic',
      required: false,
      options: ['Support', 'Sales'],
    },
  ],
};

let userId: string;
let otherUserId: string;
let organizationId: string;
let pageId: string;
let unpublishedPageId: string;
let blockId: string;
let unpublishedBlockId: string;
let nonFormBlockId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `form-test-${suffix}@example.com` },
  });
  userId = user.id;

  const otherUser = await prisma.user.create({
    data: { email: `form-test-other-${suffix}@example.com` },
  });
  otherUserId = otherUser.id;

  const organization = await prisma.organization.create({
    data: {
      name: 'Form Test Org',
      slug: `form-test-org-${suffix}`,
      members: { create: { userId, role: 'owner' } },
    },
  });
  organizationId = organization.id;

  const page = await prisma.page.create({
    data: {
      slug: `form-test-page-${suffix}`,
      config: [],
      publishedAt: new Date(),
      organizationId,
    },
  });
  pageId = page.id;

  const unpublishedPage = await prisma.page.create({
    data: {
      slug: `form-test-unpub-${suffix}`,
      config: [],
      organizationId,
    },
  });
  unpublishedPageId = unpublishedPage.id;

  const block = await prisma.block.create({
    data: { type: 'form', config: {}, data: testFormConfig, pageId },
  });
  blockId = block.id;

  const unpublishedBlock = await prisma.block.create({
    data: {
      type: 'form',
      config: {},
      data: testFormConfig,
      pageId: unpublishedPageId,
    },
  });
  unpublishedBlockId = unpublishedBlock.id;

  const nonFormBlock = await prisma.block.create({
    data: { type: 'content', config: {}, data: {}, pageId },
  });
  nonFormBlockId = nonFormBlock.id;
});

afterAll(async () => {
  await prisma.formSubmission.deleteMany({
    where: { pageId: { in: [pageId, unpublishedPageId] } },
  });
  await prisma.block.deleteMany({
    where: { pageId: { in: [pageId, unpublishedPageId] } },
  });
  await prisma.page.deleteMany({
    where: { id: { in: [pageId, unpublishedPageId] } },
  });
  await prisma.member.deleteMany({ where: { organizationId } });
  await prisma.organization.delete({ where: { id: organizationId } });
  await prisma.user.deleteMany({
    where: { id: { in: [userId, otherUserId] } },
  });
});

describe('submitFormResponse', () => {
  it('stores a valid submission with answers and a fields snapshot', async () => {
    const result = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'visitor@example.com', 'f-topic': 'Support' },
      honeypot: '',
      ipAddress: IP,
    });

    expect(result).toEqual({ status: 'ok' });

    const stored = await prisma.formSubmission.findFirst({
      where: { blockId },
      orderBy: { createdAt: 'desc' },
    });

    expect(stored).toBeTruthy();
    expect(stored?.pageId).toBe(pageId);
    expect(stored?.visitorIp).toBe(IP);
    expect(stored?.answers).toEqual({
      'f-email': 'visitor@example.com',
      'f-topic': 'Support',
    });
    expect(stored?.fieldsSnapshot).toMatchObject({
      title: 'Contact me',
      fields: testFormConfig.fields,
    });
  });

  it('returns ok for honeypot submissions but stores nothing', async () => {
    const before = await prisma.formSubmission.count({ where: { blockId } });

    const result = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'bot@example.com' },
      honeypot: 'http://spam.example',
      ipAddress: IP,
    });

    expect(result).toEqual({ status: 'ok' });

    const after = await prisma.formSubmission.count({ where: { blockId } });
    expect(after).toBe(before);
  });

  it('rejects invalid answers', async () => {
    const missingRequired = await submitFormResponse({
      blockId,
      answers: { 'f-name': 'No email' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(missingRequired.status).toBe('invalid');

    const badOption = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'a@b.co', 'f-topic': 'Gossip' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(badOption.status).toBe('invalid');

    const unknownField = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'a@b.co', 'f-evil': 'x' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(unknownField.status).toBe('invalid');
  });

  it('rate limits the 6th submission from one IP within an hour', async () => {
    // Use a dedicated block so submissions from other tests don't count.
    const rateLimitBlock = await prisma.block.create({
      data: { type: 'form', config: {}, data: testFormConfig, pageId },
    });
    const rateLimitIp = '203.0.113.9';

    for (let i = 0; i < 5; i++) {
      const result = await submitFormResponse({
        blockId: rateLimitBlock.id,
        answers: { 'f-email': `v${i}@example.com` },
        honeypot: '',
        ipAddress: rateLimitIp,
      });
      expect(result.status).toBe('ok');
    }

    const sixth = await submitFormResponse({
      blockId: rateLimitBlock.id,
      answers: { 'f-email': 'v6@example.com' },
      honeypot: '',
      ipAddress: rateLimitIp,
    });
    expect(sixth.status).toBe('rate-limited');

    // A different visitor is unaffected.
    const otherVisitor = await submitFormResponse({
      blockId: rateLimitBlock.id,
      answers: { 'f-email': 'v7@example.com' },
      honeypot: '',
      ipAddress: '203.0.113.10',
    });
    expect(otherVisitor.status).toBe('ok');
  });

  it('returns not-found for unpublished pages, missing and non-form blocks', async () => {
    const unpublished = await submitFormResponse({
      blockId: unpublishedBlockId,
      answers: { 'f-email': 'a@b.co' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(unpublished.status).toBe('not-found');

    const missing = await submitFormResponse({
      blockId: randomUUID(),
      answers: { 'f-email': 'a@b.co' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(missing.status).toBe('not-found');

    const nonForm = await submitFormResponse({
      blockId: nonFormBlockId,
      answers: { 'f-email': 'a@b.co' },
      honeypot: '',
      ipAddress: IP,
    });
    expect(nonForm.status).toBe('not-found');
  });
});

describe('checkUserHasAccessToPage', () => {
  it('allows org members and rejects everyone else', async () => {
    expect(await checkUserHasAccessToPage(pageId, userId)).toBe(true);
    expect(await checkUserHasAccessToPage(pageId, otherUserId)).toBe(false);
  });
});

describe('getFormGroupsForPage', () => {
  it('lists live form blocks and orphaned submission groups', async () => {
    // Create a form block, give it a submission, then delete the block.
    const doomedBlock = await prisma.block.create({
      data: {
        type: 'form',
        config: {},
        data: { ...testFormConfig, title: 'Doomed form' },
        pageId,
      },
    });

    const submit = await submitFormResponse({
      blockId: doomedBlock.id,
      answers: { 'f-email': 'keep@example.com' },
      honeypot: '',
      ipAddress: '203.0.113.55',
    });
    expect(submit.status).toBe('ok');

    await prisma.block.delete({ where: { id: doomedBlock.id } });

    const groups = await getFormGroupsForPage(pageId);

    const liveGroup = groups.find((group) => group.blockId === blockId);
    expect(liveGroup).toMatchObject({
      title: 'Contact me',
      isDeleted: false,
    });
    expect(liveGroup!.submissionCount).toBeGreaterThanOrEqual(1);

    const orphanGroup = groups.find(
      (group) => group.blockId === doomedBlock.id
    );
    expect(orphanGroup).toMatchObject({
      title: 'Doomed form',
      isDeleted: true,
      submissionCount: 1,
    });
  });
});

describe('listSubmissions', () => {
  it('returns newest-first pages with a working cursor', async () => {
    const paginationBlock = await prisma.block.create({
      data: { type: 'form', config: {}, data: testFormConfig, pageId },
    });

    // Insert directly so we control timestamps deterministically.
    const base = Date.now();
    for (let i = 0; i < 3; i++) {
      await prisma.formSubmission.create({
        data: {
          pageId,
          blockId: paginationBlock.id,
          answers: { 'f-email': `p${i}@example.com` },
          fieldsSnapshot: { title: 'Contact me', fields: testFormConfig.fields },
          visitorIp: IP,
          createdAt: new Date(base - i * 1000),
        },
      });
    }

    const firstPage = await listSubmissions(
      pageId,
      paginationBlock.id,
      undefined,
      2
    );
    expect(firstPage.submissions).toHaveLength(2);
    expect(firstPage.nextCursor).toBeTruthy();
    expect(firstPage.submissions[0].answers).toMatchObject({
      'f-email': 'p0@example.com',
    });

    const secondPage = await listSubmissions(
      pageId,
      paginationBlock.id,
      firstPage.nextCursor!,
      2
    );
    expect(secondPage.submissions).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
    expect(secondPage.submissions[0].answers).toMatchObject({
      'f-email': 'p2@example.com',
    });
  });
});

describe('deleteSubmissionById', () => {
  it('lets the owner delete and blocks other users', async () => {
    const submission = await prisma.formSubmission.create({
      data: {
        pageId,
        blockId,
        answers: { 'f-email': 'delete-me@example.com' },
        fieldsSnapshot: { title: 'Contact me', fields: testFormConfig.fields },
        visitorIp: IP,
      },
    });

    expect(await deleteSubmissionById(submission.id, otherUserId)).toBe(false);
    expect(
      await prisma.formSubmission.findUnique({ where: { id: submission.id } })
    ).toBeTruthy();

    expect(await deleteSubmissionById(submission.id, userId)).toBe(true);
    expect(
      await prisma.formSubmission.findUnique({ where: { id: submission.id } })
    ).toBeNull();
  });
});
