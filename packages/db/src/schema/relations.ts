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

export const organizationRelations = relations(
  organization,
  ({ one, many }) => ({
    integrations: many(integration),
    themes: many(theme),
    pages: many(page),
    invitations: many(invitation),
    members: many(member),
    subscription: one(subscription, {
      fields: [organization.id],
      references: [subscription.referenceId],
    }),
  })
);

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

export const verificationRequestRelations = relations(
  verificationRequest,
  ({ one }) => ({
    page: one(page, {
      fields: [verificationRequest.pageId],
      references: [page.id],
    }),
    requestedBy: one(user, {
      fields: [verificationRequest.requestedByUserId],
      references: [user.id],
    }),
  })
);

export const orchestrationRelations = relations(orchestration, ({ one }) => ({
  page: one(page, { fields: [orchestration.pageId], references: [page.id] }),
}));

export const userFlagRelations = relations(userFlag, ({ one }) => ({
  user: one(user, { fields: [userFlag.userId], references: [user.id] }),
}));
