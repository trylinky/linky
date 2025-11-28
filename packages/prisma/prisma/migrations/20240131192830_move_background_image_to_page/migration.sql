/*
  Warnings:

  - You are about to drop the column `backgroundImage` on the `Theme` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "backgroundImage" TEXT;

-- AlterTable
ALTER TABLE "Theme" DROP COLUMN "backgroundImage";
