-- AlterTable
ALTER TABLE "pro_profiles" DROP COLUMN "serviceAreaJson",
ADD COLUMN "serviceRadiusKm" INTEGER NOT NULL DEFAULT 10;
