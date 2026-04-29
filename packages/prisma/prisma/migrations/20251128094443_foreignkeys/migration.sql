-- Normalize empty-string FKs to NULL (legacy data)
UPDATE "Page" SET "themeId" = NULL WHERE "themeId" = '';
UPDATE "Page" SET "organizationId" = NULL WHERE "organizationId" = '';
UPDATE "Block" SET "integrationId" = NULL WHERE "integrationId" = '';
UPDATE "Integration" SET "organizationId" = NULL WHERE "organizationId" = '';
UPDATE "Theme" SET "organizationId" = NULL WHERE "organizationId" = '';
UPDATE "Orchestration" SET "pageId" = NULL WHERE "pageId" = '';

-- Drop orphans for non-nullable / RESTRICT / CASCADE FKs
DELETE FROM "Account"             WHERE "userId" NOT IN (SELECT "id" FROM "User");
DELETE FROM "Session"             WHERE "userId" NOT IN (SELECT "id" FROM "User");
DELETE FROM "Invitation"          WHERE "inviterId"      NOT IN (SELECT "id" FROM "User")
                                     OR "organizationId" NOT IN (SELECT "id" FROM "Organization");
DELETE FROM "Member"              WHERE "userId"         NOT IN (SELECT "id" FROM "User")
                                     OR "organizationId" NOT IN (SELECT "id" FROM "Organization");
DELETE FROM "Subscription"        WHERE "referenceId" NOT IN (SELECT "id" FROM "Organization");
DELETE FROM "Block"               WHERE "pageId" NOT IN (SELECT "id" FROM "Page");
DELETE FROM "Theme"               WHERE "createdById" NOT IN (SELECT "id" FROM "User");
DELETE FROM "VerificationRequest" WHERE "pageId" NOT IN (SELECT "id" FROM "Page")
                                     OR "requestedByUserId" NOT IN (SELECT "id" FROM "User");
DELETE FROM "UserFlag"            WHERE "userId" NOT IN (SELECT "id" FROM "User");

-- Null-out remaining orphans for SET NULL FKs
UPDATE "Page"          SET "themeId" = NULL        WHERE "themeId" IS NOT NULL        AND "themeId"        NOT IN (SELECT "id" FROM "Theme");
UPDATE "Page"          SET "organizationId" = NULL WHERE "organizationId" IS NOT NULL AND "organizationId" NOT IN (SELECT "id" FROM "Organization");
UPDATE "Block"         SET "integrationId" = NULL  WHERE "integrationId" IS NOT NULL  AND "integrationId"  NOT IN (SELECT "id" FROM "Integration");
UPDATE "Integration"   SET "organizationId" = NULL WHERE "organizationId" IS NOT NULL AND "organizationId" NOT IN (SELECT "id" FROM "Organization");
UPDATE "Theme"         SET "organizationId" = NULL WHERE "organizationId" IS NOT NULL AND "organizationId" NOT IN (SELECT "id" FROM "Organization");
UPDATE "Orchestration" SET "pageId" = NULL         WHERE "pageId" IS NOT NULL         AND "pageId"         NOT IN (SELECT "id" FROM "Page");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orchestration" ADD CONSTRAINT "Orchestration_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFlag" ADD CONSTRAINT "UserFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
