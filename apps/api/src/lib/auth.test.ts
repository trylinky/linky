import { createAuth } from '@/lib/auth';
import db from '@/lib/db';
import {
  account,
  invitation,
  member,
  organization,
  session,
  subscription,
  user,
  userFlag,
} from '@trylinky/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';

// Every side effect of the user.create.after hook that would reach the network.
vi.mock('@/lib/resend', () => ({ createContact: vi.fn() }));
vi.mock('@/modules/notifications/service', () => ({
  sendMagicLinkEmail: vi.fn(),
  sendOrganizationInvitationEmail: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  sendWelcomeFollowUpEmail: vi.fn(),
}));
vi.mock('@/modules/slack/service', () => ({
  sendNewUserSlackMessage: vi.fn(),
}));
vi.mock('@/modules/billing/utils/create-new-stripe-customer', () => ({
  createNewStripeCustomer: vi.fn(async () => ({ id: 'cus_auth_test' })),
}));
vi.mock('@/modules/billing/utils/create-new-subscription', () => ({
  createNewSubscription: vi.fn(async () => ({ id: 'sub_auth_test' })),
}));

const suffix = randomUUID().slice(0, 8);
const email = `auth-adapter-${suffix}@example.com`;

const userIds: string[] = [];
const organizationIds: string[] = [];

afterAll(async () => {
  if (organizationIds.length) {
    await db
      .delete(invitation)
      .where(inArray(invitation.organizationId, organizationIds));
  }
  if (userIds.length) {
    await db.delete(invitation).where(inArray(invitation.inviterId, userIds));
    await db.delete(session).where(inArray(session.userId, userIds));
    await db.delete(account).where(inArray(account.userId, userIds));
    await db.delete(userFlag).where(inArray(userFlag.userId, userIds));
  }
  if (organizationIds.length) {
    await db
      .delete(subscription)
      .where(inArray(subscription.referenceId, organizationIds));
    await db
      .delete(member)
      .where(inArray(member.organizationId, organizationIds));
    await db
      .delete(organization)
      .where(inArray(organization.id, organizationIds));
  }
  if (userIds.length) {
    await db.delete(member).where(inArray(member.userId, userIds));
    await db.delete(user).where(inArray(user.id, userIds));
  }
});

describe('better-auth database adapter', () => {
  const auth = createAuth();

  let userId: string;
  let organizationId: string;
  let sessionToken: string;

  it('creates a user and runs the user.create.after hook', async () => {
    const { internalAdapter } = await auth.$context;

    const created = await internalAdapter.createUser({
      email,
      name: 'Auth Adapter Test',
      emailVerified: false,
    });
    userId = created.id;
    userIds.push(userId);

    expect(created).toMatchObject({ email, name: 'Auth Adapter Test' });
    expect(typeof created.id).toBe('string');

    const memberships = await db.query.member.findMany({
      where: (m, { eq }) => eq(m.userId, userId),
      with: { organization: true },
    });
    organizationIds.push(...memberships.map((m) => m.organizationId));

    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({ role: 'owner' });
    expect(memberships[0].organization).toMatchObject({ isPersonal: true });
    organizationId = memberships[0].organizationId;

    const flags = await db
      .select()
      .from(userFlag)
      .where(
        and(eq(userFlag.userId, userId), eq(userFlag.key, 'showOnboardingTour'))
      );
    expect(flags).toHaveLength(1);
  });

  it('sets the active organization when a session is created', async () => {
    const { internalAdapter } = await auth.$context;

    const created = await internalAdapter.createSession(userId);
    sessionToken = created.token;

    expect(created).toMatchObject({
      userId,
      activeOrganizationId: organizationId,
    });

    const [row] = await db
      .select()
      .from(session)
      .where(eq(session.token, sessionToken));
    expect(row).toMatchObject({ userId, activeOrganizationId: organizationId });
  });

  it('resolves the session by token', async () => {
    const { internalAdapter } = await auth.$context;

    const found = await internalAdapter.findSession(sessionToken);

    expect(found?.session.token).toBe(sessionToken);
    expect(found?.user.id).toBe(userId);
    expect(found?.user.email).toBe(email);
  });

  it('reads plugin models through the adapter', async () => {
    const { adapter } = await auth.$context;

    const foundMember = await adapter.findOne<{
      userId: string;
      organizationId: string;
      role: string;
    }>({
      model: 'member',
      where: [{ field: 'userId', value: userId }],
    });
    expect(foundMember).toMatchObject({
      userId,
      organizationId,
      role: 'owner',
    });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const createdInvitation = await adapter.create<
      Record<string, unknown>,
      { id: string }
    >({
      model: 'invitation',
      data: {
        email: `auth-adapter-invitee-${suffix}@example.com`,
        inviterId: userId,
        organizationId,
        role: 'member',
        status: 'pending',
        expiresAt,
      },
    });
    expect(typeof createdInvitation.id).toBe('string');

    const foundInvitation = await adapter.findOne<Record<string, unknown>>({
      model: 'invitation',
      where: [{ field: 'id', value: createdInvitation.id }],
    });
    expect(foundInvitation).toMatchObject({
      id: createdInvitation.id,
      inviterId: userId,
      organizationId,
      status: 'pending',
    });
    expect((foundInvitation?.expiresAt as Date).getTime()).toBe(
      expiresAt.getTime()
    );

    const [row] = await db
      .select()
      .from(invitation)
      .where(eq(invitation.id, createdInvitation.id));
    expect(row).toMatchObject({ organizationId, role: 'member' });
  });
});
