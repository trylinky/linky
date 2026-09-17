import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { makeId } from '@/modules/pages/utils';
import { captureException } from '@sentry/cloudflare';
import { headerBlockDefaults } from '@trylinky/blocks';
import {
  isForbiddenSlug,
  isReservedSlug,
  regexSlug,
} from '@trylinky/common/slugs';
import { block, page } from '@trylinky/db/schema';
import { randomUUID } from 'crypto';
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';

type LayoutEntry = { i: string; [key: string]: unknown };

function filterLayoutToBlockIds(
  layout: unknown,
  validIds: Set<string>
): LayoutEntry[] {
  if (!Array.isArray(layout)) return [];
  return (layout as LayoutEntry[]).filter(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof entry.i === 'string' &&
      validIds.has(entry.i)
  );
}

async function getValidBlockIds(pageId: string): Promise<Set<string>> {
  const blocks = await db
    .select({ id: block.id })
    .from(block)
    .where(eq(block.pageId, pageId));
  return new Set(blocks.map((b) => b.id));
}

export async function getPageLayoutById(pageId: string) {
  const [row, validIds] = await Promise.all([
    db.query.page.findFirst({
      where: (p, { eq }) => eq(p.id, pageId),
      columns: {
        config: true,
        mobileConfig: true,
        publishedAt: true,
        organizationId: true,
      },
    }),
    getValidBlockIds(pageId),
  ]);

  if (!row) return null;

  return {
    ...row,
    config: filterLayoutToBlockIds(row.config, validIds),
    mobileConfig: filterLayoutToBlockIds(row.mobileConfig, validIds),
  };
}

export async function getPageThemeById(pageId: string) {
  const row = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.id, pageId), isNull(p.deletedAt)),
    columns: { publishedAt: true, organizationId: true },
    with: { theme: true },
  });

  return row ?? null;
}

export async function getPageIdBySlugOrDomain(slug: string, domain: string) {
  if (!slug && !domain) {
    return null;
  }

  const row = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(
        eq(p.slug, slug),
        domain ? eq(p.customDomain, decodeURIComponent(domain)) : undefined,
        isNull(p.deletedAt)
      ),
    columns: { id: true },
  });

  return row?.id;
}

export async function getPageBlocks(pageId: string) {
  const row = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.id, pageId), isNull(p.deletedAt)),
    columns: { organizationId: true, publishedAt: true },
    with: {
      blocks: {
        columns: {
          id: true,
          data: true,
          type: true,
          config: true,
          integrationId: true,
        },
        orderBy: (b, { asc }) => [asc(b.createdAt)],
      },
    },
  });

  return row ?? null;
}

export async function getPagesForOrganizationId(organizationId: string) {
  return db
    .select({ id: page.id, slug: page.slug })
    .from(page)
    .where(and(eq(page.organizationId, organizationId), isNull(page.deletedAt)))
    .orderBy(desc(page.createdAt));
}

export async function getPageSettings(pageId: string) {
  const row = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.id, pageId), isNull(p.deletedAt)),
    columns: {
      organizationId: true,
      id: true,
      publishedAt: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      backgroundImage: true,
      themeId: true,
      verifiedAt: true,
    },
  });

  return row ?? null;
}

export async function updatePageLayout(
  pageId: string,
  newLayout: { sm: any; xxs: any }
) {
  const validIds = await getValidBlockIds(pageId);

  const sm = filterLayoutToBlockIds(newLayout.sm, validIds);
  const xxs = filterLayoutToBlockIds(newLayout.xxs, validIds);

  const [updatedPage] = await db
    .update(page)
    .set({ config: sm, mobileConfig: xxs })
    .where(eq(page.id, pageId))
    .returning({
      id: page.id,
      config: page.config,
      mobileConfig: page.mobileConfig,
    });

  return {
    id: updatedPage.id,
    sm: updatedPage.config,
    xxs: updatedPage.mobileConfig,
  };
}

export async function checkUserHasAccessToPage(pageId: string, userId: string) {
  const [{ count: pages }] = await db
    .select({ count: count() })
    .from(page)
    .where(
      and(eq(page.id, pageId), userIsMemberOfOrg(page.organizationId, userId))
    );

  return pages > 0;
}

