-- AlterTable
ALTER TABLE "Theme" ADD COLUMN     "colorBgBase" JSONB,
ADD COLUMN     "colorBgPrimary" JSONB,
ADD COLUMN     "colorBgSecondary" JSONB,
ADD COLUMN     "colorBorderPrimary" JSONB,
ADD COLUMN     "colorLabelPrimary" JSONB,
ADD COLUMN     "colorLabelSecondary" JSONB,
ADD COLUMN     "colorLabelTertiary" JSONB;
