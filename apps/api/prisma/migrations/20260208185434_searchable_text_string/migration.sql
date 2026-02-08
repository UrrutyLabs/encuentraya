-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "searchable_text" DROP NOT NULL;

-- AlterTable
ALTER TABLE "subcategories" ALTER COLUMN "searchable_text" DROP NOT NULL;
