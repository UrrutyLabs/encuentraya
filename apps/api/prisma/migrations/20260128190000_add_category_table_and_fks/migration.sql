-- CreateTable: Category table (data-driven categories with soft delete)
-- Replaces CategoryMetadata - all fields migrated from category_metadata table
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconName" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "configJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Partial unique index on key (only for non-deleted categories)
-- This allows multiple soft-deleted categories with same key, but unique active ones
CREATE UNIQUE INDEX "categories_key_unique" ON "categories"("key") WHERE "deletedAt" IS NULL;

-- CreateIndex: Partial unique index on slug (only for non-deleted categories)
CREATE UNIQUE INDEX "categories_slug_unique" ON "categories"("slug") WHERE "deletedAt" IS NULL;

-- CreateIndex: For querying active categories sorted
CREATE INDEX "categories_isActive_sortOrder_idx" ON "categories"("isActive", "sortOrder");

-- CreateIndex: For soft delete queries
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

-- AlterTable: Update Subcategory table - remove enum field, add FK and new fields
-- First, add new fields
ALTER TABLE "subcategories" ADD COLUMN     "categoryId" TEXT;
ALTER TABLE "subcategories" ADD COLUMN     "key" TEXT;
ALTER TABLE "subcategories" ADD COLUMN     "configJson" JSONB;
ALTER TABLE "subcategories" ADD COLUMN     "searchKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Drop old unique constraint on slug + category enum
DROP INDEX IF EXISTS "subcategories_slug_category_key";

-- Drop old index on category enum
DROP INDEX IF EXISTS "subcategories_category_idx";

-- CreateIndex: For categoryId FK lookups
CREATE INDEX "subcategories_categoryId_idx" ON "subcategories"("categoryId");

-- CreateIndex: Composite index for categoryId + isActive + displayOrder
CREATE INDEX "subcategories_categoryId_isActive_displayOrder_idx" ON "subcategories"("categoryId", "isActive", "displayOrder");

-- CreateIndex: Unique constraint for categoryId + slug
CREATE UNIQUE INDEX "subcategories_categoryId_slug_key" ON "subcategories"("categoryId", "slug") WHERE "categoryId" IS NOT NULL;

-- CreateIndex: Unique constraint for categoryId + key (when both are set)
CREATE UNIQUE INDEX "subcategories_categoryId_key_key" ON "subcategories"("categoryId", "key") WHERE "categoryId" IS NOT NULL AND "key" IS NOT NULL;

-- AddForeignKey: Subcategory.categoryId → Category.id
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Update Order table - remove enum field, add FK and metadata
-- First, add new fields
ALTER TABLE "orders" ADD COLUMN     "categoryId" TEXT;
ALTER TABLE "orders" ADD COLUMN     "categoryMetadataJson" JSONB;

-- Drop old index on category enum
DROP INDEX IF EXISTS "orders_category_idx";

-- CreateIndex: For categoryId FK lookups
CREATE INDEX "orders_categoryId_idx" ON "orders"("categoryId");

-- CreateIndex: Composite index for categoryId + subcategoryId (common query pattern)
CREATE INDEX "orders_categoryId_subcategoryId_idx" ON "orders"("categoryId", "subcategoryId");

-- AddForeignKey: Order.categoryId → Category.id
ALTER TABLE "orders" ADD CONSTRAINT "orders_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Update CategoryMetadata - change category enum to categoryId FK
ALTER TABLE "category_metadata" ADD COLUMN "categoryId" TEXT;
ALTER TABLE "category_metadata" DROP CONSTRAINT IF EXISTS "category_metadata_category_key";
DROP INDEX IF EXISTS "category_metadata_category_key";
DROP INDEX IF EXISTS "category_metadata_category_idx";

-- CreateIndex: For categoryId FK lookups
CREATE UNIQUE INDEX "category_metadata_categoryId_key" ON "category_metadata"("categoryId");
CREATE INDEX "category_metadata_categoryId_idx" ON "category_metadata"("categoryId");

-- AddForeignKey: CategoryMetadata.categoryId → Category.id
ALTER TABLE "category_metadata" ADD CONSTRAINT "category_metadata_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Remove category enum column from subcategories (after migration)
-- Note: This will be done in data migration after populating categoryId
-- ALTER TABLE "subcategories" DROP COLUMN "category";

-- AlterTable: Remove category enum column from orders (after migration)
-- Note: This will be done in data migration after populating categoryId
-- ALTER TABLE "orders" DROP COLUMN "category";

-- AlterTable: Remove categories enum array from pro_profiles (after migration)
-- Note: This will be done in data migration after populating junction table
-- ALTER TABLE "pro_profiles" DROP COLUMN "categories";

-- CreateTable: ProProfileCategory junction table
CREATE TABLE "pro_profile_categories" (
    "id" TEXT NOT NULL,
    "proProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pro_profile_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint for proProfileId + categoryId
CREATE UNIQUE INDEX "pro_profile_categories_proProfileId_categoryId_key" ON "pro_profile_categories"("proProfileId", "categoryId");

-- CreateIndex: For categoryId lookups (find all pros in a category)
CREATE INDEX "pro_profile_categories_categoryId_idx" ON "pro_profile_categories"("categoryId");

-- CreateIndex: For proProfileId lookups (find all categories for a pro)
CREATE INDEX "pro_profile_categories_proProfileId_idx" ON "pro_profile_categories"("proProfileId");

-- AddForeignKey: ProProfileCategory.proProfileId → ProProfile.id
ALTER TABLE "pro_profile_categories" ADD CONSTRAINT "pro_profile_categories_proProfileId_fkey" FOREIGN KEY ("proProfileId") REFERENCES "pro_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ProProfileCategory.categoryId → Category.id
ALTER TABLE "pro_profile_categories" ADD CONSTRAINT "pro_profile_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
