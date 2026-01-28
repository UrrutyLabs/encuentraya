-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_bookingId_fkey";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_bookingId_fkey";
ALTER TABLE "earnings" DROP CONSTRAINT IF EXISTS "earnings_bookingId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "reviews_bookingId_key";
DROP INDEX IF EXISTS "reviews_bookingId_idx";
DROP INDEX IF EXISTS "payments_bookingId_key";
DROP INDEX IF EXISTS "payments_bookingId_idx";
DROP INDEX IF EXISTS "earnings_bookingId_key";

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN IF EXISTS "bookingId";
ALTER TABLE "reviews" ADD COLUMN "orderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN IF EXISTS "bookingId";
ALTER TABLE "payments" ADD COLUMN "orderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "earnings" DROP COLUMN IF EXISTS "bookingId";
ALTER TABLE "earnings" ADD COLUMN "orderId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderId_key" ON "reviews"("orderId");
CREATE INDEX "reviews_orderId_idx" ON "reviews"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "earnings_orderId_key" ON "earnings"("orderId");
CREATE INDEX "earnings_orderId_idx" ON "earnings"("orderId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
