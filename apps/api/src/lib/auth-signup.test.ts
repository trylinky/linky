import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  account,
  member,
  organization,
  session,
  subscription,
  user,
  userFlag,
} from '@trylinky/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// A magic-link sign-up through the real HTTP flow. better-auth defers the
// `user.create.after` hook (which creates the personal org) until after the
// request handler has finished — i.e. after the first session was created —
// so without the fallback in the session hook every new email sign-up got a
// session with no activeOrganizationId and bounced out of the editor.

const magicLinkUrls: string[] = [];

// Every side effect of sign-up that would reach the network.
vi.mock('@/lib/resend', () => ({ createContact: vi.fn() }));
vi.mock('@/modules/notifications/service', () => ({
  sendMagicLinkEmail: vi.fn(async ({ url }: { url: string }) => {
    magicLinkUrls.push(url);
  }),
  sendOrganizationInvitationEmail: vi.fn(),
  sendWelcomeEmail: vi.fn(),
  sendWelcomeFollowUpEmail: vi.fn(),
}));
vi.mock('@/modules/slack/service', () => ({
  sendNewUserSlackMessage: vi.fn(),
  sendSlackMessage: vi.fn(),
}));

const createNewStripeCustomer = vi.fn(async () => ({ id: 'cus_signup_test' }));
vi.mock('@/modules/billing/utils/create-new-stripe-customer', () => ({
  createNewStripeCustomer: (...args: unknown[]) =>
    createNewStripeCustomer(...(args as [])),
}));

const createNewSubscription = vi.fn(async () => ({ id: 'sub_signup_test' }));
vi.mock('@/modules/billing/utils/create-new-subscription', () => ({
  createNewSubscription: (...args: unknown[]) =>
    createNewSubscription(...(args as [])),
}));

const suffix = randomUUID().slice(0, 8);
const email = `signup-flow-${suffix}@example.com`;

// The magic-link handler builds its link from API_BASE_URL. CI sets only
// DATABASE_URL and APP_FRONTEND_URL, so provide the rest here rather than
// depending on a developer's .env.local.
beforeAll(() => {
  vi.stubEnv(
    'API_BASE_URL',
    process.env.API_BASE_URL ?? 'http://localhost:3001'
  );
  vi.stubEnv(
    'APP_FRONTEND_URL',
    process.env.APP_FRONTEND_URL ?? 'http://localhost:3000'
  );
});

afterAll(async () => {
  vi.unstubAllEnvs();
  const users = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email));
  const userIds = users.map((u) => u.id);
  if (!userIds.length) return;

  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(inArray(member.userId, userIds));
  const organizationIds = memberships.map((m) => m.organizationId);

  await db.delete(session).where(inArray(session.userId, userIds));
  await db.delete(account).where(inArray(account.userId, userIds));
  await db.delete(userFlag).where(inArray(userFlag.userId, userIds));
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
  await db.delete(user).where(inArray(user.id, userIds));
});

describe('magic-link sign-up', () => {
  it('gives the first session an active organization and creates that org once', async () => {
    const app = createApp();
    const origin = process.env.APP_FRONTEND_URL as string;

    const start = await app.request(
      '/api/auth/sign-in/magic-link',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify({ email, callbackURL: `${origin}/edit` }),
      },
      testEnv()
    );
    expect(start.status).toBe(200);
    expect(magicLinkUrls).toHaveLength(1);

    const token = new URL(magicLinkUrls[0]).searchParams.get('token');
    const verify = await app.request(
      `/api/auth/magic-link/verify?token=${token}&callbackURL=${encodeURIComponent(`${origin}/edit`)}`,
      { redirect: 'manual' },
      testEnv()
    );
    expect(verify.status).toBe(302);

    const cookieHeader = verify.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';')[0])
      .join('; ');

    const me = await app.request(
      '/api/auth/get-session',
      { headers: { cookie: cookieHeader, origin } },
      testEnv()
    );
    const body = (await me.json()) as Record<string, any>;

    const memberships = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(eq(user.email, email));

    expect(memberships).toHaveLength(1);
    expect(body.session.activeOrganizationId).toBe(
      memberships[0].organizationId
    );

    // The deferred sign-up hook ran after the session hook created the org
    // and must have reused it: one org, one Stripe customer, one trial.
    const [row] = await db
      .select({ activeOrganizationId: session.activeOrganizationId })
      .from(session)
      .where(eq(session.token, body.session.token));
    expect(row.activeOrganizationId).toBe(memberships[0].organizationId);
    expect(createNewStripeCustomer).toHaveBeenCalledTimes(1);
    expect(createNewSubscription).toHaveBeenCalledTimes(1);
  });
});
