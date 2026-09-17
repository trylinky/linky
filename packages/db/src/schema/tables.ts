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
    uniqueIndex('Account_providerId_accountId_key').on(
      t.providerId,
      t.accountId
    ),
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
    index('Page_organizationId_deletedAt_idx').on(
      t.organizationId,
      t.deletedAt
    ),
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
    index('Integration_organizationId_deletedAt_idx').on(
      t.organizationId,
      t.deletedAt
    ),
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
    index('FormSubmission_blockId_visitorIp_createdAt_idx').on(
      t.blockId,
      t.visitorIp,
      t.createdAt
    ),
    index('FormSubmission_pageId_blockId_createdAt_idx').on(
      t.pageId,
      t.blockId,
      t.createdAt
    ),
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
