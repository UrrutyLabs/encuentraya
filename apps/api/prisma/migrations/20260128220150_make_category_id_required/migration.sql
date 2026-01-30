-- Make categoryId required (NOT NULL) for Subcategory and Order tables
-- Since the app starts from 0, we can safely make these columns NOT NULL

-- First, ensure all existing records have a categoryId (should be none, but safety check)
-- Delete any subcategories without a categoryId
DELETE FROM "subcategories" WHERE "categoryId" IS NULL;

-- Delete any orders without a categoryId
DELETE FROM "orders" WHERE "categoryId" IS NULL;

-- AlterTable: Make subcategories.categoryId NOT NULL
ALTER TABLE "subcategories" 
  ALTER COLUMN "categoryId" SET NOT NULL;

-- AlterTable: Make orders.categoryId NOT NULL
ALTER TABLE "orders" 
  ALTER COLUMN "categoryId" SET NOT NULL;
