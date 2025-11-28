/*
  Warnings:

  - Added the required column `backgroundImage` to the `Theme` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "backgroundImage" TEXT NOT NULL;
