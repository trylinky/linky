/*
  Warnings:

  - You are about to drop the column `colorBgBase` on the `Theme` table. All the data in the column will be lost.
  - You are about to drop the column `colorBgPrimary` on the `Theme` table. All the data in the column will be lost.
  - You are about to drop the column `colorBgSecondary` on the `Theme` table. All the data in the column will be lost.
  - You are about to drop the column `colorBorderPrimary` on the `Theme` table. All the data in the column will be lost.
  - You are about to drop the column `colorLabelPrimary` on the `Theme` table. All the data in the column will be lost.
  - You are about to drop the column `colorLabelSecondary` on the `Theme` table. All the data in the column will be lost.
  - You are about to drop the column `colorLabelTertiary` on the `Theme` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Theme" DROP COLUMN "colorBgBase",
DROP COLUMN "colorBgPrimary",
DROP COLUMN "colorBgSecondary",
DROP COLUMN "colorBorderPrimary",
DROP COLUMN "colorLabelPrimary",
DROP COLUMN "colorLabelSecondary",
DROP COLUMN "colorLabelTertiary";
