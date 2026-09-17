# Prisma to Drizzle, Phase 1 (API worker) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Prisma with Drizzle ORM in `apps/api`, make drizzle-kit the schema migration tool, and rewrite the seed, leaving the frontend on its existing Prisma client until Phase 2.

**Architecture:** A new `packages/db` package holds a Drizzle schema that mirrors the production DDL name for name, a `createDb` factory over `pg`, inferred types, migrations, and the seed. `apps/api/src/lib/db.ts` keeps the AsyncLocalStorage proxy pattern from `lib/prisma.ts` so call sites keep a plain module import. Modules are ported one at a time with their route tests as the regression gate. A parity script proves the Drizzle baseline matches `schema.prisma` before merge.

**Tech Stack:** drizzle-orm 0.45.x, drizzle-kit 0.31.x, pg 8.23.x, better-auth 1.6.x (`better-auth/adapters/drizzle`), Hono, Vitest, Cloudflare Workers with `nodejs_compat`.

**Spec:** `docs/superpowers/specs/2026-09-17-prisma-to-drizzle-migration-design.md`

## Global Constraints

- Table, column, enum, index, unique, and foreign key names are declared exactly as the Prisma migrations created them: quoted PascalCase tables (`"Page"`), camelCase columns, `<Table>_pkey`, `<Table>_<cols>_idx`, `<Table>_<cols>_key`, `<Table>_<col>_fkey`.
- `id` columns are `TEXT` with a client-side UUID default (`$defaultFn`), never a database default. `createdAt` is `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`. `updatedAt` is `TIMESTAMP(3) NOT NULL` with no database default and a client-side `$defaultFn` and `$onUpdate`.
- Foreign key actions come from the migration SQL: required relations `ON DELETE RESTRICT ON UPDATE CASCADE`; optional relations `ON DELETE SET NULL ON UPDATE CASCADE`; `Account.userId` and `FormSubmission.pageId` `ON DELETE CASCADE ON UPDATE CASCADE`.
- JSON columns stay `jsonb` with Drizzle's default `unknown` type. No tightening.
- Driver is `pg` via `drizzle-orm/node-postgres`, one `Pool` of size 1 per request from `env.HYPERDRIVE.connectionString`.
- Every call site keeps a plain `import db from '@/lib/db'`; no client is threaded through parameters.
- `schema.prisma` stays in place for the frontend during Phase 1. Any schema change in this window must be made in both files (none are planned).
- Read-then-write uniqueness checks keep their shape; no Postgres error-code mapping is introduced.
- Commit messages: short subject line, no trailers.
- Tests run against the shared dev database via `dotenvx -f ../../.env.local`, serially. Every fixture uses a random suffix and cleans up in foreign-key order.

---

## File structure

**Create**

- `packages/db/package.json`, `tsconfig.json`, `drizzle.config.ts`
- `packages/db/src/schema/enums.ts` — the two Postgres enums
- `packages/db/src/schema/columns.ts` — `id()`, `createdAt()`, `updatedAt()` column helpers
- `packages/db/src/schema/tables.ts` — all 16 tables, in dependency order (one file, not one per table: `foreignKey()` needs the referenced table object, and Page↔Theme↔Organization↔User form cycles that ESM circular imports would make fragile)
- `packages/db/src/schema/relations.ts` — `relations()` for every foreign key
- `packages/db/src/schema/index.ts` — re-exports enums, tables, relations
- `packages/db/src/client.ts` — `createDb({ connectionString })` returning `{ db, close }`, and the `Db` type
- `packages/db/src/types.ts` — `Page`, `Block`, … `$inferSelect` aliases, `NewPage` … `$inferInsert`, `JsonValue`, enum value objects
- `packages/db/src/index.ts` — re-exports client and types
- `packages/db/src/seed-data.ts` — `defaultThemeSeeds`, `defaultThemes`, `DefaultThemeNames` (moved from `apps/frontend/lib/theme.ts`)
- `packages/db/src/seed.ts` — idempotent seed
- `packages/db/scripts/check-parity.sh` — applies Drizzle migrations to an empty database and diffs against `schema.prisma`
- `packages/db/migrations/0000_baseline.sql` and `migrations/meta/*` — generated
- `packages/db/migrations/README.md` — how the baseline was adopted in production
- `apps/api/src/lib/db.ts`, `apps/api/src/lib/db.test.ts` — replaces `lib/prisma.ts` and its test
- `apps/api/src/lib/db-predicates.ts`, `apps/api/src/lib/db-predicates.test.ts` — `userIsMemberOfOrg`, `pageOwnedByUser`, `blockOwnedByUser`
- `apps/api/src/test/fixtures.ts` — shared DB fixtures for tests

**Modify** (every file in `apps/api/src` that imports `@/lib/prisma` or `@trylinky/prisma`)

- `middleware/request-context.ts`
- `modules/pages/service.ts`, `modules/pages/index.ts`, `modules/pages/handlers/get-page-load.ts`, `get-page-slug-or-domain.ts`, `get-slug-availability.ts`
- `modules/reactions/handlers/get-reactions.ts`, `modules/analytics/handlers/analytics-for-page.ts`
- `modules/blocks/service.ts`, `modules/blocks/index.ts`
- `modules/forms/service.ts`, `modules/forms/service.test.ts`, `modules/forms/routes.test.ts`
- `modules/assets/authorization.ts`, `modules/assets/authorization.test.ts`
- `modules/integrations/service.ts`, `modules/integrations/index.ts`, `modules/integrations/service.test.ts`
- `modules/services/spotify/index.ts`, `modules/services/threads/index.ts`, `modules/services/instagram/index.ts`
- `modules/marketing/index.ts`
- `modules/organizations/utils.ts`, `modules/organizations/index.ts`
- `modules/flags/handlers/flags-for-current-user.ts`, `hide-onboarding-tour.ts`
- `modules/themes/service.ts`
- `lib/user-created.ts`
- `modules/billing/utils/create-new-subscription.ts` and every handler under `modules/billing/handlers/` (`cancel-subscription.ts`, `billing-portal-url.ts`, `billing-portal-url.test.ts`, `upgrade-to-team.ts`, `upgrade-trial.ts`, `upgrade-eligibility.ts`, `upgrade-to-premium.ts`, `current-user-subscription.ts`, `stripe/handle-trial-expired.ts`, `stripe/handle-trial-will-end.ts`, `stripe/handle-subscription-deleted.ts`, `stripe/handle-subscription-cancelled.ts`, `stripe/handle-subscription-created.ts`)
- `modules/orchestrators/index.ts`, `modules/orchestrators/tiktok.ts`
- `lib/auth.ts`
- `apps/api/package.json`
- `packages/prisma/prisma/schema.prisma` (remove the workerd generator), `packages/prisma/package.json` (remove the workerd export condition), delete `packages/prisma/index.workerd.ts`, `packages/prisma/prisma/seed.ts`
- `apps/frontend/lib/theme.ts`, `apps/frontend/next.config.ts`, `apps/frontend/package.json` (drop `prisma migrate deploy` from `vercel:build`)
- `.github/workflows/ci.yml`, `turbo.json`, root `package.json`
- `docs/local-development.md`, `docs/self-hosting.md`, `CONTRIBUTING.md`

**Delete** (end of Phase 1)

- `apps/api/src/lib/prisma.ts`, `apps/api/src/lib/prisma.test.ts`
- `packages/prisma/src/generated-workerd/`

---

### Task 1: Scaffold `packages/db` with the schema

**Files:**
- Create: `packages/db/package.json`, `packages/db/tsconfig.json`, `packages/db/drizzle.config.ts`, `packages/db/src/schema/enums.ts`, `packages/db/src/schema/columns.ts`, `packages/db/src/schema/tables.ts`, `packages/db/src/schema/relations.ts`, `packages/db/src/schema/index.ts`

**Interfaces:**
- Produces: `@trylinky/db/schema` exporting tables `user, session, account, verification, organization, member, invitation, subscription, page, block, formSubmission, integration, theme, verificationRequest, orchestration, userFlag`, enums `verificationRequestStatus`, `orchestrationType`, and one `<table>Relations` export per table.

- [ ] **Step 1: Create the package manifest and configs**

`packages/db/package.json`:

```json
{
  "name": "@trylinky/db",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema": "./src/schema/index.ts",
    "./seed-data": "./src/seed-data.ts"
  },
  "scripts": {
    "generate": "dotenvx run -f ../../.env.local --ignore=MISSING_ENV_FILE -- drizzle-kit generate",
    "migrate": "dotenvx run -f ../../.env.local --ignore=MISSING_ENV_FILE -- drizzle-kit migrate",
    "push": "dotenvx run -f ../../.env.local --ignore=MISSING_ENV_FILE -- drizzle-kit push",
    "seed": "dotenvx run -f ../../.env.local --ignore=MISSING_ENV_FILE -- tsx src/seed.ts",
    "check-parity": "./scripts/check-parity.sh",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.2",
    "pg": "^8.23.0"
  },
  "devDependencies": {
    "@dotenvx/dotenvx": "^1.24.0",
    "@types/node": "22.8.7",
    "@types/pg": "^8.15.0",
    "drizzle-kit": "^0.31.10",
    "tsx": "^4.19.0",
    "typescript": "^5"
  }
}
```

`packages/db/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "Preserve",
    "moduleResolution": "bundler",
    "types": ["node"],
    "rootDir": "./",
    "noEmit": true
  },
  "include": ["src/**/*.ts", "drizzle.config.ts"]
}
```

`packages/db/drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    // DIRECT_URL, not DATABASE_URL: the same split prisma.config.ts used, so
    // migrations bypass any pooler.
    url: process.env.DIRECT_URL as string,
  },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 2: Install dependencies**

Run from the repo root: `pnpm install`
Expected: lockfile updated, `packages/db/node_modules/drizzle-orm` exists.

- [ ] **Step 3: Write the enums and column helpers**

`packages/db/src/schema/enums.ts`:

```ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const verificationRequestStatus = pgEnum('VerificationRequestStatus', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const orchestrationType = pgEnum('OrchestrationType', ['TIKTOK']);
```

`packages/db/src/schema/columns.ts`:

```ts
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
```

- [ ] **Step 4: Write the tables**

`packages/db/src/schema/tables.ts`. Every name below is copied from the migration SQL.

```ts
import { createdAt, id, updatedAt } from './columns';
import { orchestrationType, verificationRequestStatus } from './enums';
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { precision: 3, mode: 'date' });

export const user = pgTable(
  'User',
  {
    id: id(),
    name: text('name'),
    email: text('email'),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    role: text('role'),
    banned: boolean('banned'),
    banReason: text('banReason'),
    banExpires: integer('banExpires'),
    stripeCustomerId: text('stripeCustomerId'),
    metadata: jsonb('metadata'),
  },
  (t) => [
    uniqueIndex('User_email_key').on(t.email),
    index('User_email_idx').on(t.email),
  ]
);

