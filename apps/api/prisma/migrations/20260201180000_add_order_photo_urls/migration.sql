-- AlterTable: Order - add photo URLs (wizard and work proof)
ALTER TABLE "orders" ADD COLUMN "photoUrlsJson" JSONB;
ALTER TABLE "orders" ADD COLUMN "workProofPhotoUrlsJson" JSONB;
