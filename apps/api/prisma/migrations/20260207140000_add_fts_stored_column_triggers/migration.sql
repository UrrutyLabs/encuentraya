-- Option A: FTS via stored tsvector column + trigger (avoids IMMUTABLE index expression issues).
-- Index is on the column only, so no functions in index expression.

-- ========== Categories ==========
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "fts" tsvector;

UPDATE "categories"
SET "fts" = to_tsvector('spanish', "name" || ' ' || COALESCE("description", ''))
WHERE "fts" IS NULL;

CREATE OR REPLACE FUNCTION categories_fts_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."fts" := to_tsvector('spanish', NEW."name" || ' ' || COALESCE(NEW."description", ''));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS categories_fts_trigger ON "categories";
CREATE TRIGGER categories_fts_trigger
  BEFORE INSERT OR UPDATE ON "categories"
  FOR EACH ROW
  EXECUTE PROCEDURE categories_fts_trigger();

CREATE INDEX IF NOT EXISTS idx_categories_fts ON "categories" USING gin("fts");

-- ========== Subcategories ==========
ALTER TABLE "subcategories" ADD COLUMN IF NOT EXISTS "fts" tsvector;

UPDATE "subcategories"
SET "fts" = to_tsvector(
  'spanish',
  "name" || ' ' || COALESCE("description", '') || ' ' || COALESCE(array_to_string("searchKeywords", ' '), '')
)
WHERE "fts" IS NULL;

CREATE OR REPLACE FUNCTION subcategories_fts_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."fts" := to_tsvector(
    'spanish',
    NEW."name" || ' ' || COALESCE(NEW."description", '') || ' ' || COALESCE(array_to_string(NEW."searchKeywords", ' '), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS subcategories_fts_trigger ON "subcategories";
CREATE TRIGGER subcategories_fts_trigger
  BEFORE INSERT OR UPDATE ON "subcategories"
  FOR EACH ROW
  EXECUTE PROCEDURE subcategories_fts_trigger();

CREATE INDEX IF NOT EXISTS idx_subcategories_fts ON "subcategories" USING gin("fts");
