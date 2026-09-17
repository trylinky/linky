CREATE TYPE "public"."OrchestrationType" AS ENUM('TIKTOK');--> statement-breakpoint
CREATE TYPE "public"."VerificationRequestStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"accessTokenExpiresAt" timestamp (3),
	"refreshTokenExpiresAt" timestamp (3),
	"scope" text,
	"idToken" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Block" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"pageId" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb NOT NULL,
	"data" jsonb NOT NULL,
	"integrationId" text
);
--> statement-breakpoint
CREATE TABLE "FormSubmission" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"pageId" text NOT NULL,
	"blockId" text NOT NULL,
	"answers" jsonb NOT NULL,
	"fieldsSnapshot" jsonb NOT NULL,
	"visitorIp" text
);
--> statement-breakpoint
CREATE TABLE "Integration" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"type" text NOT NULL,
	"displayName" text,
	"encryptedConfig" text,
	"deletedAt" timestamp (3),
	"organizationId" text
);
--> statement-breakpoint
CREATE TABLE "Invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"inviterId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"status" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Member" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"organizationId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Orchestration" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"pageGeneratedAt" timestamp (3),
	"pageId" text,
	"type" "OrchestrationType" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"isPersonal" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Page" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"publishedAt" timestamp (3),
	"deletedAt" timestamp (3),
	"slug" text NOT NULL,
	"config" jsonb NOT NULL,
	"mobileConfig" jsonb,
	"metaTitle" text,
	"metaDescription" text,
	"themeId" text,
	"backgroundImage" text,
	"customDomain" text,
	"verifiedAt" timestamp (3),
	"isFeatured" boolean DEFAULT false NOT NULL,
	"organizationId" text
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"activeOrganizationId" text,
	"impersonatedBy" text
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"referenceId" text NOT NULL,
	"stripeCustomerId" text NOT NULL,
	"stripeSubscriptionId" text,
	"status" text NOT NULL,
	"periodStart" timestamp (3),
	"periodEnd" timestamp (3),
	"cancelAtPeriodEnd" boolean,
	"seats" integer,
	"trialStart" timestamp (3),
	"trialEnd" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "Theme" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdById" text NOT NULL,
	"colorBgBase" jsonb,
	"colorBgPrimary" jsonb,
	"colorBgSecondary" jsonb,
	"colorBorderPrimary" jsonb,
	"colorTitlePrimary" jsonb,
	"colorTitleSecondary" jsonb,
	"colorLabelPrimary" jsonb,
	"colorLabelSecondary" jsonb,
	"colorLabelTertiary" jsonb,
	"font" text,
	"backgroundImage" text,
	"organizationId" text
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"role" text,
	"banned" boolean,
	"banReason" text,
	"banExpires" integer,
	"stripeCustomerId" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "UserFlag" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"key" text NOT NULL,
	"value" boolean NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "VerificationRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"pageId" text NOT NULL,
	"status" "VerificationRequestStatus" DEFAULT 'PENDING' NOT NULL,
	"requestedByUserId" text NOT NULL,
	"rejectedReason" text,
	"verifiedAt" timestamp (3),
	"rejectedAt" timestamp (3),
	"requestedPageTitle" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Block" ADD CONSTRAINT "Block_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."Page"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Block" ADD CONSTRAINT "Block_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."Integration"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "FormSubmission" ADD CONSTRAINT "FormSubmission_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."Page"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Member" ADD CONSTRAINT "Member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Orchestration" ADD CONSTRAINT "Orchestration_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."Page"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Page" ADD CONSTRAINT "Page_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "public"."Theme"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Page" ADD CONSTRAINT "Page_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "public"."Organization"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "UserFlag" ADD CONSTRAINT "UserFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."Page"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account" USING btree ("providerId","accountId");--> statement-breakpoint
CREATE INDEX "Account_userId_idx" ON "Account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Block_pageId_idx" ON "Block" USING btree ("pageId");--> statement-breakpoint
CREATE INDEX "Block_integrationId_idx" ON "Block" USING btree ("integrationId");--> statement-breakpoint
CREATE INDEX "FormSubmission_blockId_createdAt_idx" ON "FormSubmission" USING btree ("blockId","createdAt");--> statement-breakpoint
CREATE INDEX "FormSubmission_blockId_visitorIp_createdAt_idx" ON "FormSubmission" USING btree ("blockId","visitorIp","createdAt");--> statement-breakpoint
CREATE INDEX "FormSubmission_pageId_blockId_createdAt_idx" ON "FormSubmission" USING btree ("pageId","blockId","createdAt");--> statement-breakpoint
CREATE INDEX "Integration_type_idx" ON "Integration" USING btree ("type");--> statement-breakpoint
CREATE INDEX "Integration_organizationId_idx" ON "Integration" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "Integration_organizationId_deletedAt_idx" ON "Integration" USING btree ("organizationId","deletedAt");--> statement-breakpoint
CREATE INDEX "Invitation_organizationId_idx" ON "Invitation" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "Invitation_inviterId_idx" ON "Invitation" USING btree ("inviterId");--> statement-breakpoint
CREATE INDEX "Member_organizationId_idx" ON "Member" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "Member_userId_idx" ON "Member" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Orchestration_pageId_idx" ON "Orchestration" USING btree ("pageId");--> statement-breakpoint
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "Organization_slug_idx" ON "Organization" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "Page_slug_key" ON "Page" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "Page_customDomain_key" ON "Page" USING btree ("customDomain");--> statement-breakpoint
CREATE INDEX "Page_organizationId_idx" ON "Page" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "Page_organizationId_deletedAt_idx" ON "Page" USING btree ("organizationId","deletedAt");--> statement-breakpoint
CREATE INDEX "Page_slug_deletedAt_idx" ON "Page" USING btree ("slug","deletedAt");--> statement-breakpoint
CREATE INDEX "Page_customDomain_deletedAt_idx" ON "Page" USING btree ("customDomain","deletedAt");--> statement-breakpoint
CREATE INDEX "Page_themeId_idx" ON "Page" USING btree ("themeId");--> statement-breakpoint
CREATE UNIQUE INDEX "Session_token_key" ON "Session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "Session_userId_token_idx" ON "Session" USING btree ("userId","token");--> statement-breakpoint
CREATE UNIQUE INDEX "Subscription_referenceId_key" ON "Subscription" USING btree ("referenceId");--> statement-breakpoint
CREATE INDEX "Subscription_referenceId_idx" ON "Subscription" USING btree ("referenceId");--> statement-breakpoint
CREATE INDEX "Theme_createdById_idx" ON "Theme" USING btree ("createdById");--> statement-breakpoint
CREATE INDEX "Theme_organizationId_idx" ON "Theme" USING btree ("organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "User_email_idx" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "UserFlag_userId_idx" ON "UserFlag" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "VerificationRequest_requestedByUserId_idx" ON "VerificationRequest" USING btree ("requestedByUserId");--> statement-breakpoint
CREATE INDEX "VerificationRequest_pageId_idx" ON "VerificationRequest" USING btree ("pageId");