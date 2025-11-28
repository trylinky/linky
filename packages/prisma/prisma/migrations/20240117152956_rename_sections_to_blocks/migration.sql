/*
  Warnings:

  - You are about to drop the column `sections_order` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the `Section` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Page" DROP COLUMN "sections_order";

-- DropTable
DROP TABLE "Section";

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);
