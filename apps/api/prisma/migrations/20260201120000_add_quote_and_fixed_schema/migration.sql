-- CreateEnum: PaymentStrategy (quote and fixed flow)
CREATE TYPE "PaymentStrategy" AS ENUM ('single_capture');

-- AlterEnum: Add 'fixed' to PricingMode
ALTER TYPE "PricingMode" ADD VALUE 'fixed';

-- AlterTable: Category - add pricingMode and paymentStrategy
ALTER TABLE "categories" ADD COLUMN "pricingMode" "PricingMode" NOT NULL DEFAULT 'hourly';
ALTER TABLE "categories" ADD COLUMN "paymentStrategy" "PaymentStrategy" NOT NULL DEFAULT 'single_capture';

-- AlterTable: Order - add quote fields and make estimatedHours nullable
ALTER TABLE "orders" ADD COLUMN "quotedAmountCents" INTEGER;
ALTER TABLE "orders" ADD COLUMN "quotedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "quoteMessage" TEXT;
ALTER TABLE "orders" ADD COLUMN "quoteAcceptedAt" TIMESTAMP(3);
ALTER TABLE "orders" ALTER COLUMN "estimatedHours" DROP NOT NULL;

-- AlterTable: ProProfileCategory - add rate fields
ALTER TABLE "pro_profile_categories" ADD COLUMN "hourlyRateCents" INTEGER;
ALTER TABLE "pro_profile_categories" ADD COLUMN "startingFromCents" INTEGER;
