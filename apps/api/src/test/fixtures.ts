import db from '@/lib/db';
import {
  block,
  formSubmission,
  integration,
  member,
  organization,
  page,
  subscription,
  theme,
  user,
} from '@trylinky/db/schema';
import { inArray } from 'drizzle-orm';

export async function createTestUser(
  suffix: string,
  overrides: Partial<typeof user.$inferInsert> = {}
) {
  const [row] = await db
    .insert(user)
    .values({ email: `test-${suffix}@example.com`, ...overrides })
    .returning();
  return row;
}

export async function createTestOrganization({
  suffix,
  ownerId,
  ownerRole = 'owner',
}: {
  suffix: string;
  ownerId?: string;
  ownerRole?: string;
}) {
  const [org] = await db
    .insert(organization)
    .values({ name: `Test Org ${suffix}`, slug: `test-org-${suffix}` })
    .returning();

  if (ownerId) {
    await db.insert(member).values({ userId: ownerId, organizationId: org.id, role: ownerRole });
  }

  return org;
}

export async function createTestPage({
  organizationId,
  suffix,
  publishedAt = new Date(),
}: {
  organizationId: string;
  suffix: string;
  publishedAt?: Date | null;
}) {
  const [row] = await db
    .insert(page)
    .values({ slug: `test-page-${suffix}`, config: [], publishedAt, organizationId })
    .returning();
  return row;
}

export async function createTestBlock({
  pageId,
  type,
  data = {},
  config = {},
  integrationId,
}: {
  pageId: string;
  type: string;
  data?: unknown;
  config?: unknown;
  integrationId?: string;
}) {
  const [row] = await db
    .insert(block)
    .values({ pageId, type, data, config, integrationId })
    .returning();
  return row;
}

export async function createTestIntegration({
  organizationId,
  type,
}: {
  organizationId: string;
  type: string;
}) {
  const [row] = await db.insert(integration).values({ organizationId, type }).returning();
  return row;
}

export async function createTestTheme({
  createdById,
  organizationId,
  isDefault = false,
}: {
  createdById: string;
  organizationId?: string;
  isDefault?: boolean;
}) {
  const [row] = await db
    .insert(theme)
    .values({ createdById, organizationId, isDefault, name: 'Test theme' })
    .returning();
  return row;
}

/** Deletes in foreign-key order. Pass every id the test created. */
export async function cleanupTestData({
  userIds = [],
  organizationIds = [],
  pageIds = [],
  themeIds = [],
  integrationIds = [],
  subscriptionIds = [],
}: {
  userIds?: string[];
  organizationIds?: string[];
  pageIds?: string[];
  themeIds?: string[];
  integrationIds?: string[];
  subscriptionIds?: string[];
}) {
  if (pageIds.length) {
    await db.delete(formSubmission).where(inArray(formSubmission.pageId, pageIds));
    await db.delete(block).where(inArray(block.pageId, pageIds));
    await db.delete(page).where(inArray(page.id, pageIds));
  }
  if (integrationIds.length) {
    await db.delete(integration).where(inArray(integration.id, integrationIds));
  }
  if (themeIds.length) {
    await db.delete(theme).where(inArray(theme.id, themeIds));
  }
  if (subscriptionIds.length) {
    await db.delete(subscription).where(inArray(subscription.id, subscriptionIds));
  }
  if (organizationIds.length) {
    await db.delete(member).where(inArray(member.organizationId, organizationIds));
    await db.delete(organization).where(inArray(organization.id, organizationIds));
  }
  if (userIds.length) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
}
