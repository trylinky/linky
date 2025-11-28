/*
  Warnings:

  - Added the required column `colorBorderPrimary` to the `Theme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `colorLabelTertiary` to the `Theme` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "colorBorderPrimary" TEXT NOT NULL,
ADD COLUMN     "colorLabelTertiary" TEXT NOT NULL;
