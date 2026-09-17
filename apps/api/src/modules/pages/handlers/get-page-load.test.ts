import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestPage,
} from '@/test/fixtures';
import { subscription } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const suffix = randomUUID().slice(0, 8);
const API_KEY = `internal-${suffix}`;
let organizationId: string;
let pageId: string;
let subscriptionId: string;

beforeAll(async () => {
  organizationId = (await createTestOrganization({ suffix: `pl-${suffix}` }))
    .id;
  pageId = (await createTestPage({ organizationId, suffix: `pl-${suffix}` }))
    .id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      status: 'past_due',
      referenceId: organizationId,
      stripeCustomerId: `cus_pl_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
  });
});

afterEach(() => vi.unstubAllEnvs());

const load = () =>
  createApp().request(
    `/pages/${pageId}/internal/load`,
    { headers: { 'x-api-key': API_KEY } },
    testEnv()
  );

describe('GET /pages/:pageId/internal/load isPaid', () => {
  it('is true for a past_due premium subscription (Stripe still retrying)', async () => {
    vi.stubEnv('INTERNAL_API_KEY', API_KEY);

    const body = await (await load()).json();

    expect(body.isPaid).toBe(true);
  });

  it('is false once the subscription is canceled, even if plan still reads premium', async () => {
    vi.stubEnv('INTERNAL_API_KEY', API_KEY);
    await db
      .update(subscription)
      .set({ status: 'canceled' })
      .where(eq(subscription.id, subscriptionId));

    const body = await (await load()).json();

    expect(body.isPaid).toBe(false);
  });
});
