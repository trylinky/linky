import db from './db';
import { blockOwnedByUser, pageOwnedByUser, userIsMemberOfOrg } from './db-predicates';
import {
  cleanupTestData,
  createTestBlock,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { block, organization, page } from '@trylinky/db/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const suffix = randomUUID().slice(0, 8);

let ownerId: string;
let strangerId: string;
let organizationId: string;
let pageId: string;
let blockId: string;

// The stranger owns a completely separate organization, page, and block.
// These exist to prove the predicates don't leak access across owners —
// an unaliased inner-table subquery would match ANY row of that type,
// including the stranger's, because the inner table shadows the outer one.
let strangerOrganizationId: string;
let strangerPageId: string;
let strangerBlockId: string;

beforeAll(async () => {
  ownerId = (await createTestUser(`pred-owner-${suffix}`)).id;
  strangerId = (await createTestUser(`pred-stranger-${suffix}`)).id;
  organizationId = (await createTestOrganization({ suffix: `pred-${suffix}`, ownerId })).id;
  pageId = (await createTestPage({ organizationId, suffix: `pred-${suffix}` })).id;
  blockId = (await createTestBlock({ pageId, type: 'content' })).id;

  strangerOrganizationId = (
    await createTestOrganization({ suffix: `pred-stranger-${suffix}`, ownerId: strangerId })
  ).id;
  strangerPageId = (
    await createTestPage({ organizationId: strangerOrganizationId, suffix: `pred-stranger-${suffix}` })
  ).id;
  strangerBlockId = (await createTestBlock({ pageId: strangerPageId, type: 'content' })).id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId, strangerPageId],
    organizationIds: [organizationId, strangerOrganizationId],
    userIds: [ownerId, strangerId],
  });
});

describe('userIsMemberOfOrg', () => {
  it('matches an organization the user belongs to', async () => {
    const rows = await db
      .select({ id: organization.id })
      .from(organization)
      .where(and(eq(organization.id, organizationId), userIsMemberOfOrg(organization.id, ownerId)));
    expect(rows).toHaveLength(1);
  });

  it('does not match for a non-member', async () => {
    const rows = await db
      .select({ id: organization.id })
      .from(organization)
      .where(and(eq(organization.id, organizationId), userIsMemberOfOrg(organization.id, strangerId)));
    expect(rows).toHaveLength(0);
  });

  it('can require a role', async () => {
    const asAdmin = await db
      .select({ id: organization.id })
      .from(organization)
      .where(and(eq(organization.id, organizationId), userIsMemberOfOrg(organization.id, ownerId, 'admin')));
    expect(asAdmin).toHaveLength(0);
  });

  it('does not match the stranger owning a different organization', async () => {
    const rows = await db
      .select({ id: organization.id })
      .from(organization)
      .where(
        and(eq(organization.id, strangerOrganizationId), userIsMemberOfOrg(organization.id, ownerId))
      );
    expect(rows).toHaveLength(0);
  });
});

describe('pageOwnedByUser', () => {
  it('matches through page -> organization -> member', async () => {
    const rows = await db
      .select({ id: page.id })
      .from(page)
      .where(and(eq(page.id, pageId), pageOwnedByUser(page.id, ownerId)));
    expect(rows).toHaveLength(1);
  });

  it('can pin the organization', async () => {
    const rows = await db
      .select({ id: page.id })
      .from(page)
      .where(and(eq(page.id, pageId), pageOwnedByUser(page.id, ownerId, 'some-other-org')));
    expect(rows).toHaveLength(0);
  });

  it('does not match the stranger\'s page for the owner', async () => {
    const rows = await db
      .select({ id: page.id })
      .from(page)
      .where(and(eq(page.id, strangerPageId), pageOwnedByUser(page.id, ownerId)));
    expect(rows).toHaveLength(0);
  });

  it('still matches the stranger\'s page for the stranger', async () => {
    const rows = await db
      .select({ id: page.id })
      .from(page)
      .where(and(eq(page.id, strangerPageId), pageOwnedByUser(page.id, strangerId)));
    expect(rows).toHaveLength(1);
  });
});

describe('blockOwnedByUser', () => {
  it('matches through block -> page -> organization -> member', async () => {
    const rows = await db
      .select({ id: block.id })
      .from(block)
      .where(and(eq(block.id, blockId), blockOwnedByUser(block.id, ownerId)));
    expect(rows).toHaveLength(1);
  });

  it('does not match for a stranger', async () => {
    const rows = await db
      .select({ id: block.id })
      .from(block)
      .where(and(eq(block.id, blockId), blockOwnedByUser(block.id, strangerId)));
    expect(rows).toHaveLength(0);
  });

  it('does not match the stranger\'s block for the owner', async () => {
    const rows = await db
      .select({ id: block.id })
      .from(block)
      .where(and(eq(block.id, strangerBlockId), blockOwnedByUser(block.id, ownerId)));
    expect(rows).toHaveLength(0);
  });

  it('still matches the stranger\'s block for the stranger', async () => {
    const rows = await db
      .select({ id: block.id })
      .from(block)
      .where(and(eq(block.id, strangerBlockId), blockOwnedByUser(block.id, strangerId)));
    expect(rows).toHaveLength(1);
  });
});

describe('predicates inside a relational query callback', () => {
  it('finds the page for its owner and not for a stranger', async () => {
    const asOwner = await db.query.page.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, pageId), pageOwnedByUser(p.id, ownerId)),
    });
    expect(asOwner?.id).toBe(pageId);

    const asStranger = await db.query.page.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, pageId), pageOwnedByUser(p.id, strangerId)),
    });
    expect(asStranger).toBeUndefined();
  });
});
