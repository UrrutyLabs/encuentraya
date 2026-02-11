-- AlterTable
ALTER TABLE "pro_profiles" ADD COLUMN     "baseAddressLine" TEXT,
ADD COLUMN     "baseCountryCode" TEXT,
ADD COLUMN     "baseLatitude" DOUBLE PRECISION,
ADD COLUMN     "baseLongitude" DOUBLE PRECISION,
ADD COLUMN     "basePostalCode" TEXT,
ADD COLUMN     "serviceAreaJson" JSONB;
