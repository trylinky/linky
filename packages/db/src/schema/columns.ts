import { sql } from 'drizzle-orm';
import { text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Prisma generated ids client-side (`@default(uuid())` adds no database
 * default), so the column is plain TEXT with no DEFAULT. Keep it that way:
 * a DB default here would show up as drift in the parity check.
 */
export const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const createdAt = () =>
  timestamp('createdAt', { precision: 3, mode: 'date' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`);

/** Prisma's `@updatedAt` was client-side too: no DB default. */
export const updatedAt = () =>
  timestamp('updatedAt', { precision: 3, mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());
