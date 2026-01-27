-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "subcategoryId" TEXT;

-- CreateTable
CREATE TABLE "category_metadata" (
    "id" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "displayName" TEXT NOT NULL,
    "iconName" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subcategories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_metadata_category_key" ON "category_metadata"("category");

-- CreateIndex
CREATE INDEX "category_metadata_category_idx" ON "category_metadata"("category");

-- CreateIndex
CREATE INDEX "category_metadata_isActive_idx" ON "category_metadata"("isActive");

-- CreateIndex
CREATE INDEX "subcategories_category_idx" ON "subcategories"("category");

-- CreateIndex
CREATE INDEX "subcategories_slug_idx" ON "subcategories"("slug");

-- CreateIndex
CREATE INDEX "subcategories_isActive_idx" ON "subcategories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_slug_category_key" ON "subcategories"("slug", "category");

-- CreateIndex
CREATE INDEX "bookings_subcategoryId_idx" ON "bookings"("subcategoryId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
