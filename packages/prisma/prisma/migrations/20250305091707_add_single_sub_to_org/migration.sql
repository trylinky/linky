/*
  Warnings:

  - You are about to drop the column `subscriptionId` on the `Organization` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reference]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "subscriptionId";

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_reference_key" ON "Subscription"("reference");
