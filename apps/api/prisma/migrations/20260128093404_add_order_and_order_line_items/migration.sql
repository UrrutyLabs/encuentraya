-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('draft', 'pending_pro_confirmation', 'accepted', 'confirmed', 'in_progress', 'awaiting_client_approval', 'disputed', 'completed', 'paid', 'canceled');

-- CreateEnum
CREATE TYPE "OrderLineItemType" AS ENUM ('labor', 'platform_fee', 'tax', 'tip', 'discount', 'adjustment', 'cancellation_fee');

-- CreateEnum
CREATE TYPE "TaxBehavior" AS ENUM ('taxable', 'non_taxable', 'tax_included');

-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('hourly');

-- CreateEnum
CREATE TYPE "ApprovalMethod" AS ENUM ('client_accepted', 'auto_accepted', 'admin_adjusted');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('none', 'open', 'resolved', 'canceled');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "displayId" TEXT NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "proProfileId" TEXT,
    "category" "Category" NOT NULL,
    "subcategoryId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "addressText" TEXT NOT NULL,
    "addressLat" DOUBLE PRECISION,
    "addressLng" DOUBLE PRECISION,
    "scheduledWindowStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledWindowEndAt" TIMESTAMP(3),
    "status" "OrderStatus" NOT NULL DEFAULT 'pending_pro_confirmation',
    "acceptedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "pricingMode" "PricingMode" NOT NULL DEFAULT 'hourly',
    "hourlyRateSnapshotAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "minHoursSnapshot" DOUBLE PRECISION,
    "estimatedHours" DOUBLE PRECISION NOT NULL,
    "finalHoursSubmitted" DOUBLE PRECISION,
    "approvedHours" DOUBLE PRECISION,
    "approvalMethod" "ApprovalMethod",
    "approvalDeadlineAt" TIMESTAMP(3),
    "subtotalAmount" DOUBLE PRECISION,
    "platformFeeAmount" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "totalsCalculatedAt" TIMESTAMP(3),
    "taxScheme" TEXT DEFAULT 'iva',
    "taxRate" DOUBLE PRECISION,
    "taxIncluded" BOOLEAN NOT NULL DEFAULT false,
    "taxRegion" TEXT DEFAULT 'UY',
    "taxCalculatedAt" TIMESTAMP(3),
    "disputeStatus" "DisputeStatus" NOT NULL DEFAULT 'none',
    "disputeReason" TEXT,
    "disputeOpenedBy" TEXT,
    "isFirstBooking" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_line_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "OrderLineItemType" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitAmount" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UYU',
    "taxBehavior" "TaxBehavior",
    "taxRate" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_displayId_key" ON "orders"("displayId");

-- CreateIndex
CREATE INDEX "orders_clientUserId_idx" ON "orders"("clientUserId");

-- CreateIndex
CREATE INDEX "orders_proProfileId_idx" ON "orders"("proProfileId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_scheduledWindowStartAt_idx" ON "orders"("scheduledWindowStartAt");

-- CreateIndex
CREATE INDEX "orders_category_idx" ON "orders"("category");

-- CreateIndex
CREATE INDEX "orders_subcategoryId_idx" ON "orders"("subcategoryId");

-- CreateIndex
CREATE INDEX "orders_displayId_idx" ON "orders"("displayId");

-- CreateIndex
CREATE INDEX "order_line_items_orderId_idx" ON "order_line_items"("orderId");

-- CreateIndex
CREATE INDEX "order_line_items_type_idx" ON "order_line_items"("type");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_proProfileId_fkey" FOREIGN KEY ("proProfileId") REFERENCES "pro_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