export async function createNewPage({
  slug,
  themeId,
  organizationId,
}: {
  slug: string;
  themeId: string;
  organizationId: string;
}) {
  const existingPage = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.slug, slug), isNull(p.deletedAt)),
    columns: { id: true },
  });

  if (!slug.match(regexSlug)) {
    return { error: { message: 'Slug is invalid', field: 'pageSlug' } };
  }

  if (isForbiddenSlug(slug)) {
    return { error: { message: 'Slug is forbidden', field: 'pageSlug' } };
  }

  if (isReservedSlug(slug)) {
    return {
      error: {
        message: 'Slug is reserved - reach out on twitter to request this',
        field: 'pageSlug',
      },
    };
  }

  if (existingPage) {
    return {
      error: {
        message: 'Page with this slug already exists',
        field: 'pageSlug',
      },
    };
  }

  const headerSectionId = randomUUID();
  const layout = [
    {
      h: 6,
      i: headerSectionId,
      w: 12,
      x: 0,
      y: 0,
      moved: false,
      static: false,
    },
  ];

  try {
    // Page and its header block land together or not at all.
    const newPage = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(page)
        .values({
          organizationId,
          slug,
          publishedAt: new Date(),
          themeId,
          metaTitle: `@${slug}`,
          config: layout,
          mobileConfig: layout,
        })
        .returning({ id: page.id, slug: page.slug });

      await tx.insert(block).values({
        id: headerSectionId,
        pageId: created.id,
        type: 'header',
        config: {},
        data: { ...headerBlockDefaults, title: `@${slug}` },
      });

      return { slug: created.slug };
    });

    return newPage;
  } catch (error) {
    captureException(error);
    console.log('error', error);
    return { error: { message: 'Error creating page' } };
  }
}

export async function updatePageSettings({
  pageId,
  organizationId,
  pageSlug,
  metaTitle,
  published,
}: {
  pageId: string;
  organizationId: string;
  pageSlug: string;
  metaTitle: string;
  published: boolean;
}): Promise<
  | { slug: string; previousSlug: string }
  | { error: { message: string; field?: 'pageSlug' | 'metaTitle' } }
> {
  const current = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(
        eq(p.id, pageId),
        isNull(p.deletedAt),
        eq(p.organizationId, organizationId)
      ),
    columns: { id: true, slug: true },
  });

  if (!current) {
    return { error: { message: 'Page not found' } };
  }

  if (!metaTitle) {
    return {
      error: { message: 'Please provide a page title', field: 'metaTitle' },
    };
  }

  if (current.slug !== pageSlug) {
    if (!pageSlug.match(regexSlug)) {
      return { error: { message: 'Slug is invalid', field: 'pageSlug' } };
    }

    if (isForbiddenSlug(pageSlug)) {
      return { error: { message: 'Slug is forbidden', field: 'pageSlug' } };
    }

    if (isReservedSlug(pageSlug)) {
      return {
        error: {
          message: 'Slug is reserved - reach out on twitter to request this',
          field: 'pageSlug',
        },
      };
    }

    const existing = await db.query.page.findFirst({
      where: (p, { and, eq, isNull }) =>
        and(eq(p.slug, pageSlug), isNull(p.deletedAt)),
      columns: { id: true },
    });

    if (existing) {
      return {
        error: {
          message: 'Page with this slug already exists',
          field: 'pageSlug',
        },
      };
    }
  }

  await db
    .update(page)
    .set({
      metaTitle,
      slug: pageSlug,
      publishedAt: published ? new Date() : null,
    })
    .where(eq(page.id, current.id));

  return { slug: pageSlug, previousSlug: current.slug };
}

export async function deletePage(pageId: string) {
  const row = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.id, pageId), isNull(p.deletedAt)),
    columns: { id: true, slug: true },
    with: { blocks: { columns: { id: true } } },
  });

  if (!row) {
    return false;
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(page)
        .set({
          deletedAt: new Date(),
          slug: `DELETED-${makeId(4)}-${row.slug}`,
        })
        .where(eq(page.id, pageId));

      const blockIds = row.blocks.map((b) => b.id);
      if (blockIds.length > 0) {
        await tx.delete(block).where(inArray(block.id, blockIds));
      }
    });
  } catch (error) {
    captureException(error);
    return false;
  }

  return true;
}
