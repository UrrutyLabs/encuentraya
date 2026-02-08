-- Enable pg_trgm for trigram similarity and fuzzy matching.
-- FTS and trigram indexes are NOT created here: Prisma's shadow DB rejects
-- index expressions that use to_tsvector/gin_trgm_ops (not considered IMMUTABLE).
-- Run the optional script after migrate to add indexes on your real DB:
--   pnpm exec prisma db execute --file=./prisma/scripts/add-fts-trigram-indexes.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
