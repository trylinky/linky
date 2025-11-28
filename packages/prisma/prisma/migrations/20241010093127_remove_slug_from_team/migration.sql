/*
  Warnings:

  - You are about to drop the column `slug` on the `Team` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Team_slug_key";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "slug";
