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
