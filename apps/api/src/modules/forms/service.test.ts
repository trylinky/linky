import {
  checkUserHasAccessToPage,
  deleteSubmissionById,
  getFormGroupsForPage,
  listSubmissions,
  submitFormResponse,
} from './service';
import db from '@/lib/db';
import {
  cleanupTestData,
  createTestBlock,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { block, formSubmission } from '@trylinky/db/schema';
import { count, eq } from 'drizzle-orm';
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
  userId = (await createTestUser(`form-${suffix}`)).id;
  otherUserId = (await createTestUser(`form-other-${suffix}`)).id;
  organizationId = (await createTestOrganization({ suffix: `form-${suffix}`, ownerId: userId })).id;
  pageId = (await createTestPage({ organizationId, suffix: `form-${suffix}` })).id;
  unpublishedPageId = (
    await createTestPage({ organizationId, suffix: `form-unpub-${suffix}`, publishedAt: null })
  ).id;
  blockId = (await createTestBlock({ pageId, type: 'form', data: testFormConfig })).id;
  unpublishedBlockId = (
    await createTestBlock({ pageId: unpublishedPageId, type: 'form', data: testFormConfig })
  ).id;
  nonFormBlockId = (await createTestBlock({ pageId, type: 'content' })).id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId, unpublishedPageId],
    organizationIds: [organizationId],
    userIds: [userId, otherUserId],
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

    const stored = await db.query.formSubmission.findFirst({
      where: (s, { eq }) => eq(s.blockId, blockId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
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
    const [{ count: before }] = await db
      .select({ count: count() })
      .from(formSubmission)
      .where(eq(formSubmission.blockId, blockId));

    const result = await submitFormResponse({
      blockId,
      answers: { 'f-email': 'bot@example.com' },
      honeypot: 'http://spam.example',
      ipAddress: IP,
    });

    expect(result).toEqual({ status: 'ok' });

    const [{ count: after }] = await db
      .select({ count: count() })
      .from(formSubmission)
      .where(eq(formSubmission.blockId, blockId));
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
    const rateLimitBlock = await createTestBlock({ pageId, type: 'form', data: testFormConfig });
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
    const doomedBlock = await createTestBlock({
      pageId,
      type: 'form',
      data: { ...testFormConfig, title: 'Doomed form' },
    });

    const submit = await submitFormResponse({
      blockId: doomedBlock.id,
      answers: { 'f-email': 'keep@example.com' },
      honeypot: '',
      ipAddress: '203.0.113.55',
    });
    expect(submit.status).toBe('ok');

    await db.delete(block).where(eq(block.id, doomedBlock.id));

    const groups = await getFormGroupsForPage(pageId);

    const liveGroup = groups.find((group) => group.blockId === blockId);
    expect(liveGroup).toMatchObject({
      title: 'Contact me',
      isDeleted: false,
    });
    expect(liveGroup!.submissionCount).toBeGreaterThanOrEqual(1);
    expect(liveGroup!.latestSubmissionAt).toBeInstanceOf(Date);

    const orphanGroup = groups.find((group) => group.blockId === doomedBlock.id);
    expect(orphanGroup).toMatchObject({
      title: 'Doomed form',
      isDeleted: true,
      submissionCount: 1,
    });
    expect(orphanGroup!.latestSubmissionAt).toBeInstanceOf(Date);
  });
});