export const organization = pgTable(
  'Organization',
  {
    id: id(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    logo: text('logo'),
    metadata: text('metadata'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    isPersonal: boolean('isPersonal').notNull().default(true),
  },
  (t) => [
    uniqueIndex('Organization_slug_key').on(t.slug),
    index('Organization_slug_idx').on(t.slug),
  ]
);

export const account = pgTable(
  'Account',
  {
    id: id(),
    userId: text('userId').notNull(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    accessTokenExpiresAt: ts('accessTokenExpiresAt'),
    refreshTokenExpiresAt: ts('refreshTokenExpiresAt'),
    scope: text('scope'),
    idToken: text('idToken'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('Account_providerId_accountId_key').on(t.providerId, t.accountId),
    index('Account_userId_idx').on(t.userId),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [user.id],
      name: 'Account_userId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ]
);

export const verification = pgTable('Verification', {
  id: id(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: ts('expiresAt').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  'Session',
  {
    id: id(),
    userId: text('userId').notNull(),
    token: text('token').notNull(),
    expiresAt: ts('expiresAt').notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    activeOrganizationId: text('activeOrganizationId'),
    impersonatedBy: text('impersonatedBy'),
  },
  (t) => [
    uniqueIndex('Session_token_key').on(t.token),
    index('Session_userId_token_idx').on(t.userId, t.token),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [user.id],
      name: 'Session_userId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ]
);

export const invitation = pgTable(
  'Invitation',
  {
    id: id(),
    email: text('email').notNull(),
    inviterId: text('inviterId').notNull(),
    organizationId: text('organizationId').notNull(),
    role: text('role').notNull(),
    status: text('status').notNull(),
    expiresAt: ts('expiresAt').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('Invitation_organizationId_idx').on(t.organizationId),
    index('Invitation_inviterId_idx').on(t.inviterId),
    foreignKey({
      columns: [t.inviterId],
      foreignColumns: [user.id],
      name: 'Invitation_inviterId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organization.id],
      name: 'Invitation_organizationId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ]
);

export const member = pgTable(
  'Member',
  {
    id: id(),
    userId: text('userId').notNull(),
    organizationId: text('organizationId').notNull(),
    role: text('role').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('Member_organizationId_idx').on(t.organizationId),
    index('Member_userId_idx').on(t.userId),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [user.id],
      name: 'Member_userId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organization.id],
      name: 'Member_organizationId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ]
);

export const subscription = pgTable(
  'Subscription',
  {
    id: id(),
    plan: text('plan').notNull(),
    referenceId: text('referenceId').notNull(),
    stripeCustomerId: text('stripeCustomerId').notNull(),
    stripeSubscriptionId: text('stripeSubscriptionId'),
    status: text('status').notNull(),
    periodStart: ts('periodStart'),
    periodEnd: ts('periodEnd'),
    cancelAtPeriodEnd: boolean('cancelAtPeriodEnd'),
    seats: integer('seats'),
    trialStart: ts('trialStart'),
    trialEnd: ts('trialEnd'),
  },
  (t) => [
    uniqueIndex('Subscription_referenceId_key').on(t.referenceId),
    index('Subscription_referenceId_idx').on(t.referenceId),
    foreignKey({
      columns: [t.referenceId],
      foreignColumns: [organization.id],
      name: 'Subscription_referenceId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ]
);

export const theme = pgTable(
  'Theme',
  {
    id: id(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    name: text('name').notNull().default(''),
    isDefault: boolean('isDefault').notNull().default(false),
    createdById: text('createdById').notNull(),
    colorBgBase: jsonb('colorBgBase'),
    colorBgPrimary: jsonb('colorBgPrimary'),
    colorBgSecondary: jsonb('colorBgSecondary'),
    colorBorderPrimary: jsonb('colorBorderPrimary'),
    colorTitlePrimary: jsonb('colorTitlePrimary'),
    colorTitleSecondary: jsonb('colorTitleSecondary'),
    colorLabelPrimary: jsonb('colorLabelPrimary'),
    colorLabelSecondary: jsonb('colorLabelSecondary'),
    colorLabelTertiary: jsonb('colorLabelTertiary'),
    font: text('font'),
    backgroundImage: text('backgroundImage'),
    organizationId: text('organizationId'),
  },
  (t) => [
    index('Theme_createdById_idx').on(t.createdById),
    index('Theme_organizationId_idx').on(t.organizationId),
    foreignKey({
      columns: [t.createdById],
      foreignColumns: [user.id],
      name: 'Theme_createdById_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organization.id],
      name: 'Theme_organizationId_fkey',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ]
);

export const page = pgTable(
  'Page',
  {
    id: id(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    publishedAt: ts('publishedAt'),
    deletedAt: ts('deletedAt'),
    slug: text('slug').notNull(),
    config: jsonb('config').notNull(),
    mobileConfig: jsonb('mobileConfig'),
    metaTitle: text('metaTitle'),
    metaDescription: text('metaDescription'),
    themeId: text('themeId'),
    backgroundImage: text('backgroundImage'),
    customDomain: text('customDomain'),
    verifiedAt: ts('verifiedAt'),
    isFeatured: boolean('isFeatured').notNull().default(false),
    organizationId: text('organizationId'),
  },
  (t) => [
    uniqueIndex('Page_slug_key').on(t.slug),
    uniqueIndex('Page_customDomain_key').on(t.customDomain),
    index('Page_organizationId_idx').on(t.organizationId),
    index('Page_organizationId_deletedAt_idx').on(t.organizationId, t.deletedAt),
    index('Page_slug_deletedAt_idx').on(t.slug, t.deletedAt),
    index('Page_customDomain_deletedAt_idx').on(t.customDomain, t.deletedAt),
    index('Page_themeId_idx').on(t.themeId),
    foreignKey({
      columns: [t.themeId],
      foreignColumns: [theme.id],
      name: 'Page_themeId_fkey',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organization.id],
      name: 'Page_organizationId_fkey',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ]
);

export const integration = pgTable(
  'Integration',
  {
    id: id(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    type: text('type').notNull(),
    displayName: text('displayName'),
    encryptedConfig: text('encryptedConfig'),
    deletedAt: ts('deletedAt'),
    organizationId: text('organizationId'),
  },
  (t) => [
    index('Integration_type_idx').on(t.type),
    index('Integration_organizationId_idx').on(t.organizationId),
    index('Integration_organizationId_deletedAt_idx').on(t.organizationId, t.deletedAt),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organization.id],
      name: 'Integration_organizationId_fkey',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ]
);

export const block = pgTable(
  'Block',
  {
    id: id(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    pageId: text('pageId').notNull(),
    type: text('type').notNull(),
    config: jsonb('config').notNull(),
    data: jsonb('data').notNull(),
    integrationId: text('integrationId'),
  },
  (t) => [
    index('Block_pageId_idx').on(t.pageId),
    index('Block_integrationId_idx').on(t.integrationId),
    foreignKey({
      columns: [t.pageId],
      foreignColumns: [page.id],
      name: 'Block_pageId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.integrationId],
      foreignColumns: [integration.id],
      name: 'Block_integrationId_fkey',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ]
);

// Submissions are immutable write-once records: no updatedAt by design.
// blockId is deliberately NOT a foreign key; submissions survive block
// deletion and render from fieldsSnapshot.
export const formSubmission = pgTable(
  'FormSubmission',
  {
    id: id(),
    createdAt: createdAt(),
    pageId: text('pageId').notNull(),
    blockId: text('blockId').notNull(),
    answers: jsonb('answers').notNull(),
    fieldsSnapshot: jsonb('fieldsSnapshot').notNull(),
    visitorIp: text('visitorIp'),
  },
  (t) => [
    index('FormSubmission_blockId_createdAt_idx').on(t.blockId, t.createdAt),
    index('FormSubmission_blockId_visitorIp_createdAt_idx').on(t.blockId, t.visitorIp, t.createdAt),
    index('FormSubmission_pageId_blockId_createdAt_idx').on(t.pageId, t.blockId, t.createdAt),
    foreignKey({
      columns: [t.pageId],
      foreignColumns: [page.id],
      name: 'FormSubmission_pageId_fkey',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ]
);

export const verificationRequest = pgTable(
  'VerificationRequest',
  {
    id: id(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    pageId: text('pageId').notNull(),
    status: verificationRequestStatus('status').notNull().default('PENDING'),
    requestedByUserId: text('requestedByUserId').notNull(),
    rejectedReason: text('rejectedReason'),
    verifiedAt: ts('verifiedAt'),
    rejectedAt: ts('rejectedAt'),
    requestedPageTitle: text('requestedPageTitle').notNull(),
  },
  (t) => [
    index('VerificationRequest_requestedByUserId_idx').on(t.requestedByUserId),
    index('VerificationRequest_pageId_idx').on(t.pageId),
    foreignKey({
      columns: [t.pageId],
      foreignColumns: [page.id],
      name: 'VerificationRequest_pageId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    foreignKey({
      columns: [t.requestedByUserId],
      foreignColumns: [user.id],
      name: 'VerificationRequest_requestedByUserId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ]
);

export const orchestration = pgTable(
  'Orchestration',
  {
    id: id(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    expiresAt: ts('expiresAt').notNull(),
    pageGeneratedAt: ts('pageGeneratedAt'),
    pageId: text('pageId'),
    type: orchestrationType('type').notNull(),
  },
  (t) => [
    index('Orchestration_pageId_idx').on(t.pageId),
    foreignKey({
      columns: [t.pageId],
      foreignColumns: [page.id],
      name: 'Orchestration_pageId_fkey',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ]
);

export const userFlag = pgTable(
  'UserFlag',
  {
    id: id(),
    userId: text('userId').notNull(),
    key: text('key').notNull(),
    value: boolean('value').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('UserFlag_userId_idx').on(t.userId),
    foreignKey({
      columns: [t.userId],
      foreignColumns: [user.id],
      name: 'UserFlag_userId_fkey',
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  ]
);
```

- [ ] **Step 5: Write the relations**

`packages/db/src/schema/relations.ts`:

```ts
import {
  account,
  block,
  formSubmission,
  integration,
  invitation,
  member,
  orchestration,
  organization,
  page,
  session,
  subscription,
  theme,
  user,
  userFlag,
  verificationRequest,
} from './tables';
import { relations } from 'drizzle-orm';

export const userRelations = relations(user, ({ many }) => ({
  verificationRequests: many(verificationRequest),
  sessions: many(session),
  invitations: many(invitation),
  memberships: many(member),
  accounts: many(account),
  themesCreated: many(theme),
  userFlags: many(userFlag),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const organizationRelations = relations(organization, ({ one, many }) => ({
  integrations: many(integration),
  themes: many(theme),
  pages: many(page),
  invitations: many(invitation),
  members: many(member),
  subscription: one(subscription, {
    fields: [organization.id],
    references: [subscription.referenceId],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  inviter: one(user, { fields: [invitation.inviterId], references: [user.id] }),
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
}));

export const memberRelations = relations(member, ({ one }) => ({
  user: one(user, { fields: [member.userId], references: [user.id] }),
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  organization: one(organization, {
    fields: [subscription.referenceId],
    references: [organization.id],
  }),
}));

export const pageRelations = relations(page, ({ one, many }) => ({
  blocks: many(block),
  theme: one(theme, { fields: [page.themeId], references: [theme.id] }),
  verificationRequests: many(verificationRequest),
  orchestrations: many(orchestration),
  formSubmissions: many(formSubmission),
  organization: one(organization, {
    fields: [page.organizationId],
    references: [organization.id],
  }),
}));

export const blockRelations = relations(block, ({ one }) => ({
  page: one(page, { fields: [block.pageId], references: [page.id] }),
  integration: one(integration, {
    fields: [block.integrationId],
    references: [integration.id],
  }),
}));

export const formSubmissionRelations = relations(formSubmission, ({ one }) => ({
  page: one(page, { fields: [formSubmission.pageId], references: [page.id] }),
}));

export const integrationRelations = relations(integration, ({ one, many }) => ({
  blocks: many(block),
  organization: one(organization, {
    fields: [integration.organizationId],
    references: [organization.id],
  }),
}));

export const themeRelations = relations(theme, ({ one, many }) => ({
  createdBy: one(user, { fields: [theme.createdById], references: [user.id] }),
  pages: many(page),
  organization: one(organization, {
    fields: [theme.organizationId],
    references: [organization.id],
  }),
}));

export const verificationRequestRelations = relations(verificationRequest, ({ one }) => ({
  page: one(page, { fields: [verificationRequest.pageId], references: [page.id] }),
  requestedBy: one(user, {
    fields: [verificationRequest.requestedByUserId],
    references: [user.id],
  }),
}));

export const orchestrationRelations = relations(orchestration, ({ one }) => ({
  page: one(page, { fields: [orchestration.pageId], references: [page.id] }),
}));

export const userFlagRelations = relations(userFlag, ({ one }) => ({
  user: one(user, { fields: [userFlag.userId], references: [user.id] }),
}));
```

`packages/db/src/schema/index.ts`:

```ts
export * from './enums';
export * from './tables';
export * from './relations';
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @trylinky/db typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/db pnpm-lock.yaml
git commit -m "db: add drizzle schema package"
```

---

### Task 2: Client factory, types, and package entry

**Files:**
- Create: `packages/db/src/client.ts`, `packages/db/src/types.ts`, `packages/db/src/index.ts`

**Interfaces:**
- Produces: `createDb({ connectionString }): { db: Db; close: () => Promise<void> }`, `type Db = NodePgDatabase<typeof schema>`, model types `User, Session, Account, Verification, Organization, Member, Invitation, Subscription, Page, Block, FormSubmission, Integration, Theme, VerificationRequest, Orchestration, UserFlag` and `New*` insert types, `JsonValue`, value objects `VerificationRequestStatus`, `OrchestrationType`.

- [ ] **Step 1: Write the client factory**

`packages/db/src/client.ts`:

```ts
import * as schema from './schema';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Db = NodePgDatabase<typeof schema>;

const SLOW_QUERY_THRESHOLD_MS = 50;

/**
 * pg's Pool is the only place every statement passes through, so timing is
 * wrapped here. Drizzle's Logger interface fires before execution and has
 * no duration, which is why it is not used for this.
 */
function timedPool(connectionString: string): Pool {
  const pool = new Pool({ connectionString, max: 1 });
  // pg's `query` has callback and promise overloads; Drizzle only uses the
  // promise form, so the wrapper is typed loosely and assigned through an
  // untyped view of the pool.
  const original = pool.query.bind(pool) as (...args: unknown[]) => Promise<unknown>;

  (pool as unknown as { query: unknown }).query = async (...args: unknown[]) => {
    const before = Date.now();
    try {
      return await original(...args);
    } finally {
      const duration = Date.now() - before;
      if (duration >= SLOW_QUERY_THRESHOLD_MS) {
        const first = args[0];
        const text = typeof first === 'string' ? first : (first as { text?: string })?.text;
        console.log(`Slow query took ${duration}ms: ${(text ?? '').slice(0, 120)}`);
      }
    }
  };

  return pool;
}

export function createDb({ connectionString }: { connectionString: string }): {
  db: Db;
  close: () => Promise<void>;
} {
  const pool = timedPool(connectionString);
  const db = drizzle({ client: pool, schema });

  return { db, close: () => pool.end() };
}
```

- [ ] **Step 2: Write the types**

`packages/db/src/types.ts`:

```ts
import * as t from './schema/tables';

export type User = typeof t.user.$inferSelect;
export type NewUser = typeof t.user.$inferInsert;
export type Session = typeof t.session.$inferSelect;
export type Account = typeof t.account.$inferSelect;
export type Verification = typeof t.verification.$inferSelect;
export type Organization = typeof t.organization.$inferSelect;
export type NewOrganization = typeof t.organization.$inferInsert;
export type Member = typeof t.member.$inferSelect;
export type Invitation = typeof t.invitation.$inferSelect;
export type Subscription = typeof t.subscription.$inferSelect;
export type NewSubscription = typeof t.subscription.$inferInsert;
export type Page = typeof t.page.$inferSelect;
export type NewPage = typeof t.page.$inferInsert;
export type Block = typeof t.block.$inferSelect;
export type NewBlock = typeof t.block.$inferInsert;
export type FormSubmission = typeof t.formSubmission.$inferSelect;
export type Integration = typeof t.integration.$inferSelect;
export type NewIntegration = typeof t.integration.$inferInsert;
export type Theme = typeof t.theme.$inferSelect;
export type NewTheme = typeof t.theme.$inferInsert;
export type VerificationRequest = typeof t.verificationRequest.$inferSelect;
export type Orchestration = typeof t.orchestration.$inferSelect;
export type UserFlag = typeof t.userFlag.$inferSelect;

/** The shape Prisma's JsonValue had; used by the frontend theme helper. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export const VerificationRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type VerificationRequestStatus =
  (typeof VerificationRequestStatus)[keyof typeof VerificationRequestStatus];

export const OrchestrationType = { TIKTOK: 'TIKTOK' } as const;
export type OrchestrationType =
  (typeof OrchestrationType)[keyof typeof OrchestrationType];
```

`packages/db/src/index.ts`:

```ts
export { createDb, type Db } from './client';
export * from './types';
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @trylinky/db typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add packages/db
git commit -m "db: add client factory and inferred types"
```

---

### Task 3: Baseline migration and parity check

**Files:**
- Create: `packages/db/scripts/check-parity.sh`, `packages/db/migrations/0000_baseline.sql`, `packages/db/migrations/meta/_journal.json`, `packages/db/migrations/meta/0000_snapshot.json`

- [ ] **Step 1: Generate the baseline**

Run: `pnpm --filter @trylinky/db generate`
Expected: `packages/db/migrations/0000_*.sql` created. Rename it so the journal and file agree:

```bash
cd packages/db/migrations
mv 0000_*.sql 0000_baseline.sql
# update "tag" in meta/_journal.json to "0000_baseline"
```

Open `0000_baseline.sql` and confirm it contains `CREATE TYPE "public"."VerificationRequestStatus"`, `CREATE TABLE "User"`, and `CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade`.

- [ ] **Step 2: Write the parity script**

`packages/db/scripts/check-parity.sh`:

```bash
#!/usr/bin/env bash
# Proves the Drizzle baseline reproduces schema.prisma exactly.
#
# Applies packages/db/migrations to an EMPTY database, then asks Prisma to
# diff that database against schema.prisma. A non-empty diff exits 2.
#
# Usage: DIRECT_URL=postgresql://user:pass@localhost:5432/glow_parity ./scripts/check-parity.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${DIRECT_URL:-}" ]; then
  echo "DIRECT_URL must point at an empty scratch database" >&2
  exit 1
fi

pnpm exec drizzle-kit migrate

pnpm --filter @trylinky/prisma exec prisma migrate diff \
  --from-config-datasource \
  --to-schema prisma/schema.prisma \
  --exit-code

echo "parity ok: drizzle baseline matches schema.prisma"
```

Run: `chmod +x packages/db/scripts/check-parity.sh`

- [ ] **Step 3: Run the parity check against a scratch database**

```bash
docker compose exec postgres createdb -U glow_user glow_parity
DIRECT_URL=postgresql://glow_user:KGfUZosCOm@localhost:5432/glow_parity pnpm --filter @trylinky/db check-parity
```

Expected: `parity ok`. If Prisma prints a diff, fix the schema in `tables.ts` (a column default, an FK action, an index name), delete `migrations/`, regenerate, drop and recreate `glow_parity`, and rerun until the diff is empty.

- [ ] **Step 4: Commit**

```bash
git add packages/db/migrations packages/db/scripts
git commit -m "db: add baseline migration and parity check"
```

---

### Task 4: Request-scoped client in the API

**Files:**
- Create: `apps/api/src/lib/db.ts`, `apps/api/src/lib/db.test.ts`
- Modify: `apps/api/src/middleware/request-context.ts`, `apps/api/package.json`

**Interfaces:**
- Produces: default export `db: Db` (proxy), `createDb(env: { HYPERDRIVE: { connectionString: string } }): { db: Db; close: () => Promise<void> }`, `runWithDb<T>(db: Db, fn: () => T): T`, `resolveClient(): Db`.

- [ ] **Step 1: Add the workspace dependency**

In `apps/api/package.json` add `"@trylinky/db": "workspace:*"` to `dependencies`. Leave `@prisma/adapter-pg` and `@trylinky/prisma` in place until Task 13. Run `pnpm install`.

- [ ] **Step 2: Write the failing test**

`apps/api/src/lib/db.test.ts`:

```ts
import db, { createDb, resolveClient, runWithDb } from './db';
import { page } from '@trylinky/db/schema';
import { count } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

const testEnv = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
};

const countPages = async (client: typeof db) =>
  (await client.select({ count: count() }).from(page))[0].count;

describe('request-scoped db', () => {
  it('resolves to the client bound to the current request', async () => {
    const { db: client, close } = createDb(testEnv);

    const insideStore = runWithDb(client, () => db);

    expect(await countPages(insideStore)).toEqual(await countPages(client));
    await close();
  });

  it('keeps two concurrent requests on their own clients', async () => {
    const a = createDb(testEnv);
    const b = createDb(testEnv);
    const seen: unknown[] = [];

    await Promise.all([
      runWithDb(a.db, async () => {
        await new Promise((r) => setTimeout(r, 10));
        seen.push(resolveClient());
      }),
      runWithDb(b.db, async () => {
        seen.push(resolveClient());
      }),
    ]);

    expect(seen).toHaveLength(2);
    expect(seen).toContain(a.db);
    expect(seen).toContain(b.db);
    expect(seen[0]).not.toBe(seen[1]);
    await Promise.all([a.close(), b.close()]);
  });

  it('falls back to a lazily-built client outside any request', async () => {
    await expect(countPages(db)).resolves.toBeTypeOf('number');
  });

  it('throws a clear error when accessed outside a request with no DATABASE_URL to fall back to', () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect(() => resolveClient()).toThrow(/accessed outside a request context/);
    } finally {
      process.env.DATABASE_URL = original;
    }
  });

  it('supports "in" checks and Object.keys through the proxy, not the dummy target', async () => {
    const { db: client, close } = createDb(testEnv);

    runWithDb(client, () => {
      expect('query' in db).toBe(true);
      expect(Object.keys(db)).toEqual(Object.keys(client));
    });
    await close();
  });

  it('binds methods retrieved from the proxy to the resolved client, not the proxy', async () => {
    const { db: client, close } = createDb(testEnv);

    const transaction = runWithDb(client, () => db.transaction);

    expect(transaction.name).toBe('bound transaction');
    await close();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd apps/api && pnpm test src/lib/db.test.ts`
Expected: FAIL, cannot find module `./db`.

- [ ] **Step 4: Write the client module**

`apps/api/src/lib/db.ts`:

```ts
import { createDb as createDbClient, type Db } from '@trylinky/db';
import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Workers cannot reuse an object holding a socket opened during another
 * request; doing so throws "Cannot perform I/O on behalf of a different
 * request". So the client is built per request and reached through an
 * AsyncLocalStorage store, which leaves every `import db` site unchanged.
 */
const store = new AsyncLocalStorage<{ db: Db }>();

export function createDb(env: { HYPERDRIVE: { connectionString: string } }) {
  return createDbClient({ connectionString: env.HYPERDRIVE.connectionString });
}

export function runWithDb<T>(db: Db, fn: () => T): T {
  return store.run({ db }, fn);
}

/**
 * Outside a request (service-level tests, local scripts) there is no store.
 * Fall back to a process-lifetime client built from DATABASE_URL. In a
 * deployed Worker there is no DATABASE_URL, so reaching this means a route
 * skipped the request-context middleware: fail loudly with that diagnosis.
 */
let fallback: Db | undefined;

export function resolveClient(): Db {
  const scoped = store.getStore()?.db;

  if (scoped) {
    return scoped;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'db accessed outside a request context — did a route skip the requestContext middleware? ' +
        '(no AsyncLocalStorage store bound, and DATABASE_URL is unset, so there is no local fallback either)'
    );
  }

  if (!fallback) {
    fallback = createDb({
      HYPERDRIVE: { connectionString: process.env.DATABASE_URL },
    }).db;
  }

  return fallback;
}

export default new Proxy({} as Db, {
  get: (_target, property, receiver) => {
    const client = resolveClient();
    const value = Reflect.get(client, property, receiver);

    // Bind methods to the real client: called through the proxy, `this`
    // would otherwise be the proxy itself.
    return typeof value === 'function' ? value.bind(client) : value;
  },
  has: (_target, property) => Reflect.has(resolveClient(), property),
  ownKeys: () => Reflect.ownKeys(resolveClient()),
  getOwnPropertyDescriptor: (_target, property) => {
    const descriptor = Reflect.getOwnPropertyDescriptor(resolveClient(), property);

    // ownKeys must agree with a configurable descriptor, or V8's proxy
    // invariant check throws when something walks the keys.
    return descriptor && { ...descriptor, configurable: true };
  },
  getPrototypeOf: () => Reflect.getPrototypeOf(resolveClient()),
}) as Db;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd apps/api && pnpm test src/lib/db.test.ts`
Expected: 6 passed.

- [ ] **Step 6: Wire the middleware**

Replace `apps/api/src/middleware/request-context.ts`:

```ts
import type { AppBindings } from '@/env';
import { createAuth } from '@/lib/auth';
import { createDb, runWithDb } from '@/lib/db';
import type { MiddlewareHandler } from 'hono';
import { AsyncLocalStorage } from 'node:async_hooks';

type Auth = ReturnType<typeof createAuth>;

const authStore = new AsyncLocalStorage<Auth>();

/**
 * better-auth holds the database adapter, so it inherits the per-request
 * lifetime. It is reached through a store rather than the Hono context so
 * that lib/* modules can use it without taking a Context parameter.
 */
export function getAuth(): Auth {
  const auth = authStore.getStore();

  if (!auth) {
    throw new Error('getAuth() called outside a request context');
  }

  return auth;
}

/** Must be the first middleware registered — everything downstream needs it. */
export const requestContext: MiddlewareHandler<AppBindings> = async (c, next) => {
  const { db, close } = createDb(c.env);

  try {
    await runWithDb(db, () => authStore.run(createAuth(), next));
  } finally {
    // Closing a pool that already lost its socket is not an error worth
    // surfacing; the request has finished either way.
    const closing = close().catch(() => undefined);
    try {
      // Let the response go out first; the pool holds one socket.
      c.executionCtx.waitUntil(closing);
    } catch {
      // No execution context (app.request() in tests): it settles on its own.
    }
  }
};
```

`lib/auth.ts` still imports `@/lib/prisma` at this point; that is ported in Task 12. The app builds because both modules exist side by side.

- [ ] **Step 7: Run the whole suite**

Run: `cd apps/api && pnpm test`
Expected: all existing tests still pass (they still use Prisma). `pnpm typecheck` passes.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/lib/db.ts apps/api/src/lib/db.test.ts apps/api/src/middleware/request-context.ts apps/api/package.json pnpm-lock.yaml
git commit -m "api: add request-scoped drizzle client"
```

---

### Task 5: Authorization predicates

**Files:**
- Create: `apps/api/src/lib/db-predicates.ts`, `apps/api/src/lib/db-predicates.test.ts`
- Create: `apps/api/src/test/fixtures.ts`

**Interfaces:**
- Produces:
  - `userIsMemberOfOrg(organizationId: SQLWrapper | string, userId: string, role?: string): SQL`
  - `pageOwnedByUser(pageId: SQLWrapper | string, userId: string, organizationId?: string): SQL`
  - `blockOwnedByUser(blockId: SQLWrapper | string, userId: string, organizationId?: string): SQL`
  - fixtures: `createTestUser(suffix, overrides?)`, `createTestOrganization({ suffix, ownerId?, ownerRole? })`, `createTestPage({ organizationId, suffix, publishedAt? })`, `createTestBlock({ pageId, type, data?, config?, integrationId? })`, `createTestIntegration({ organizationId, type })`, `createTestTheme({ createdById, organizationId?, isDefault? })`, `cleanupTestData({ userIds?, organizationIds?, pageIds?, themeIds?, integrationIds? })`

- [ ] **Step 1: Write the fixture helper**

`apps/api/src/test/fixtures.ts`:

```ts
import db from '@/lib/db';
import {
  block,
  formSubmission,
  integration,
  member,
  organization,
  page,
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
}: {
  userIds?: string[];
  organizationIds?: string[];
  pageIds?: string[];
  themeIds?: string[];
  integrationIds?: string[];
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
  if (organizationIds.length) {
    await db.delete(member).where(inArray(member.organizationId, organizationIds));
    await db.delete(organization).where(inArray(organization.id, organizationIds));
  }
  if (userIds.length) {
    await db.delete(user).where(inArray(user.id, userIds));
  }
}
```

- [ ] **Step 2: Write the failing predicate tests**

`apps/api/src/lib/db-predicates.test.ts`:

```ts
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

beforeAll(async () => {
  ownerId = (await createTestUser(`pred-owner-${suffix}`)).id;
  strangerId = (await createTestUser(`pred-stranger-${suffix}`)).id;
  organizationId = (await createTestOrganization({ suffix: `pred-${suffix}`, ownerId })).id;
  pageId = (await createTestPage({ organizationId, suffix: `pred-${suffix}` })).id;
  blockId = (await createTestBlock({ pageId, type: 'content' })).id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId],
    organizationIds: [organizationId],
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
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd apps/api && pnpm test src/lib/db-predicates.test.ts`
Expected: FAIL, cannot find module `./db-predicates`.

- [ ] **Step 4: Write the predicates**

`apps/api/src/lib/db-predicates.ts`:

```ts
import db from '@/lib/db';
import { block, member, page } from '@trylinky/db/schema';
import { and, eq, exists, sql, type SQL, type SQLWrapper } from 'drizzle-orm';

/**
 * Prisma expressed authorization as relation filters
 * (`organization.members.some.userId`). Drizzle's update and delete take no
 * relation filter, so the same checks are EXISTS subqueries that any where
 * clause can embed. The subqueries are built through the request-scoped
 * proxy but never executed on their own.
 */
export function userIsMemberOfOrg(
  organizationId: SQLWrapper | string,
  userId: string,
  role?: string
): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, userId),
          role ? eq(member.role, role) : undefined
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
      .from(page)
      .where(
        and(
          eq(page.id, pageId),
          organizationId ? eq(page.organizationId, organizationId) : undefined,
          userIsMemberOfOrg(page.organizationId, userId)
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
      .from(block)
      .where(and(eq(block.id, blockId), pageOwnedByUser(block.pageId, userId, organizationId)))
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd apps/api && pnpm test src/lib/db-predicates.test.ts`
Expected: 7 passed.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/lib/db-predicates.ts apps/api/src/lib/db-predicates.test.ts apps/api/src/test/fixtures.ts
git commit -m "api: add authorization predicates and test fixtures"
```

---

### Task 6: Port the pages module

**Files:**
- Modify: `apps/api/src/modules/pages/service.ts`, `apps/api/src/modules/pages/index.ts`, `apps/api/src/modules/pages/handlers/get-page-load.ts`, `apps/api/src/modules/pages/handlers/get-page-slug-or-domain.ts`, `apps/api/src/modules/pages/handlers/get-slug-availability.ts`, `apps/api/src/modules/reactions/handlers/get-reactions.ts`, `apps/api/src/modules/analytics/handlers/analytics-for-page.ts`

**Interfaces:**
- Consumes: `db`, `userIsMemberOfOrg`, `pageOwnedByUser`.
- Produces: the same exported service function names and return shapes as today (`getPageLayoutById`, `getPageThemeById`, `getPageIdBySlugOrDomain`, `getPageBlocks`, `getPagesForOrganizationId`, `getPageSettings`, `updatePageLayout`, `checkUserHasAccessToPage`, `createNewPage`, `deletePage`).

- [ ] **Step 1: Rewrite `pages/service.ts`**

```ts
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { makeId } from '@/modules/pages/utils';
import { captureException } from '@sentry/cloudflare';
import { headerBlockDefaults } from '@trylinky/blocks';
import { isForbiddenSlug, isReservedSlug, regexSlug } from '@trylinky/common/slugs';
import { block, page } from '@trylinky/db/schema';
import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';

type LayoutEntry = { i: string; [key: string]: unknown };

function filterLayoutToBlockIds(layout: unknown, validIds: Set<string>): LayoutEntry[] {
  if (!Array.isArray(layout)) return [];
  return (layout as LayoutEntry[]).filter(
    (entry) =>
      entry && typeof entry === 'object' && typeof entry.i === 'string' && validIds.has(entry.i)
  );
}

async function getValidBlockIds(pageId: string): Promise<Set<string>> {
  const blocks = await db.select({ id: block.id }).from(block).where(eq(block.pageId, pageId));
  return new Set(blocks.map((b) => b.id));
}

export async function getPageLayoutById(pageId: string) {
  const [row, validIds] = await Promise.all([
    db.query.page.findFirst({
      where: eq(page.id, pageId),
      columns: { config: true, mobileConfig: true, publishedAt: true, organizationId: true },
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
    where: and(eq(page.id, pageId), isNull(page.deletedAt)),
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
    where: and(
      eq(page.slug, slug),
      domain ? eq(page.customDomain, decodeURIComponent(domain)) : undefined,
      isNull(page.deletedAt)
    ),
    columns: { id: true },
  });

  return row?.id;
}

export async function getPageBlocks(pageId: string) {
  const row = await db.query.page.findFirst({
    where: and(eq(page.id, pageId), isNull(page.deletedAt)),
    columns: { organizationId: true, publishedAt: true },
    with: {
      blocks: {
        columns: { id: true, data: true, type: true, config: true, integrationId: true },
        orderBy: asc(block.createdAt),
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
    where: and(eq(page.id, pageId), isNull(page.deletedAt)),
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

export async function updatePageLayout(pageId: string, newLayout: { sm: any; xxs: any }) {
  const validIds = await getValidBlockIds(pageId);

  const sm = filterLayoutToBlockIds(newLayout.sm, validIds);
  const xxs = filterLayoutToBlockIds(newLayout.xxs, validIds);

  const [updatedPage] = await db
    .update(page)
    .set({ config: sm, mobileConfig: xxs })
    .where(eq(page.id, pageId))
    .returning({ id: page.id, config: page.config, mobileConfig: page.mobileConfig });

  return { id: updatedPage.id, sm: updatedPage.config, xxs: updatedPage.mobileConfig };
}

export async function checkUserHasAccessToPage(pageId: string, userId: string) {
  const [{ count: pages }] = await db
    .select({ count: count() })
    .from(page)
    .where(and(eq(page.id, pageId), userIsMemberOfOrg(page.organizationId, userId)));

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
    where: and(eq(page.slug, slug), isNull(page.deletedAt)),
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
    return { error: { message: 'Page with this slug already exists', field: 'pageSlug' } };
  }

  const headerSectionId = randomUUID();
  const layout = [{ h: 6, i: headerSectionId, w: 12, x: 0, y: 0, moved: false, static: false }];

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

export async function deletePage(pageId: string) {
  const row = await db.query.page.findFirst({
    where: and(eq(page.id, pageId), isNull(page.deletedAt)),
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
        .set({ deletedAt: new Date(), slug: `DELETED-${makeId(4)}-${row.slug}` })
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
```

- [ ] **Step 2: Port the two call sites in `pages/index.ts`**

Replace `import prisma from '@/lib/prisma';` with:

```ts
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { page, user } from '@trylinky/db/schema';
import { and, count, eq, isNull } from 'drizzle-orm';
```

Replace the page count (lines 96–108):

```ts
    const [{ count: teamPageCount }] = await db
      .select({ count: count() })
      .from(page)
      .where(
        and(
          isNull(page.deletedAt),
          eq(page.organizationId, session.activeOrganizationId),
          userIsMemberOfOrg(page.organizationId, session.user.id)
        )
      );
```

Replace the user lookup (lines 113–120):

```ts
      const dbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
        columns: { role: true },
      });

      if (!isAdminUser(dbUser)) {
```

(`isAdminUser` takes `{ role?: string | null } | null | undefined`; if its signature names a Prisma type, change it to that structural type.)

- [ ] **Step 3: Port `handlers/get-page-load.ts`**

```ts
import db from '@/lib/db';
import { page } from '@trylinky/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
```

```ts
  const row = await db.query.page.findFirst({
    where: and(isNull(page.deletedAt), eq(page.id, pageId)),
    columns: {
      id: true,
      publishedAt: true,
      organizationId: true,
      customDomain: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      isFeatured: true,
      verifiedAt: true,
    },
    with: {
      // Explicit column list: the old Fastify response schema stripped
      // pageId/integrationId/createdAt/updatedAt off every block, and Hono
      // has no such trimming step.
      blocks: { columns: { id: true, type: true, config: true, data: true } },
      organization: {
        columns: { id: true },
        with: { subscription: { columns: { plan: true } } },
      },
    },
  });

  if (!row) {
    return c.json({}, 404);
  }

  const plan = row.organization?.subscription?.plan;
  const isPaid = plan === 'premium' || plan === 'team';

  const { organization: _organization, publishedAt, verifiedAt, ...rest } = row;
```

The remainder of the handler is unchanged.

- [ ] **Step 4: Port `handlers/get-page-slug-or-domain.ts`**

```ts
import db from '@/lib/db';
import { page } from '@trylinky/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
```

```ts
    const [error, row] = await safeAwait(
      db.query.page.findFirst({
        where: and(
          isNull(page.deletedAt),
          customDomain
            ? eq(page.customDomain, decodeURIComponent(domain))
            : eq(page.slug, slug)
        ),
        columns: { id: true, organizationId: true, publishedAt: true, slug: true },
      })
    );
```

Rename the later uses of `page` (the result) to `row` so they do not shadow the table import.

- [ ] **Step 5: Port `handlers/get-slug-availability.ts`, `reactions/handlers/get-reactions.ts`, `analytics/handlers/analytics-for-page.ts`**

Slug availability:

```ts
    const [{ count: existing }] = await db
      .select({ count: count() })
      .from(page)
      .where(and(isNull(page.deletedAt), eq(page.slug, slug)));

    return c.json({ isAvailable: existing === 0 }, 200);
```

Reactions (existence check only):

```ts
    const row = await db.query.page.findFirst({
      where: eq(page.id, pageId),
      columns: { id: true },
    });

    if (!row) {
```

Analytics:

```ts
  const row = await db.query.page.findFirst({
    where: and(eq(page.id, pageId), isNull(page.deletedAt)),
    columns: { createdAt: true },
  });

  if (!row) {
    return c.json({}, 404);
  }
  // ... use row.createdAt below
```

- [ ] **Step 6: Typecheck and run the suite**

Run: `cd apps/api && pnpm typecheck && pnpm test`
Expected: pass. `forms/service.test.ts` exercises `checkUserHasAccessToPage`-style access via forms; `app.test.ts` and `blocks/index.test.ts` hit page routes.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/pages apps/api/src/modules/reactions/handlers/get-reactions.ts apps/api/src/modules/analytics/handlers/analytics-for-page.ts
git commit -m "api: port pages to drizzle"
```

---

### Task 7: Port blocks, forms, and assets

**Files:**
- Modify: `apps/api/src/modules/blocks/service.ts`, `apps/api/src/modules/blocks/index.ts`, `apps/api/src/modules/forms/service.ts`, `apps/api/src/modules/forms/service.test.ts`, `apps/api/src/modules/forms/routes.test.ts`, `apps/api/src/modules/assets/authorization.ts`, `apps/api/src/modules/assets/authorization.test.ts`

- [ ] **Step 1: Rewrite `blocks/service.ts`**

```ts
import db from '@/lib/db';
import { pageOwnedByUser } from '@/lib/db-predicates';
import { isAdminUser } from '@/lib/roles';
import { blocks, Blocks } from '@trylinky/blocks';
import type { User } from '@trylinky/db';
import { block, page } from '@trylinky/db/schema';
import { and, count, eq } from 'drizzle-orm';

export async function getBlockById(blockId: string) {
  const row = await db.query.block.findFirst({
    where: eq(block.id, blockId),
    columns: { id: true, type: true, data: true, config: true },
    with: {
      page: { columns: { organizationId: true, publishedAt: true } },
      integration: { columns: { id: true, type: true, createdAt: true } },
    },
  });

  return row ?? null;
}

export async function createBlock(newBlock: { type: string; id: string }, pageSlug: string) {
  const defaultData = blocks[newBlock.type as Blocks].defaults;

  // Prisma's `connect: { slug }` did this lookup implicitly.
  const target = await db.query.page.findFirst({
    where: eq(page.slug, pageSlug),
    columns: { id: true },
  });

  if (!target) {
    throw new Error('Page not found');
  }

  const [created] = await db
    .insert(block)
    .values({ type: newBlock.type, id: newBlock.id, config: {}, data: defaultData, pageId: target.id })
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

export async function checkUserHasAccessToBlock(blockId: string, userId: string) {
  const [{ count: matches }] = await db
    .select({ count: count() })
    .from(block)
    .where(and(eq(block.id, blockId), pageOwnedByUser(block.pageId, userId)));

  return matches > 0;
}

export async function deleteBlockById(id: string, userId: string) {
  const userHasAccess = await checkUserHasAccessToBlock(id, userId);

  if (!userHasAccess) {
    throw new Error('User does not have access to this block');
  }

  // Delete and layout strip land together or not at all.
  await db.transaction(async (tx) => {
    const [deleted] = await tx.delete(block).where(eq(block.id, id)).returning({ pageId: block.pageId });

    if (!deleted) {
      return;
    }

    const owner = await tx.query.page.findFirst({
      where: eq(page.id, deleted.pageId),
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
    where: eq(block.id, blockId),
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
```

- [ ] **Step 2: Port the three call sites in `blocks/index.ts`**

Imports:

```ts
import db from '@/lib/db';
import { blockOwnedByUser, userIsMemberOfOrg } from '@/lib/db-predicates';
import { block, page, user } from '@trylinky/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
```

Create handler page lookup (lines 101–111):

```ts
    const target = await db.query.page.findFirst({
      where: and(
        isNull(page.deletedAt),
        eq(page.slug, pageSlug),
        eq(page.organizationId, session.activeOrganizationId),
        userIsMemberOfOrg(page.organizationId, session.user.id)
      ),
      with: { blocks: { columns: { id: true } } },
    });

    if (!target) {
      return c.json({ error: { message: 'Page not found' } }, 400);
    }

    const maxNumberOfBlocks = 100;
    if (target.blocks.length >= maxNumberOfBlocks) {
```

Enabled blocks (lines 162–165):

```ts
  const dbUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { role: true },
  });
```

Delete handler (lines 179–190):

```ts
  const target = await db.query.block.findFirst({
    where: and(
      eq(block.id, blockId),
      blockOwnedByUser(block.id, session.user.id, session.activeOrganizationId)
    ),
    with: { page: true },
  });

  if (!target) {
    return c.json({ error: { message: 'Block not found' } }, 400);
  }

  if (target.type === 'header') {
```

Rename the remaining `block.` reads in that handler to `target.`.

- [ ] **Step 3: Rewrite `forms/service.ts`**

```ts
import { validateAnswers } from './validate-answers';
import db from '@/lib/db';
import { pageOwnedByUser, userIsMemberOfOrg } from '@/lib/db-predicates';
import { FormBlockConfig } from '@trylinky/blocks';
import { block, formSubmission, page } from '@trylinky/db/schema';
import { and, count, desc, eq, gt, inArray, isNull, lt, max, or, type SQL } from 'drizzle-orm';

const RATE_LIMIT_MAX_PER_HOUR = 5;
const DEFAULT_PAGE_SIZE = 50;

export type SubmitResult =
  | { status: 'ok' }
  | { status: 'not-found' }
  | { status: 'rate-limited' }
  | { status: 'invalid'; errors: Record<string, string> };

export async function submitFormResponse({
  blockId,
  answers,
  honeypot,
  ipAddress,
}: {
  blockId: string;
  answers: unknown;
  honeypot: string;
  ipAddress: string;
}): Promise<SubmitResult> {
  const target = await db.query.block.findFirst({
    where: eq(block.id, blockId),
    columns: { id: true, type: true, data: true, pageId: true },
    with: { page: { columns: { publishedAt: true, deletedAt: true } } },
  });

  if (!target || target.type !== 'form' || !target.page.publishedAt || target.page.deletedAt) {
    return { status: 'not-found' };
  }

  // Honeypot tripped: pretend success, store nothing.
  if (honeypot.length > 0) {
    return { status: 'ok' };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  // Count-then-create is not atomic; acceptable at 5/hr.
  const [{ count: recentCount }] = await db
    .select({ count: count() })
    .from(formSubmission)
    .where(
      and(
        eq(formSubmission.blockId, blockId),
        eq(formSubmission.visitorIp, ipAddress),
        gt(formSubmission.createdAt, oneHourAgo)
      )
    );

  if (recentCount >= RATE_LIMIT_MAX_PER_HOUR) {
    return { status: 'rate-limited' };
  }

  const config = target.data as unknown as FormBlockConfig;
  const result = validateAnswers(config.fields ?? [], answers);

  if (!result.ok) {
    return { status: 'invalid', errors: result.errors };
  }

  await db.insert(formSubmission).values({
    pageId: target.pageId,
    blockId: target.id,
    answers: result.answers,
    fieldsSnapshot: { title: config.title ?? null, fields: config.fields as unknown as object[] },
    visitorIp: ipAddress,
  });

  return { status: 'ok' };
}

export async function checkUserHasAccessToPage(pageId: string, userId: string) {
  const [{ count: matches }] = await db
    .select({ count: count() })
    .from(page)
    .where(
      and(eq(page.id, pageId), isNull(page.deletedAt), userIsMemberOfOrg(page.organizationId, userId))
    );

  return matches > 0;
}

export interface FormGroup {
  blockId: string;
  title: string;
  isDeleted: boolean;
  submissionCount: number;
  latestSubmissionAt: Date | null;
}

export async function getFormGroupsForPage(pageId: string): Promise<FormGroup[]> {
  const [formBlocks, submissionGroups] = await Promise.all([
    db
      .select({ id: block.id, data: block.data })
      .from(block)
      .where(and(eq(block.pageId, pageId), eq(block.type, 'form'))),
    db
      .select({
        blockId: formSubmission.blockId,
        submissionCount: count(),
        latestSubmissionAt: max(formSubmission.createdAt),
      })
      .from(formSubmission)
      .where(eq(formSubmission.pageId, pageId))
      .groupBy(formSubmission.blockId),
  ]);

  const countsByBlockId = new Map(submissionGroups.map((group) => [group.blockId, group]));

  const groups: FormGroup[] = formBlocks.map((formBlock) => {
    const data = formBlock.data as unknown as FormBlockConfig;
    const counts = countsByBlockId.get(formBlock.id);
    countsByBlockId.delete(formBlock.id);

    return {
      blockId: formBlock.id,
      title: data.title || 'Untitled form',
      isDeleted: false,
      submissionCount: counts?.submissionCount ?? 0,
      latestSubmissionAt: counts?.latestSubmissionAt ?? null,
    };
  });

  // Whatever remains belongs to deleted form blocks; the title comes from
  // the latest submission's snapshot.
  const orphanBlockIds = [...countsByBlockId.keys()];
  if (orphanBlockIds.length > 0) {
    // DISTINCT ON needs the distinct column first in ORDER BY.
    const latestSnapshots = await db
      .selectDistinctOn([formSubmission.blockId], {
        blockId: formSubmission.blockId,
        fieldsSnapshot: formSubmission.fieldsSnapshot,
      })
      .from(formSubmission)
      .where(inArray(formSubmission.blockId, orphanBlockIds))
      .orderBy(formSubmission.blockId, desc(formSubmission.createdAt));

    const snapshotByBlockId = new Map(
      latestSnapshots.map((submission) => [
        submission.blockId,
        submission.fieldsSnapshot as { title?: string | null } | null,
      ])
    );

    for (const [blockId, counts] of countsByBlockId) {
      const snapshot = snapshotByBlockId.get(blockId);

      groups.push({
        blockId,
        title: snapshot?.title || 'Untitled form',
        isDeleted: true,
        submissionCount: counts.submissionCount,
        latestSubmissionAt: counts.latestSubmissionAt,
      });
    }
  }

  return groups;
}

export async function listSubmissions(
  pageId: string,
  blockId: string,
  cursor?: string,
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  // Keyset pagination on (createdAt, id): Prisma's cursor/skip:1 walked
  // past the cursor row; this selects everything strictly after it in the
  // same createdAt desc order, with id as the tiebreaker.
  let afterCursor: SQL | undefined;
  if (cursor) {
    const cursorRow = await db.query.formSubmission.findFirst({
      where: eq(formSubmission.id, cursor),
      columns: { createdAt: true, id: true },
    });

    if (!cursorRow) {
      return { submissions: [], nextCursor: null };
    }

    afterCursor = or(
      lt(formSubmission.createdAt, cursorRow.createdAt),
      and(eq(formSubmission.createdAt, cursorRow.createdAt), lt(formSubmission.id, cursorRow.id))
    );
  }

  const submissions = await db
    .select()
    .from(formSubmission)
    .where(and(eq(formSubmission.pageId, pageId), eq(formSubmission.blockId, blockId), afterCursor))
    .orderBy(desc(formSubmission.createdAt), desc(formSubmission.id))
    .limit(pageSize + 1);

  const hasMore = submissions.length > pageSize;
  const pageOfSubmissions = hasMore ? submissions.slice(0, pageSize) : submissions;

  return {
    submissions: pageOfSubmissions,
    nextCursor: hasMore ? pageOfSubmissions[pageOfSubmissions.length - 1].id : null,
  };
}

export async function deleteSubmissionById(submissionId: string, userId: string) {
  // Ownership check folded into the where clause so a concurrent
  // double-delete cannot race between a find and a delete.
  const deleted = await db
    .delete(formSubmission)
    .where(and(eq(formSubmission.id, submissionId), pageOwnedByUser(formSubmission.pageId, userId)))
    .returning({ id: formSubmission.id });

  return deleted.length > 0;
}
```

- [ ] **Step 4: Port the forms tests to the fixtures**

In `forms/service.test.ts`, replace the imports and the `beforeAll`/`afterAll`:

```ts
import {
  cleanupTestData,
  createTestBlock,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
```

```ts
beforeAll(async () => {
  userId = (await createTestUser(`form-${suffix}`)).id;
  otherUserId = (await createTestUser(`form-other-${suffix}`)).id;
  organizationId = (await createTestOrganization({ suffix: `form-${suffix}`, ownerId: userId })).id;
  pageId = (await createTestPage({ organizationId, suffix: `form-${suffix}` })).id;
  unpublishedPageId = (
    await createTestPage({ organizationId, suffix: `form-unpub-${suffix}`, publishedAt: null })
  ).id;
  blockId = (await createTestBlock({ pageId, type: 'form', data: testFormConfig })).id;
  unpublishedBlockId = (
    await createTestBlock({ pageId: unpublishedPageId, type: 'form', data: testFormConfig })
  ).id;
  nonFormBlockId = (await createTestBlock({ pageId, type: 'content' })).id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId, unpublishedPageId],
    organizationIds: [organizationId],
    userIds: [userId, otherUserId],
  });
});
```

Anywhere the body of a test calls `prisma.formSubmission.*` directly (for example to create rows for `listSubmissions` or to read back a deleted row), replace with the Drizzle equivalent:

```ts
import db from '@/lib/db';
import { formSubmission } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';

// create:  await db.insert(formSubmission).values({ pageId, blockId, answers: {}, fieldsSnapshot: {} }).returning();
// read:    await db.query.formSubmission.findFirst({ where: eq(formSubmission.id, id) });
// count:   (await db.select({ count: count() }).from(formSubmission).where(eq(formSubmission.blockId, blockId)))[0].count
```

Apply the same fixture change to `forms/routes.test.ts` (organization without owner, one page, one form block; cleanup with `pageIds` and `organizationIds`).

- [ ] **Step 5: Port `assets/authorization.ts` and its test**

Service:

```ts
import db from '@/lib/db';
import { theme } from '@trylinky/db/schema';
import { and, count, eq } from 'drizzle-orm';
// ...
      const [{ count: themeCount }] = await db
        .select({ count: count() })
        .from(theme)
        .where(and(eq(theme.id, referenceId), eq(theme.organizationId, organizationId)));

      return themeCount > 0;
```

Test: delete the `vi.mock('@/lib/prisma', ...)` block and the `themeCount` spy. Keep the two service mocks. Add real fixtures:

```ts
import { cleanupTestData, createTestOrganization, createTestTheme, createTestUser } from '@/test/fixtures';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll } from 'vitest';

const suffix = randomUUID().slice(0, 8);
let userId: string;
let ORG_ID: string;
let otherOrgId: string;
let ownThemeId: string;
let otherThemeId: string;

beforeAll(async () => {
  userId = (await createTestUser(`assets-${suffix}`)).id;
  ORG_ID = (await createTestOrganization({ suffix: `assets-${suffix}`, ownerId: userId })).id;
  otherOrgId = (await createTestOrganization({ suffix: `assets-other-${suffix}` })).id;
  ownThemeId = (await createTestTheme({ createdById: userId, organizationId: ORG_ID })).id;
  otherThemeId = (await createTestTheme({ createdById: userId, organizationId: otherOrgId })).id;
});

afterAll(async () => {
  await cleanupTestData({
    themeIds: [ownThemeId, otherThemeId],
    organizationIds: [ORG_ID, otherOrgId],
    userIds: [userId],
  });
});
```

Then in the two theme tests use `referenceId: ownThemeId` (expect `true`) and `referenceId: otherThemeId` (expect `false`), and delete the `expect(themeCount).toHaveBeenCalledWith(...)` assertion. Replace the `const USER_ID` / `const ORG_ID` constants with the fixture values (`userId`, `ORG_ID`).

- [ ] **Step 6: Typecheck and run the suite**

Run: `cd apps/api && pnpm typecheck && pnpm test`
Expected: pass, including `forms/service.test.ts` (groupBy, DISTINCT ON, keyset pagination, delete with ownership) and `blocks/index.test.ts`.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/modules/blocks apps/api/src/modules/forms apps/api/src/modules/assets
git commit -m "api: port blocks, forms and assets to drizzle"
```

---

### Task 8: Port integrations, OAuth services, and marketing

**Files:**
- Modify: `apps/api/src/modules/integrations/service.ts`, `apps/api/src/modules/integrations/index.ts`, `apps/api/src/modules/integrations/service.test.ts`, `apps/api/src/modules/services/spotify/index.ts`, `apps/api/src/modules/services/threads/index.ts`, `apps/api/src/modules/services/instagram/index.ts`, `apps/api/src/modules/marketing/index.ts`

- [ ] **Step 1: Rewrite the integrations test as a fixture-backed test**

`integrations/service.test.ts`:

```ts
import { linkIntegrationToBlock } from './service';
import db from '@/lib/db';
import {
  cleanupTestData,
  createTestBlock,
  createTestIntegration,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { block } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/revalidate', () => ({
  blockCacheTag: (id: string) => `block-${id}`,
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  revalidatePageCache: vi.fn(),
}));

const suffix = randomUUID().slice(0, 8);

let userId: string;
let strangerId: string;
let organizationId: string;
let pageId: string;
let blockId: string;
let integrationId: string;

beforeAll(async () => {
  userId = (await createTestUser(`int-${suffix}`)).id;
  strangerId = (await createTestUser(`int-stranger-${suffix}`)).id;
  organizationId = (await createTestOrganization({ suffix: `int-${suffix}`, ownerId: userId })).id;
  pageId = (await createTestPage({ organizationId, suffix: `int-${suffix}` })).id;
  blockId = (await createTestBlock({ pageId, type: 'spotify-playing-now' })).id;
  integrationId = (await createTestIntegration({ organizationId, type: 'spotify' })).id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId],
    integrationIds: [integrationId],
    organizationIds: [organizationId],
    userIds: [userId, strangerId],
  });
});

const readIntegrationId = async () =>
  (await db.query.block.findFirst({ where: eq(block.id, blockId), columns: { integrationId: true } }))
    ?.integrationId;

describe('linkIntegrationToBlock', () => {
  it('links the integration to a block the user can reach', async () => {
    await expect(linkIntegrationToBlock({ blockId, integrationId, userId })).resolves.toBe(true);
    expect(await readIntegrationId()).toBe(integrationId);
  });

  it('writes nothing when the block belongs to someone else', async () => {
    // The blockId reaches this function from an OAuth `state` value that
    // originated in a caller-supplied query string, and block ids are
    // public. An unscoped update let any signed-in user attach their own
    // integration to another user's block.
    await db.update(block).set({ integrationId: null }).where(eq(block.id, blockId));

    await expect(
      linkIntegrationToBlock({ blockId, integrationId, userId: strangerId })
    ).resolves.toBe(false);
    expect(await readIntegrationId()).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/api && pnpm test src/modules/integrations/service.test.ts`
Expected: FAIL (the service still calls `prisma.block.findFirst` with a Prisma-shaped where).

- [ ] **Step 3: Rewrite `integrations/service.ts`**

```ts
import db from '@/lib/db';
import { pageOwnedByUser } from '@/lib/db-predicates';
import { blockCacheTag, pageIdCacheTag, revalidatePageCache } from '@/lib/revalidate';
import { block, integration } from '@trylinky/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * Attaches a newly connected integration to the block the OAuth flow began
 * from. The block id originates from a caller-supplied query string, so it is
 * scoped to the caller before anything is written. Returns false when the
 * block is not one the user can reach.
 */
export async function linkIntegrationToBlock({
  blockId,
  integrationId,
  userId,
}: {
  blockId: string;
  integrationId: string;
  userId: string;
}): Promise<boolean> {
  const target = await db.query.block.findFirst({
    where: and(eq(block.id, blockId), pageOwnedByUser(block.pageId, userId)),
    columns: { id: true, pageId: true },
  });

  if (!target) {
    return false;
  }

  await db.update(block).set({ integrationId }).where(eq(block.id, target.id));

  void revalidatePageCache([blockCacheTag(target.id), pageIdCacheTag(target.pageId)]);

  return true;
}

export async function getIntegrationsForOrganizationId(organizationId: string) {
  return db.query.integration.findMany({
    where: and(eq(integration.organizationId, organizationId), isNull(integration.deletedAt)),
    columns: { id: true, createdAt: true, type: true, displayName: true },
    with: {
      blocks: {
        columns: { id: true },
        with: { page: { columns: { id: true, slug: true } } },
      },
    },
  });
}

export async function disconnectIntegration(integrationId: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(integration)
      .set({ deletedAt: new Date(), encryptedConfig: null })
      .where(eq(integration.id, integrationId));

    await tx.update(block).set({ integrationId: null }).where(eq(block.integrationId, integrationId));
  });

  return { sucess: true };
}
```

(`getIntegrationsForOrganizationId` previously returned `blocks: [{ page: {...} }]` without block ids; the extra `id` column is harmless to the `/integrations/me` consumer, which reads `blocks[].page`.)

- [ ] **Step 4: Port the call sites in `integrations/index.ts`**

Imports:

```ts
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { block, integration, page } from '@trylinky/db/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';
```

Disconnect handler (lines 71–96):

```ts
      const target = await db.query.integration.findFirst({
        where: and(
          eq(integration.id, integrationId),
          eq(integration.organizationId, session.activeOrganizationId),
          userIsMemberOfOrg(integration.organizationId, session.user.id)
        ),
        columns: { type: true },
      });

      if (!target) {
        return c.json({ error: 'Integration not found' }, 400);
      }

      try {
        const linkedBlocks = await db
          .select({ id: block.id, pageId: block.pageId })
          .from(block)
          .where(eq(block.integrationId, integrationId));
```

Connect-block handler (lines 124–170):

```ts
    const target = await db.query.integration.findFirst({
      where: and(
        eq(integration.id, integrationId),
        isNull(integration.deletedAt),
        eq(integration.organizationId, session.activeOrganizationId)
      ),
    });

    if (!target) {
      return c.json({ error: 'Integration not found' }, 400);
    }

    const targetBlock = await db.query.block.findFirst({
      where: and(
        eq(block.id, blockId),
        inArray(
          block.pageId,
          db.select({ id: page.id }).from(page).where(eq(page.organizationId, session.activeOrganizationId))
        )
      ),
    });

    if (!targetBlock) {
      return c.json({ error: 'Block not found' }, 400);
    }

    const allowedIntegrationForBlock = blocks[targetBlock.type as Blocks].integrationType;

    if (allowedIntegrationForBlock !== target.type) {
      return c.json({ error: 'Invalid integration for block' }, 400);
    }

    try {
      await db.update(block).set({ integrationId }).where(eq(block.id, blockId));

      void revalidatePageCache([blockCacheTag(blockId), pageIdCacheTag(targetBlock.pageId)]);
```

Disconnect-block handler (lines 194–216): same block lookup as above, then

```ts
    await db.update(block).set({ integrationId: null }).where(eq(block.id, blockId));

    void revalidatePageCache([blockCacheTag(blockId), pageIdCacheTag(targetBlock.pageId)]);
```

- [ ] **Step 5: Port the three OAuth callbacks**

In `services/spotify/index.ts`, `services/threads/index.ts`, and both callbacks in `services/instagram/index.ts`, replace each `prisma.integration.create({ data: {...} })` with:

```ts
import db from '@/lib/db';
import { integration } from '@trylinky/db/schema';

    const [created] = await db
      .insert(integration)
      .values({
        organizationId: session.activeOrganizationId,
        type: 'spotify', // 'threads' / 'instagram' in the other files
        encryptedConfig,
        displayName: userInfoData.display_name || 'Spotify', // as in each file today
      })
      .returning({ id: integration.id });
```

and use `created.id` where `integration.id` was read.

- [ ] **Step 6: Port `marketing/index.ts`**

```ts
import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { block, page } from '@trylinky/db/schema';
import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import type { Context } from 'hono';
import { Hono } from 'hono';

type JsonObject = Record<string, unknown>;

const marketingRoutes = new Hono<AppBindings>();

marketingRoutes.get('/featured-pages', getFeaturedPagesHandler);

async function getFeaturedPagesHandler(c: Context<AppBindings>) {
  const pages = await db.query.page.findMany({
    where: and(isNull(page.deletedAt), isNotNull(page.publishedAt), eq(page.isFeatured, true)),
    orderBy: desc(page.updatedAt),
    columns: { id: true, slug: true },
    with: { blocks: { where: eq(block.type, 'header') } },
  });

  const featuredPages = pages
    .map((featured) => {
      const headerBlock = featured.blocks[0];

      if (!headerBlock) {
        return null;
      }

      const data = headerBlock.data as JsonObject | null;

      return {
        id: featured.id,
        slug: featured.slug,
        headerTitle: data?.title,
        headerDescription: data?.description,
      };
    })
    .filter(Boolean);

  return c.json(featuredPages, 200);
}

export default marketingRoutes;
```

- [ ] **Step 7: Typecheck and run the suite**

Run: `cd apps/api && pnpm typecheck && pnpm test`
Expected: pass, including the rewritten `integrations/service.test.ts`.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/integrations apps/api/src/modules/services apps/api/src/modules/marketing
git commit -m "api: port integrations, oauth services and marketing to drizzle"
```

---

### Task 9: Port organizations, flags, themes, user-created, and billing

**Files:**
- Modify: `apps/api/src/modules/organizations/utils.ts`, `apps/api/src/modules/organizations/index.ts`, `apps/api/src/modules/flags/handlers/flags-for-current-user.ts`, `apps/api/src/modules/flags/handlers/hide-onboarding-tour.ts`, `apps/api/src/modules/themes/service.ts`, `apps/api/src/lib/user-created.ts`, `apps/api/src/modules/billing/utils/create-new-subscription.ts`, every file under `apps/api/src/modules/billing/handlers/`

**Interfaces:**
- Produces: `getOrganizationMemberEmails(organizationId: string): Promise<string[]>` in `organizations/utils.ts` (used by three Stripe handlers).

- [ ] **Step 1: Rewrite `organizations/utils.ts`**

```ts
import db from '@/lib/db';
import { member, organization, user } from '@trylinky/db/schema';
import { and, count, eq, inArray } from 'drizzle-orm';

/**
 * Whether the organization has room for another member under its plan. No
 * subscription, or no seat count, means unlimited.
 */
export async function hasAvailableSeat(organizationId: string): Promise<boolean> {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: { id: true },
    with: { subscription: { columns: { seats: true } } },
  });

  const seats = org?.subscription?.seats;

  if (!seats) {
    return true;
  }

  const [{ count: memberCount }] = await db
    .select({ count: count() })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  return memberCount < seats;
}

/** Organization roles allowed to manage billing. */
const BILLING_ROLES = ['admin', 'owner'];

/** Member.role (owner/admin/member), not User.role. */
export async function canManageBilling(
  organizationId: string | undefined,
  userId: string | undefined
): Promise<boolean> {
  if (!organizationId || !userId) {
    return false;
  }

  const membership = await db.query.member.findFirst({
    where: and(
      eq(member.organizationId, organizationId),
      eq(member.userId, userId),
      inArray(member.role, BILLING_ROLES)
    ),
    columns: { id: true },
  });

  return membership !== undefined;
}

/** Emails of every member of the organization, for billing notifications. */
export async function getOrganizationMemberEmails(organizationId: string): Promise<string[]> {
  const rows = await db
    .select({ email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, organizationId));

  return rows.map((row) => row.email).filter((email): email is string => Boolean(email));
}

export async function createNewOrganization({
  ownerId,
  type,
}: {
  ownerId: string;
  type: 'personal' | 'team';
}) {
  const randomNumber = Math.floor(Math.random() * 1000000);
  const newOrgSlug = `${type}-${randomNumber}`;

  // Organization and its owner membership land together or not at all.
  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(organization)
      .values({
        name: type === 'personal' ? 'Personal' : 'My Team',
        slug: newOrgSlug,
        isPersonal: type === 'personal',
      })
      .returning();

    await tx.insert(member).values({ userId: ownerId, organizationId: org.id, role: 'owner' });

    return org;
  });
}
```

- [ ] **Step 2: Port `organizations/index.ts`, the two flags handlers, `themes/service.ts`, and `lib/user-created.ts`**

Organizations route:

```ts
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { organization } from '@trylinky/db/schema';

  const orgs = await db.query.organization.findMany({
    where: userIsMemberOfOrg(organization.id, session.user.id),
    columns: { id: true, name: true, isPersonal: true },
  });
```

Flags read:

```ts
import db from '@/lib/db';
import { userFlag } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';

  const userFlags = await db
    .select({ key: userFlag.key, value: userFlag.value })
    .from(userFlag)
    .where(eq(userFlag.userId, session.user.id));
```

Flags write:

```ts
import { and, eq } from 'drizzle-orm';

  await db
    .update(userFlag)
    .set({ value: false })
    .where(and(eq(userFlag.userId, session.user.id), eq(userFlag.key, 'showOnboardingTour')));
```

Themes:

```ts
import db from '@/lib/db';
import { theme } from '@trylinky/db/schema';
import { and, eq } from 'drizzle-orm';

const themeColumns = {
  id: true,
  isDefault: true,
  name: true,
  font: true,
  backgroundImage: true,
  colorBgBase: true,
  colorBgPrimary: true,
  colorBgSecondary: true,
  colorBorderPrimary: true,
  colorLabelPrimary: true,
  colorLabelSecondary: true,
  colorLabelTertiary: true,
  colorTitlePrimary: true,
  colorTitleSecondary: true,
} as const;

export async function getThemesForOrganization(orgId: string) {
  const themes = await db.query.theme.findMany({
    where: and(eq(theme.organizationId, orgId), eq(theme.isDefault, false)),
    columns: themeColumns,
  });

  const defaultThemes = await db.query.theme.findMany({
    where: eq(theme.isDefault, true),
    columns: themeColumns,
  });

  return [...defaultThemes, ...themes];
}
```

User created:

```ts
import db from '@/lib/db';
import { user, userFlag } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';

  const currentUser = await db.query.user.findFirst({ where: eq(user.id, userId) });

  if (!currentUser) {
    throw Error('User not found');
  }
  // ... rename the later `user.` reads to `currentUser.`

export const createUserInitialFlags = async (userId: string) => {
  await db.insert(userFlag).values({ userId, key: 'showOnboardingTour', value: true });
};
```

- [ ] **Step 3: Port `billing/utils/create-new-subscription.ts`**

```ts
import db from '@/lib/db';
import { subscription } from '@trylinky/db/schema';

  const [subscriptionError, created] = await safeAwait(
    db
      .insert(subscription)
      .values({
        plan,
        stripeCustomerId,
        stripeSubscriptionId: subscriptionId,
        status: isTrialing ? 'trialing' : 'active',
        referenceId,
        periodStart,
        periodEnd,
        seats: DEFAULT_SEATS,
        trialStart: isTrialing ? trialStart : undefined,
        trialEnd: isTrialing ? trialEnd : undefined,
      })
      .returning()
  );

  if (subscriptionError) {
    captureException(subscriptionError);
    return;
  }

  return created[0];
```

- [ ] **Step 4: Port the session-scoped billing handlers**

Shared imports for these files:

```ts
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { organization, subscription, user } from '@trylinky/db/schema';
import { and, eq, exists, inArray, sql } from 'drizzle-orm';
```

`cancel-subscription.ts`:

```ts
  const current = await db.query.subscription.findFirst({
    where: and(
      eq(subscription.referenceId, session.activeOrganizationId),
      inArray(subscription.status, ['active', 'trialing'])
    ),
  });
```

`billing-portal-url.ts`, `upgrade-eligibility.ts`, `upgrade-trial.ts`:

```ts
  const current = await db.query.subscription.findFirst({
    where: eq(subscription.referenceId, session.activeOrganizationId),
  });
```

`upgrade-trial.ts` user lookup and update:

```ts
  const [currentUserError, currentUser] = await safeAwait(
    db.query.user.findFirst({ where: eq(user.id, session.user.id), columns: { email: true } })
  );
  // ...
      await db
        .update(subscription)
        .set({ status: 'active', trialStart: null, trialEnd: null })
        .where(eq(subscription.id, current.id));
```

`upgrade-to-team.ts`:

```ts
  const currentUser = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
  // ...
  const personalOrg = await db.query.organization.findFirst({
    where: and(
      eq(organization.isPersonal, true),
      userIsMemberOfOrg(organization.id, currentUser.id),
      exists(
        db
          .select({ one: sql`1` })
          .from(subscription)
          .where(
            and(
              eq(subscription.referenceId, organization.id),
              inArray(subscription.plan, ['premium', 'freeLegacy'])
            )
          )
      )
    ),
    columns: { id: true },
    with: { subscription: { columns: { id: true } } },
  });
```

`upgrade-to-premium.ts`: same shape with `inArray(subscription.plan, ['freeLegacy'])` and `with: { subscription: { columns: { id: true, stripeSubscriptionId: true } } }`.

`current-user-subscription.ts`:

```ts
  const usersOrganizations = await db.query.organization.findMany({
    where: and(
      userIsMemberOfOrg(organization.id, session.user.id),
      exists(
        db
          .select({ one: sql`1` })
          .from(subscription)
          .where(
            and(
              eq(subscription.referenceId, organization.id),
              inArray(subscription.status, ['active', 'trialing'])
            )
          )
      )
    ),
    columns: { isPersonal: true, id: true },
    with: { subscription: true },
  });
```

In every handler, rename the result variable so it does not shadow the `subscription` table import (`current`, `personalOrg`, etc.).

- [ ] **Step 5: Port the Stripe webhook handlers**

`stripe/handle-trial-expired.ts`, `stripe/handle-trial-will-end.ts`, `stripe/handle-subscription-deleted.ts` each replace the four-level select with a subscription lookup plus the member-email join:

```ts
import db from '@/lib/db';
import { getOrganizationMemberEmails } from '@/modules/organizations/utils';
import { subscription } from '@trylinky/db/schema';
import { and, eq } from 'drizzle-orm';

  // handle-trial-expired and handle-subscription-deleted:
  const [error, current] = await safeAwait(
    db.query.subscription.findFirst({
      where: and(
        eq(subscription.stripeCustomerId, stripeSubscription.customer as string),
        eq(subscription.stripeSubscriptionId, stripeSubscription.id)
      ),
      columns: { id: true, referenceId: true },
    })
  );

  // handle-trial-will-end:
  const current = await db.query.subscription.findFirst({
    where: and(eq(subscription.stripeCustomerId, stripeCustomerId), eq(subscription.status, 'trialing')),
    columns: { id: true, referenceId: true },
  });

  // then, where the old code mapped organization.members to users:
  const emails = await getOrganizationMemberEmails(current.referenceId);
  emails.forEach(async (email) => {
    await sendTrialEndedEmail(email); // or the handler's own email function
  });

  await sendSlackMessage({
    text: `Trial expired for ${current.referenceId} (Subscription: ${current.id})`,
  });
```

`handle-subscription-deleted.ts` update:

```ts
  const [updateError] = await safeAwait(
    db
      .update(subscription)
      .set({ status: 'canceled', plan: 'freeLegacy', periodEnd: new Date() })
      .where(eq(subscription.id, current.id))
  );
```

`stripe/handle-subscription-cancelled.ts`:

```ts
  const current = await db.query.subscription.findFirst({
    where: eq(subscription.stripeSubscriptionId, stripeSubscription.id),
  });
  // ...
  await db.update(subscription).set({ cancelAtPeriodEnd: true }).where(eq(subscription.id, current.id));
```

(Rename the local `subscription` from `event.data.object` to `stripeSubscription` in that file.)

`stripe/handle-subscription-created.ts`:

```ts
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import { organization, subscription, user } from '@trylinky/db/schema';
import { and, eq, exists, inArray, sql } from 'drizzle-orm';

    const owner = await db.query.user.findFirst({
      where: eq(user.id, createdByUserId),
      columns: { email: true },
    });

const cancelOwnerPremiumSubscription = async (ownerId: string) => {
  const ownerSubscription = await db.query.subscription.findFirst({
    where: and(
      inArray(subscription.status, ['active', 'trialing']),
      exists(
        db
          .select({ one: sql`1` })
          .from(organization)
          .where(
            and(
              eq(organization.id, subscription.referenceId),
              eq(organization.isPersonal, true),
              userIsMemberOfOrg(organization.id, ownerId, 'owner')
            )
          )
      )
    ),
  });
```

- [ ] **Step 6: Drop the dead mock in `billing-portal-url.test.ts`**

Delete the line `vi.mock('@/lib/prisma', () => ({ default: {} }));`. Importing `@/lib/db` has no side effects, so nothing replaces it. Keep the stripe mock.

- [ ] **Step 7: Typecheck and run the suite**

Run: `cd apps/api && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/modules/organizations apps/api/src/modules/flags apps/api/src/modules/themes apps/api/src/lib/user-created.ts apps/api/src/modules/billing
git commit -m "api: port organizations, flags, themes and billing to drizzle"
```

---

### Task 10: Port the orchestrators

**Files:**
- Modify: `apps/api/src/modules/orchestrators/index.ts`, `apps/api/src/modules/orchestrators/tiktok.ts`

- [ ] **Step 1: Port `orchestrators/index.ts`**

```ts
import db from '@/lib/db';
import { orchestration } from '@trylinky/db/schema';
import { and, eq, gt, isNull } from 'drizzle-orm';

    // create:
    const [newOrchestrator] = await db
      .insert(orchestration)
      .values({ expiresAt: new Date(Date.now() + 1000 * 60 * 30), type })
      .returning({ id: orchestration.id });

    // validate:
    const found = await db.query.orchestration.findFirst({
      where: and(
        eq(orchestration.id, orchestrationId),
        eq(orchestration.type, type),
        isNull(orchestration.pageGeneratedAt),
        gt(orchestration.expiresAt, new Date())
      ),
    });

    if (!found) {
```

(`expiresAt` must be a `Date`; Prisma accepted the ISO string, Drizzle's `mode: 'date'` column does not.)

- [ ] **Step 2: Port `orchestrators/tiktok.ts`**

Imports:

```ts
import db from '@/lib/db';
import { account, block, integration, orchestration, page } from '@trylinky/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
```

Each site, in file order:

```ts
  // existing slug check (line 22)
  const [existingPageError, existingPage] = await safeAwait(
    db.query.page.findFirst({ where: eq(page.slug, tiktokUsername), columns: { id: true } })
  );

  // page create (line 39)
    const [created] = await db
      .insert(page)
      .values({
        organizationId,
        slug: newPageSlug,
        metaTitle: `${tiktokUsername} on Linky`,
        metaDescription: `${tiktokUsername} on Linky`,
        publishedAt: new Date(),
        config: {},
      })
      .returning();
    return created;

  // every block create (lines 69, 95, 117, 170, 213): same pattern
    const [created] = await db
      .insert(block)
      .values({ pageId, type: 'header', config: {}, data: { /* unchanged */ } })
      .returning();
    return created;

  // the two "connect integration" updates (lines 179, 222)
    await db.update(block).set({ integrationId }).where(eq(block.id, created.id));

  // integration create (line 259)
    const [created] = await db
      .insert(integration)
      .values({ organizationId, type: 'tiktok', encryptedConfig, displayName })
      .returning();
    return created;

  // token refresh write (line 350)
      await db
        .update(account)
        .set({ accessToken: newTokens.accessToken, refreshToken: newTokens.refreshToken })
        .where(and(eq(account.userId, userId), eq(account.providerId, 'tiktok')));

  // page layout write (line 534)
  await db
    .update(page)
    .set({ config, mobileConfig, themeId: '14fc9bdf-f363-4404-b05e-856670722fda' })
    .where(eq(page.id, pageId));

  // tiktok account read (line 547)
  const tiktokAccount = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, 'tiktok')),
  });

  // orchestration read (line 608)
  const current = await db.query.orchestration.findFirst({
    where: and(eq(orchestration.id, orchestrationId), isNull(orchestration.pageGeneratedAt)),
  });

  // orchestration completion (line 753)
  await db
    .update(orchestration)
    .set({ pageGeneratedAt: new Date(), pageId: createdPage.id })
    .where(eq(orchestration.id, orchestrationId));
```

Rename local variables that would shadow the table imports (`page` → `createdPage`, `block` → `created`, `integration` → `createdIntegration`, `orchestration` → `current`).

- [ ] **Step 3: Typecheck and run the suite**

Run: `cd apps/api && pnpm typecheck && pnpm test`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/orchestrators
git commit -m "api: port orchestrators to drizzle"
```

---

### Task 11: better-auth on the Drizzle adapter

**Files:**
- Modify: `apps/api/src/lib/auth.ts`

- [ ] **Step 1: Swap the adapter and port `getActiveOrganization`**

Replace the imports `import prisma from '@/lib/prisma';`, `import { PrismaClient } from '@trylinky/prisma';`, `import { prismaAdapter } from 'better-auth/adapters/prisma';` with:

```ts
import db from '@/lib/db';
import { userIsMemberOfOrg } from '@/lib/db-predicates';
import {
  account,
  invitation,
  member,
  organization,
  session,
  user,
  verification,
} from '@trylinky/db/schema';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
```

Replace the `database:` option:

```ts
    // Schema passed explicitly: the tables are PascalCase ("User") but
    // better-auth resolves models by these keys, so the mapping is by key,
    // not by table name.
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user, session, account, verification, organization, member, invitation },
      usePlural: false,
    }),
```

Known caveat, unchanged from today: `User.banExpires` is an `INTEGER` column (mirroring Prisma) while better-auth's admin plugin models it as a date. The ban flow is not used anywhere in the app and is out of scope; do not change the column type in this phase.

Replace `getActiveOrganization`:

```ts
const getActiveOrganization = async (userId: string) => {
  return db.query.organization.findFirst({
    where: userIsMemberOfOrg(organization.id, userId),
  });
};
```

- [ ] **Step 2: Typecheck, run the suite, and exercise auth end to end locally**

Run: `cd apps/api && pnpm typecheck && pnpm test`
Expected: pass (`app.test.ts` boots the app with the adapter).

Then run the worker locally against the dev database and sign in through the frontend:

```bash
cd apps/api && pnpm dev
# in another terminal
cd apps/frontend && pnpm dev
```

Sign in with the magic link flow (Resend is mocked locally by the existing dev setup; use the link printed in the API log), confirm a session row is created, open `/e`, and confirm the team switcher lists your organization. This covers `session.create.before` (active organization lookup) and the adapter's field mapping.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/lib/auth.ts
git commit -m "api: move better-auth to the drizzle adapter"
```

---

### Task 12: Remove Prisma from the API and measure

**Files:**
- Delete: `apps/api/src/lib/prisma.ts`, `apps/api/src/lib/prisma.test.ts`, `packages/prisma/index.workerd.ts`, `packages/prisma/src/generated-workerd/`
- Modify: `apps/api/package.json`, `packages/prisma/package.json`, `packages/prisma/prisma/schema.prisma`, `.github/workflows/ci.yml` (deploy job only)

- [ ] **Step 1: Confirm nothing imports Prisma in the API**

Run: `grep -rn "@/lib/prisma\|@trylinky/prisma\|@prisma/" apps/api/src`
Expected: no output. If there is output, port that site first.

- [ ] **Step 2: Delete the old client and its test**

```bash
git rm apps/api/src/lib/prisma.ts apps/api/src/lib/prisma.test.ts
```

- [ ] **Step 3: Drop the API's Prisma dependencies**

In `apps/api/package.json` remove `"@prisma/adapter-pg"` and `"@trylinky/prisma"`. Run `pnpm install`.

- [ ] **Step 4: Remove the workerd generator**

In `packages/prisma/prisma/schema.prisma` delete the `generator clientWorkerd { ... }` block and its comment. In `packages/prisma/package.json` change `exports["."]` to the plain string `"./index.ts"`. Then:

```bash
git rm packages/prisma/index.workerd.ts
git rm -r packages/prisma/src/generated-workerd
```

Add `packages/prisma/src/generated-workerd/` to nothing; it is gone. Run `pnpm --filter @trylinky/prisma prisma:generate` to confirm the single generator still works.

- [ ] **Step 5: Remove the Prisma generate step from the deploy job**

In `.github/workflows/ci.yml`, delete the "Generate the Prisma client" step (and its comment) from the `deploy` job only. The `verify` job keeps its step until Phase 2 because the frontend still typechecks against `@trylinky/prisma`.

- [ ] **Step 6: Typecheck everything and run the suite**

Run from the root: `pnpm typecheck && pnpm lint && cd apps/api && pnpm test`
Expected: pass.

- [ ] **Step 7: Measure the bundle**

```bash
cd apps/api && pnpm exec wrangler deploy --dry-run --outdir /tmp/linky-dryrun-after
```

Record the `Total Upload` line. Before Phase 1 it was `9724.33 KiB / gzip: 2450.47 KiB`, with `query_compiler_bg.wasm` at 1.8 MB. Confirm no `.wasm` file named `query_compiler` is in the output directory. Paste both numbers into the PR description.

- [ ] **Step 8: Commit**

```bash
git add -A apps/api packages/prisma .github/workflows/ci.yml pnpm-lock.yaml
git commit -m "api: remove prisma"
```

---

### Task 13: Migration tooling in CI, Vercel, turbo, and root scripts

**Files:**
- Modify: `.github/workflows/ci.yml`, `apps/frontend/package.json`, `turbo.json`, root `package.json`

- [ ] **Step 1: CI verify job**

In the `verify` job of `.github/workflows/ci.yml`, replace the "Sync the test database with the schema" step with two steps:

```yaml
      # Creates the tables in the service container by applying the Drizzle
      # migrations, which also exercises the baseline on every run.
      - name: Apply database migrations
        run: pnpm migrate
        working-directory: packages/db

      # Until Phase 2 removes schema.prisma, the two schema definitions must
      # agree. Prisma diffs the migrated database against its own schema.
      - name: Check schema parity with schema.prisma
        run: pnpm prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
        working-directory: packages/prisma
```

Keep the "Generate the Prisma client" step in `verify` (the frontend still needs it).

- [ ] **Step 2: CI deploy job**

In the `deploy` job, before the `cloudflare/wrangler-action@v3` step, add:

```yaml
      # Runs any migration newer than the last journal entry, against the
      # direct (non-pooled) URL. A no-op when nothing is pending.
      - name: Run database migrations
        run: pnpm migrate
        working-directory: packages/db
        env:
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

`DIRECT_URL` has to exist as a secret on the `Production` GitHub environment. Add it there before merging (Settings → Environments → Production → Environment secrets), using the same value the frontend's Vercel project has for `DIRECT_URL`.

- [ ] **Step 3: Frontend build no longer migrates**

In `apps/frontend/package.json` change `vercel:build` to:

```json
"vercel:build": "prisma generate --schema ../../packages/prisma/prisma/schema.prisma && next build"
```

- [ ] **Step 4: turbo tasks**

In `turbo.json`:

- Delete the `prisma:migrate` task.
- Add:

```json
    "migrate": {
      "cache": false,
      "env": ["DIRECT_URL"]
    },
```

- Leave `prisma:generate` and the `^prisma:generate` dependencies in place (frontend and marketing still consume the Prisma client until Phase 2).

- [ ] **Step 5: Root scripts**

In the root `package.json` replace the three `dev:*` scripts with:

```json
    "dev:push": "pnpm --filter @trylinky/db push",
    "dev:seed": "pnpm --filter @trylinky/db seed",
    "dev:reset": "dotenvx run -f .env.local -- sh -c 'psql \"$DIRECT_URL\" -c \"DROP SCHEMA public CASCADE; CREATE SCHEMA public;\"' && pnpm dev:push && pnpm dev:seed"
```

`dev:reset` needs `psql` on the PATH; the docker image provides it via `docker compose exec postgres psql` if a local binary is missing, and the docs (Task 14) say so.

- [ ] **Step 6: Verify locally**

```bash
pnpm dev:push       # against the dev DB: expects "No changes detected" or applies nothing
pnpm typecheck
```

Expected: `drizzle-kit push` reports the dev database already matches.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/ci.yml apps/frontend/package.json turbo.json package.json
git commit -m "ci: run drizzle migrations, stop migrating from the vercel build"
```

---

### Task 14: Seed rewrite, theme seed data move, and docs

**Files:**
- Create: `packages/db/src/seed-data.ts`, `packages/db/src/seed.ts`, `packages/db/migrations/README.md`
- Modify: `apps/frontend/lib/theme.ts`, `apps/frontend/next.config.ts`, `apps/frontend/package.json`, `docs/local-development.md`, `docs/self-hosting.md`, `CONTRIBUTING.md`
- Delete: `packages/prisma/prisma/seed.ts`

- [ ] **Step 1: Move the seed data**

Create `packages/db/src/seed-data.ts` containing, verbatim, lines 3–93 of `apps/frontend/lib/theme.ts` (the `DefaultThemeNames` type, the `defaultThemes` array, and the `defaultThemeSeeds` record, including the `// TODO - Fix the L/S color values` comment). No imports are needed.

In `apps/frontend/lib/theme.ts` delete those lines and add at the top:

```ts
export {
  defaultThemes,
  defaultThemeSeeds,
  type DefaultThemeNames,
} from '@trylinky/db/seed-data';
```

Add `"@trylinky/db": "workspace:*"` to `apps/frontend/package.json` dependencies, add `'@trylinky/db'` to `transpilePackages` in `apps/frontend/next.config.ts`, run `pnpm install`, then `pnpm --filter @trylinky/frontend typecheck`.

- [ ] **Step 2: Write the seed**

`packages/db/src/seed.ts`:

```ts
import { createDb } from './client';
import { member, organization, theme, user } from './schema';
import { defaultThemeSeeds, type DefaultThemeNames } from './seed-data';

const INITIAL_USER_ID = '62b6a104-6f6e-44e2-b610-801b5e103b29';
const INITIAL_TEAM_ID = '01929fe6-7ade-7dd9-b5ca-26ef831c2914';

const themeNames: Record<DefaultThemeNames, string> = {
  Default: 'Default',
  Purple: 'Purple',
  Black: 'Black',
  Forest: 'Forest',
  Lilac: 'Lilac',
  OrangePunch: 'Orange Punch',
};

async function main() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DIRECT_URL or DATABASE_URL must be set');
  }

  const { db, close } = createDb({ connectionString });

  try {
    // Every insert is keyed on a fixed id and skipped when it exists, so the
    // seed can run repeatedly. The old seed omitted the id from the user and
    // organization inserts, so a re-run after a manual delete made new rows.
    await db
      .insert(user)
      .values({
        id: INITIAL_USER_ID,
        name: 'Initial User',
        email: 'hello@lin.ky',
        emailVerified: true,
        role: 'user',
      })
      .onConflictDoNothing({ target: user.id });

    await db
      .insert(organization)
      .values({ id: INITIAL_TEAM_ID, name: 'Initial Team', isPersonal: true, slug: 'initial-team' })
      .onConflictDoNothing({ target: organization.id });

    const existingMembership = await db.query.member.findFirst({
      where: (m, { and, eq }) => and(eq(m.userId, INITIAL_USER_ID), eq(m.organizationId, INITIAL_TEAM_ID)),
    });

    if (!existingMembership) {
      await db.insert(member).values({ userId: INITIAL_USER_ID, organizationId: INITIAL_TEAM_ID, role: 'admin' });
    }

    for (const [key, seed] of Object.entries(defaultThemeSeeds) as [DefaultThemeNames, any][]) {
      await db
        .insert(theme)
        .values({
          id: seed.id,
          name: themeNames[key],
          createdById: INITIAL_USER_ID,
          isDefault: true,
          colorBgBase: seed.colorBgBase,
          colorBgPrimary: seed.colorBgPrimary,
          colorBgSecondary: seed.colorBgSecondary,
          colorBorderPrimary: seed.colorBorderPrimary,
          colorLabelPrimary: seed.colorLabelPrimary,
          colorLabelSecondary: seed.colorLabelSecondary,
          colorLabelTertiary: seed.colorLabelTertiary,
        })
        .onConflictDoNothing({ target: theme.id });
    }
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Delete the old seed: `git rm packages/prisma/prisma/seed.ts`.

- [ ] **Step 3: Run the seed against the dev database**

Run: `pnpm dev:seed`
Expected: exits 0. Run it a second time: exits 0 with no duplicate rows (`select count(*) from "Theme" where "isDefault"` is still 6).

- [ ] **Step 4: Write the migrations README**

`packages/db/migrations/README.md`:

```markdown
# Migrations

Generated by drizzle-kit from `src/schema`. Never edit a migration that has
been applied anywhere.

## Workflow

1. Change `src/schema/tables.ts` (and `relations.ts` if a foreign key changed).
2. `pnpm --filter @trylinky/db generate` writes the next `NNNN_*.sql` and
   updates `meta/`.
3. Commit the SQL and `meta/` together.
4. The deploy job runs `drizzle-kit migrate` before the worker is deployed.

Locally, `pnpm dev:push` syncs the dev database to the schema without
writing a migration file.

## The baseline

`0000_baseline.sql` reproduces the schema Prisma had built up over 70
migrations. Production already had that schema, so the baseline was never
executed there. Instead its journal row was inserted by hand so that
`drizzle-kit migrate` treats it as applied:

    CREATE SCHEMA IF NOT EXISTS drizzle;
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES ('<sha256 of 0000_baseline.sql>', <"when" from meta/_journal.json>);

The hash is `shasum -a 256 migrations/0000_baseline.sql`. drizzle-kit decides
what to apply by comparing each journal entry's `when` against the newest
`created_at` in that table, so the row's timestamp is what matters.

Fresh databases (CI, a new self-hosted install) run the baseline for real.
Parity between the baseline and `schema.prisma` was proven with
`scripts/check-parity.sh` before Phase 1 merged, and CI re-checks it until
`schema.prisma` is deleted in Phase 2.
```

- [ ] **Step 5: Update the docs**

`docs/local-development.md` step 4, item 2: replace the Prisma `db push` block and note with:

````markdown
2. Create the schema. `pnpm dev:push` syncs the database to the Drizzle
   schema in `packages/db`:

```bash
pnpm dev:push
pnpm dev:seed
```

> [!NOTE]
> Prefer `dev:push` locally. Migration files are only generated for changes
> that ship (`pnpm --filter @trylinky/db generate`); see
> `packages/db/migrations/README.md`. `pnpm dev:reset` drops and recreates
> the `public` schema, then pushes and seeds; it needs `psql` on your PATH
> (or run it through `docker compose exec postgres psql`).
````

`docs/self-hosting.md`: replace `turbo run prisma:migrate prisma:generate --filter=@trylinky/prisma` with:

```bash
DIRECT_URL=<your direct postgres url> pnpm --filter @trylinky/db migrate
```

`CONTRIBUTING.md`: replace `cd packages/prisma && pnpm prisma db push && cd ../..` with `pnpm dev:push`, and in the Worker paragraph change "Clients that hold a socket (Prisma, better-auth) are constructed per request, see `apps/api/src/lib/prisma.ts`" to "Clients that hold a socket (the database pool, better-auth) are constructed per request, see `apps/api/src/lib/db.ts`".

- [ ] **Step 6: Typecheck and run everything**

Run from the root: `pnpm typecheck && pnpm lint && cd apps/api && pnpm test`
Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add packages/db apps/frontend/lib/theme.ts apps/frontend/next.config.ts apps/frontend/package.json packages/prisma docs CONTRIBUTING.md pnpm-lock.yaml
git commit -m "db: rewrite the seed and move theme seed data"
```

---

### Task 15: Production adoption and release

**Files:**
- None new. This task is the runbook for merging Phase 1.

- [ ] **Step 1: Confirm production matches `schema.prisma` today**

From a machine with the production direct URL:

```bash
cd packages/prisma && DIRECT_URL=<prod direct url> pnpm prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Expected: exit 0, no diff. If there is a diff, stop: production has drifted from the schema and that has to be understood before the baseline is adopted.

- [ ] **Step 2: Insert the baseline journal row in production**

```bash
shasum -a 256 packages/db/migrations/0000_baseline.sql   # copy the hash
grep '"when"' packages/db/migrations/meta/_journal.json   # copy the number
psql "<prod direct url>" <<'SQL'
CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('<hash>', <when>);
SQL
```

Then prove it is a no-op:

```bash
DIRECT_URL=<prod direct url> pnpm --filter @trylinky/db migrate
```

Expected: completes with nothing applied.

- [ ] **Step 3: Add the `DIRECT_URL` secret to the Production GitHub environment** (Task 13, Step 2).

- [ ] **Step 4: Confirm production Postgres accepts connections from GitHub-hosted runners**

The deploy job now runs migrations from GitHub Actions rather than Vercel. If the database restricts access by IP, allow the GitHub-hosted runner ranges (or move the migrate step to a trusted, fixed-IP runner) before merging, or the deploy job's migrate step will fail against production.

- [ ] **Step 5: Open the PR**

The description includes: the parity check output, the bundle size before and after (Task 12, Step 7), and a note that the frontend still uses Prisma until Phase 2.

- [ ] **Step 6: Merge and smoke**

After the deploy job finishes:

```bash
cd apps/api && pnpm smoke https://api.lin.ky
```

Expected: every check `ok`. Then sign in on lin.ky, open the editor, add and delete a block, and open a public page.

If smoke fails: `cd apps/api && pnpm exec wrangler rollback`, which restores the previous worker version. Phase 1 changed no schema, so the rolled-back Prisma worker keeps working.

- [ ] **Step 7: Record the outcome**

Add a line to the plan's parent spec under `**Status:**` (`Phase 1 shipped <date>, bundle <before> → <after>`) and commit it:

```bash
git commit -am "docs: record phase 1 outcome"
```

---

## Phase 2

Phase 2 (frontend endpoints, deleting `packages/prisma`) is planned separately once this phase has shipped, because its tasks build on the Drizzle modules this plan creates. Its scope is the "Phase 2: frontend behind the API" section of the spec.
