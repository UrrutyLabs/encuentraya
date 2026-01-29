/*
  Warnings:

  - You are about to drop the column `category` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `categories` on the `pro_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `subcategories` table. All the data in the column will be lost.
  - You are about to drop the `category_metadata` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[categoryId,slug]` on the table `subcategories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryId,key]` on the table `subcategories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "category_metadata" DROP CONSTRAINT "category_metadata_categoryId_fkey";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "category";

-- AlterTable
ALTER TABLE "pro_profiles" DROP COLUMN "categories";

-- AlterTable
ALTER TABLE "subcategories" DROP COLUMN "category";

-- DropTable
DROP TABLE "category_metadata";

-- DropEnum
DROP TYPE "Category";

-- CreateIndex: Drop existing partial indexes first if they exist (from previous migration)
-- These were created with WHERE clauses, but Prisma wants full unique constraints
DROP INDEX IF EXISTS "subcategories_categoryId_slug_key";
DROP INDEX IF EXISTS "subcategories_categoryId_key_key";

-- CreateIndex: Create unique constraints
-- PostgreSQL allows multiple NULLs in unique constraints, so this works with nullable categoryId
-- Note: After dropping above, these will be created fresh
CREATE UNIQUE INDEX "subcategories_categoryId_slug_key" ON "subcategories"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "subcategories_categoryId_key_key" ON "subcategories"("categoryId", "key");
