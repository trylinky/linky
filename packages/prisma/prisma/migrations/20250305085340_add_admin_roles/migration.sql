-- AlterTable
ALTER TABLE "User" ADD COLUMN     "banExpires" INTEGER,
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN,
ADD COLUMN     "role" TEXT;
