-- CreateEnum
CREATE TYPE "OrchestrationType" AS ENUM ('TIKTOK');

-- CreateTable
CREATE TABLE "Orchestration" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "pageGeneratedAt" TIMESTAMP(3),
    "pageId" TEXT,
    "type" "OrchestrationType" NOT NULL,

    CONSTRAINT "Orchestration_pkey" PRIMARY KEY ("id")
);
