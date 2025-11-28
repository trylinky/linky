-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "colorBgPrimary" TEXT NOT NULL,
    "colorBgSecondary" TEXT NOT NULL,
    "colorLabelPrimary" TEXT NOT NULL,
    "colorLabelSecondary" TEXT NOT NULL,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);
