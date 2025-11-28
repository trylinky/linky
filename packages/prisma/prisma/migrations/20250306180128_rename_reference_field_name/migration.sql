/*
  Warnings:

  - You are about to drop the column `reference` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[referenceId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referenceId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Subscription_reference_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "reference",
ADD COLUMN     "referenceId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_referenceId_key" ON "Subscription"("referenceId");
