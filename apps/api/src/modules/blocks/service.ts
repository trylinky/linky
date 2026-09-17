import db from '@/lib/db';
import { pageOwnedByUser } from '@/lib/db-predicates';
import { isAdminUser } from '@/lib/roles';
import { blocks, Blocks } from '@trylinky/blocks';
import type { User } from '@trylinky/db';
import { block, page } from '@trylinky/db/schema';
import { and, count, eq } from 'drizzle-orm';

export async function getBlockById(blockId: string) {
  const row = await db.query.block.findFirst({
    where: (b, { eq }) => eq(b.id, blockId),
    columns: { id: true, type: true, data: true, config: true },
    with: {
      page: { columns: { organizationId: true, publishedAt: true } },
      integration: { columns: { id: true, type: true, createdAt: true } },
    },
  });

  return row ?? null;
}

export async function createBlock(
  newBlock: { type: string; id: string },
  pageSlug: string
) {
  const defaultData = blocks[newBlock.type as Blocks].defaults;

  // Prisma's `connect: { slug }` did this lookup implicitly.
  const target = await db.query.page.findFirst({
    where: (p, { eq }) => eq(p.slug, pageSlug),
    columns: { id: true },
  });

  if (!target) {
    throw new Error('Page not found');
  }

  const [created] = await db
    .insert(block)
    .values({
      type: newBlock.type,
      id: newBlock.id,
      config: {},
      data: defaultData,
      pageId: target.id,
    })
    .returning();

  return created;
}

export async function getEnabledBlocks(user: Pick<User, 'role'>) {
  if (!user) {
    return [];
  }

  const enabledBlocks: Blocks[] = [];

  Object.entries(blocks).forEach(([key, blockDefinition]) => {
    if (blockDefinition.isBeta) {
      if (isAdminUser(user)) {
        enabledBlocks.push(key as Blocks);
      }
    } else {
      enabledBlocks.push(key as Blocks);
    }
  });

  return enabledBlocks;
}

export async function checkUserHasAccessToBlock(
  blockId: string,
  userId: string
) {
  const [{ count: matches }] = await db
    .select({ count: count() })
    .from(block)
    .where(and(eq(block.id, blockId), pageOwnedByUser(block.pageId, userId)));

  return matches > 0;
}

export async function deleteBlockById(id: string, userId: string) {
  const userHasAccess = await checkUserHasAccessToBlock(id, userId);

  if (!userHasAccess) {
    // Returning the error meant the caller saw a truthy value it ignored and
    // the delete went ahead anyway.
    throw new Error('User does not have access to this block');
  }

  // Delete and layout strip land together or not at all.
  await db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(block)
      .where(eq(block.id, id))
      .returning({ pageId: block.pageId });

    if (!deleted) {
      return;
    }

    const owner = await tx.query.page.findFirst({
      where: (p, { eq }) => eq(p.id, deleted.pageId),
      columns: { id: true, config: true },
    });

    if (owner?.config && Array.isArray(owner.config)) {
      await tx
        .update(page)
        .set({
          config: (owner.config as unknown[]).filter(
            (entry) => (entry as { i?: unknown })?.i !== id
          ),
        })
        .where(eq(page.id, owner.id));
    }
  });
}

export async function updateBlockData(blockId: string, newData: object) {
  const existing = await db.query.block.findFirst({
    where: (b, { eq }) => eq(b.id, blockId),
    columns: { type: true },
  });

  if (!existing) {
    throw new Error('Block not found');
  }
  const schema = blocks[existing.type as Blocks].schema;

  if (!schema) {
    throw new Error('Block schema not found');
  }

  try {
    const parsedData = await schema.validate(newData, { strict: true });

    const [updatedBlock] = await db
      .update(block)
      .set({ data: parsedData })
      .where(eq(block.id, blockId))
      .returning();

    return updatedBlock;
  } catch {
    throw new Error('Error updating block data');
  }
}
