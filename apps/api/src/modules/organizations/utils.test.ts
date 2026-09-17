import {
  canManageBilling,
  createNewOrganization,
  hasAvailableSeat,
} from './utils';
import db from '@/lib/db';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { member, subscription } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';

const suffix = randomUUID().slice(0, 8);

const userIds: string[] = [];
const organizationIds: string[] = [];
const subscriptionIds: string[] = [];

afterAll(async () => {
  await cleanupTestData({ subscriptionIds, organizationIds, userIds });
});

describe('hasAvailableSeat', () => {
  it('is true when the organization has no subscription', async () => {
    const owner = await createTestUser(`seat-none-${suffix}`);
    userIds.push(owner.id);
    const org = await createTestOrganization({
      suffix: `seat-none-${suffix}`,
      ownerId: owner.id,
    });
    organizationIds.push(org.id);

    await expect(hasAvailableSeat(org.id)).resolves.toBe(true);
  });

  it('is true when seats exceed the current member count', async () => {
    const owner = await createTestUser(`seat-2-${suffix}`);
    userIds.push(owner.id);
    const org = await createTestOrganization({
      suffix: `seat-2-${suffix}`,
      ownerId: owner.id,
    });
    organizationIds.push(org.id);

    const [sub] = await db
      .insert(subscription)
      .values({
        plan: 'team',
        referenceId: org.id,
        stripeCustomerId: `cus_${suffix}_seat2`,
        status: 'active',
        seats: 2,
      })
      .returning();
    subscriptionIds.push(sub.id);

    await expect(hasAvailableSeat(org.id)).resolves.toBe(true);
  });

  it('is false when the member count has reached the seat limit', async () => {
    const owner = await createTestUser(`seat-1-${suffix}`);
    userIds.push(owner.id);
    const org = await createTestOrganization({
      suffix: `seat-1-${suffix}`,
      ownerId: owner.id,
    });
    organizationIds.push(org.id);

    const [sub] = await db
      .insert(subscription)
      .values({
        plan: 'team',
        referenceId: org.id,
        stripeCustomerId: `cus_${suffix}_seat1`,
        status: 'active',
        seats: 1,
      })
      .returning();
    subscriptionIds.push(sub.id);

    await expect(hasAvailableSeat(org.id)).resolves.toBe(false);
  });
});

describe('canManageBilling', () => {
  it('is true for the owner', async () => {
    const owner = await createTestUser(`bill-owner-${suffix}`);
    const teamMember = await createTestUser(`bill-member-${suffix}`);
    const stranger = await createTestUser(`bill-stranger-${suffix}`);
    userIds.push(owner.id, teamMember.id, stranger.id);

    const org = await createTestOrganization({
      suffix: `bill-${suffix}`,
      ownerId: owner.id,
    });
    organizationIds.push(org.id);
    await db.insert(member).values({
      userId: teamMember.id,
      organizationId: org.id,
      role: 'member',
    });

    await expect(canManageBilling(org.id, owner.id)).resolves.toBe(true);
    await expect(canManageBilling(org.id, teamMember.id)).resolves.toBe(false);
    await expect(canManageBilling(org.id, stranger.id)).resolves.toBe(false);
    await expect(canManageBilling('', owner.id)).resolves.toBe(false);
    await expect(canManageBilling(org.id, undefined)).resolves.toBe(false);
    await expect(canManageBilling(undefined, owner.id)).resolves.toBe(false);
  });
});

describe('createNewOrganization', () => {
  it('creates a personal org with exactly one owner member', async () => {
    const owner = await createTestUser(`new-org-personal-${suffix}`);
    userIds.push(owner.id);

    const org = await createNewOrganization({
      ownerId: owner.id,
      type: 'personal',
    });
    organizationIds.push(org.id);

    expect(org.isPersonal).toBe(true);

    const members = await db
      .select()
      .from(member)
      .where(eq(member.organizationId, org.id));
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ userId: owner.id, role: 'owner' });
  });

  it('creates a team org with exactly one owner member', async () => {
    const owner = await createTestUser(`new-org-team-${suffix}`);
    userIds.push(owner.id);

    const org = await createNewOrganization({
      ownerId: owner.id,
      type: 'team',
    });
    organizationIds.push(org.id);

    expect(org.isPersonal).toBe(false);

    const members = await db
      .select()
      .from(member)
      .where(eq(member.organizationId, org.id));
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ userId: owner.id, role: 'owner' });
  });
});
