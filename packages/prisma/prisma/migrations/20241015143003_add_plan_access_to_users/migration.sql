-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasPremiumAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTeamAccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeSubscriptionId" TEXT;
