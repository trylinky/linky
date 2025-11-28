/*
  Warnings:

  - You are about to drop the column `access_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `id_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `providerAccountId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `session_state` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `token_type` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Integration` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Theme` table. All the data in the column will be lost.
  - You are about to drop the column `acceptedInviteAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hasBetaAccess` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hasPremiumAccess` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hasTeamAccess` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSubscriptionId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeTrialEnd` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `User` table. All the data in the column will be lost.
  - The `emailVerified` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `InviteCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[providerId,accountId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountId` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Account_provider_providerAccountId_key";

-- DropIndex
DROP INDEX "Integration_teamId_idx";

-- DropIndex
DROP INDEX "Integration_userId_idx";

-- DropIndex
DROP INDEX "Page_teamId_idx";

-- DropIndex
DROP INDEX "Page_userId_idx";

-- DropIndex
DROP INDEX "Theme_teamId_idx";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "access_token",
DROP COLUMN "expiresAt",
DROP COLUMN "expires_at",
DROP COLUMN "id_token",
DROP COLUMN "provider",
DROP COLUMN "providerAccountId",
DROP COLUMN "refresh_token",
DROP COLUMN "session_state",
DROP COLUMN "token_type",
DROP COLUMN "type",
ADD COLUMN     "accessToken" TEXT,
ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "accountId" TEXT NOT NULL,
ADD COLUMN     "idToken" TEXT,
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Integration" DROP COLUMN "teamId",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "teamId",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Theme" DROP COLUMN "teamId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "acceptedInviteAt",
DROP COLUMN "hasBetaAccess",
DROP COLUMN "hasPremiumAccess",
DROP COLUMN "hasTeamAccess",
DROP COLUMN "isAdmin",
DROP COLUMN "plan",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripeSubscriptionId",
DROP COLUMN "stripeTrialEnd",
DROP COLUMN "teamId",
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "InviteCode";

-- DropTable
DROP TABLE "Team";

-- DropTable
DROP TABLE "TeamInvite";

-- DropTable
DROP TABLE "TeamUser";

-- DropTable
DROP TABLE "VerificationToken";

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Integration_organizationId_idx" ON "Integration"("organizationId");

-- CreateIndex
CREATE INDEX "Page_organizationId_idx" ON "Page"("organizationId");

-- CreateIndex
CREATE INDEX "Theme_organizationId_idx" ON "Theme"("organizationId");
