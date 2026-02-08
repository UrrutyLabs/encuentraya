/*
  Warnings:

  - You are about to alter the column `searchable_text` on the `categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Unsupported("text")`.
  - You are about to alter the column `searchable_text` on the `subcategories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Unsupported("text")`.
  - Made the column `searchable_text` on table `categories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `searchable_text` on table `subcategories` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "searchable_text" SET NOT NULL,
ALTER COLUMN "searchable_text" SET DATA TYPE text;

-- AlterTable
ALTER TABLE "subcategories" ALTER COLUMN "searchable_text" SET NOT NULL,
ALTER COLUMN "searchable_text" SET DATA TYPE text;
