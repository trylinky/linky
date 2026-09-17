import db from '@/lib/db';
import { block, member, page } from '@trylinky/db/schema';
import { and, eq, exists, sql, type SQL, type SQLWrapper } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

/**
 * Prisma expressed authorization as relation filters
 * (`organization.members.some.userId`). Drizzle's update and delete take no
 * relation filter, so the same checks are EXISTS subqueries that any where
 * clause can embed. The subqueries are built through the request-scoped
 * proxy but never executed on their own.
 *
 * The inner tables are aliased because a caller building a query that is
 * itself `FROM "Page"` (or "Block"/"Member") and also embeds
 * `pageOwnedByUser(page.id, userId)` would otherwise have the predicate's
 * own `from(page)` shadow the caller's `page` reference, collapsing
 * `"Page"."id" = "Page"."id"` into an always-true comparison — owning any
 * page would grant access to every page.
 */
const orgMember = alias(member, 'org_member');
const ownedPage = alias(page, 'owned_page');
const ownedBlock = alias(block, 'owned_block');

export function userIsMemberOfOrg(
  organizationId: SQLWrapper | string,
  userId: string,
  role?: string
): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(orgMember)
      .where(
        and(
          eq(orgMember.organizationId, organizationId),
          eq(orgMember.userId, userId),
          role !== undefined ? eq(orgMember.role, role) : undefined
        )
      )
  );
}

export function pageOwnedByUser(
  pageId: SQLWrapper | string,
  userId: string,
  organizationId?: string
): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(ownedPage)
      .where(
        and(
          eq(ownedPage.id, pageId),
          organizationId !== undefined ? eq(ownedPage.organizationId, organizationId) : undefined,
          userIsMemberOfOrg(ownedPage.organizationId, userId)
        )
      )
  );
}

export function blockOwnedByUser(
  blockId: SQLWrapper | string,
  userId: string,
  organizationId?: string
): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(ownedBlock)
      .where(
        and(eq(ownedBlock.id, blockId), pageOwnedByUser(ownedBlock.pageId, userId, organizationId))
      )
  );
}
