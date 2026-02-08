-- Search enhancements: searchable_text (trigram), FTS weights, keep triggers in sync.
-- pg_trgm already enabled in 20260207120000_add_fts_trigram_category_subcategory.

-- ========== Categories: searchable_text + FTS weights ==========
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "searchable_text" text;

UPDATE "categories"
SET "searchable_text" = "name" || ' ' || COALESCE("description", '')
WHERE "searchable_text" IS NULL;

CREATE OR REPLACE FUNCTION categories_fts_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."searchable_text" := NEW."name" || ' ' || COALESCE(NEW."description", '');
  NEW."fts" := setweight(to_tsvector('spanish', NEW."name"), 'A')
    || setweight(to_tsvector('spanish', COALESCE(NEW."description", '')), 'B');
  RETURN NEW;
END;
$$;

-- Backfill fts with weights for existing rows
UPDATE "categories"
SET "fts" = setweight(to_tsvector('spanish', "name"), 'A')
  || setweight(to_tsvector('spanish', COALESCE("description", '')), 'B')
WHERE "fts" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_searchable_text_gin ON "categories" USING gin ("searchable_text" gin_trgm_ops);

-- ========== Subcategories: searchable_text + FTS weights ==========
ALTER TABLE "subcategories" ADD COLUMN IF NOT EXISTS "searchable_text" text;

UPDATE "subcategories"
SET "searchable_text" = "name" || ' ' || COALESCE("description", '') || ' ' || COALESCE(array_to_string("searchKeywords", ' '), '')
WHERE "searchable_text" IS NULL;

CREATE OR REPLACE FUNCTION subcategories_fts_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."searchable_text" := NEW."name" || ' ' || COALESCE(NEW."description", '') || ' ' || COALESCE(array_to_string(NEW."searchKeywords", ' '), '');
  NEW."fts" := setweight(to_tsvector('spanish', NEW."name"), 'A')
    || setweight(to_tsvector('spanish', COALESCE(NEW."description", '') || ' ' || COALESCE(array_to_string(NEW."searchKeywords", ' '), '')), 'B');
  RETURN NEW;
END;
$$;

-- Backfill fts with weights for existing rows
UPDATE "subcategories"
SET "fts" = setweight(to_tsvector('spanish', "name"), 'A')
  || setweight(to_tsvector('spanish', COALESCE("description", '') || ' ' || COALESCE(array_to_string("searchKeywords", ' '), '')), 'B')
WHERE "fts" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subcategories_searchable_text_gin ON "subcategories" USING gin ("searchable_text" gin_trgm_ops);