describe('listSubmissions', () => {
  it('returns newest-first pages with a working cursor', async () => {
    const paginationBlock = await createTestBlock({ pageId, type: 'form', data: testFormConfig });

    // Insert directly so we control timestamps deterministically.
    const base = Date.now();
    for (let i = 0; i < 3; i++) {
      await db.insert(formSubmission).values({
        pageId,
        blockId: paginationBlock.id,
        answers: { 'f-email': `p${i}@example.com` },
        fieldsSnapshot: {
          title: 'Contact me',
          fields: testFormConfig.fields,
        },
        visitorIp: IP,
        createdAt: new Date(base - i * 1000),
      });
    }

    const firstPage = await listSubmissions(pageId, paginationBlock.id, undefined, 2);
    expect(firstPage.submissions).toHaveLength(2);
    expect(firstPage.nextCursor).toBeTruthy();
    expect(firstPage.submissions[0].answers).toMatchObject({
      'f-email': 'p0@example.com',
    });

    const secondPage = await listSubmissions(pageId, paginationBlock.id, firstPage.nextCursor!, 2);
    expect(secondPage.submissions).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();
    expect(secondPage.submissions[0].answers).toMatchObject({
      'f-email': 'p2@example.com',
    });
  });

  it('returns an empty page for a cursor that belongs to another block', async () => {
    // A cursor row that doesn't match the where clause must not leak rows:
    // the query positions on the cursor but still applies the filter, so
    // the result is empty rather than another block's data.
    const foreignSubmission = await db.query.formSubmission.findFirst({
      where: (s, { eq }) => eq(s.blockId, blockId),
      columns: { id: true },
    });
    expect(foreignSubmission).toBeTruthy();

    const otherBlock = await createTestBlock({ pageId, type: 'form', data: testFormConfig });

    const result = await listSubmissions(pageId, otherBlock.id, foreignSubmission!.id, 2);
    expect(result.submissions).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it('returns an empty page for a cursor that does not exist at all', async () => {
    const otherBlock = await createTestBlock({ pageId, type: 'form', data: testFormConfig });

    const result = await listSubmissions(pageId, otherBlock.id, randomUUID(), 2);
    expect(result).toEqual({ submissions: [], nextCursor: null });
  });

  it('skips and duplicates no rows when two submissions share the same createdAt', async () => {
    const tieBlock = await createTestBlock({ pageId, type: 'form', data: testFormConfig });

    // Two rows with an identical createdAt, walked one at a time (pageSize
    // 1) across the page boundary between them.
    const tieTimestamp = new Date(Date.now() - 5000);
    await db.insert(formSubmission).values({
      pageId,
      blockId: tieBlock.id,
      answers: { 'f-email': 'tie-a@example.com' },
      fieldsSnapshot: { title: 'Contact me', fields: testFormConfig.fields },
      visitorIp: IP,
      createdAt: tieTimestamp,
    });
    await db.insert(formSubmission).values({
      pageId,
      blockId: tieBlock.id,
      answers: { 'f-email': 'tie-b@example.com' },
      fieldsSnapshot: { title: 'Contact me', fields: testFormConfig.fields },
      visitorIp: IP,
      createdAt: tieTimestamp,
    });

    const firstPage = await listSubmissions(pageId, tieBlock.id, undefined, 1);
    expect(firstPage.submissions).toHaveLength(1);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await listSubmissions(pageId, tieBlock.id, firstPage.nextCursor!, 1);
    expect(secondPage.submissions).toHaveLength(1);
    expect(secondPage.nextCursor).toBeNull();

    const seenIds = [firstPage.submissions[0].id, secondPage.submissions[0].id];
    expect(new Set(seenIds).size).toBe(2);

    const seenEmails = [firstPage.submissions[0], secondPage.submissions[0]].map(
      (submission) => (submission.answers as Record<string, unknown>)['f-email']
    );
    expect(seenEmails.sort()).toEqual(['tie-a@example.com', 'tie-b@example.com']);
  });
});

describe('deleteSubmissionById', () => {
  it('lets the owner delete and blocks other users, who leave the row in place', async () => {
    const [submission] = await db
      .insert(formSubmission)
      .values({
        pageId,
        blockId,
        answers: { 'f-email': 'delete-me@example.com' },
        fieldsSnapshot: { title: 'Contact me', fields: testFormConfig.fields },
        visitorIp: IP,
      })
      .returning();

    // otherUserId is not a member of organizationId.
    expect(await deleteSubmissionById(submission.id, otherUserId)).toBe(false);
    expect(
      await db.query.formSubmission.findFirst({ where: (s, { eq }) => eq(s.id, submission.id) })
    ).toBeTruthy();

    expect(await deleteSubmissionById(submission.id, userId)).toBe(true);
    expect(
      await db.query.formSubmission.findFirst({ where: (s, { eq }) => eq(s.id, submission.id) })
    ).toBeUndefined();
  });
});
