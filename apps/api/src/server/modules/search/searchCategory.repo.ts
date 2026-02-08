import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";

/**
 * Resolved category/subcategory from a text query (for pro search)
 */
export interface ResolvedQuery {
  categoryId: string;
  subcategorySlug?: string;
}

/**
 * Category row from FTS/trigram search
 */
interface CategorySearchRow {
  id: string;
  name: string;
  slug: string;
}

/**
 * Subcategory row from FTS/trigram search (with category name and slug for URL)
 */
interface SubcategorySearchRow {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

/**
 * Build a prefix tsquery string for partial-word FTS (e.g. "desatas" -> "desatas:*").
 * Sanitizes tokens so only safe lexeme characters remain; joins with &.
 */
function buildPrefixTsQuery(q: string): string {
  const tokens = q
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[&|!():*\\]/g, "").replace(/\s/g, ""))
    .filter((w) => w.length > 0);
  if (tokens.length === 0) return "";
  return tokens.map((t) => `${t}:*`).join(" & ");
}

/**
 * Repository for category/subcategory full-text and trigram search.
 * Uses stored "fts" (with weights) and "searchable_text" (trigram) columns.
 */
@injectable()
export class SearchCategoryRepository {
  private readonly DEFAULT_LIMIT = 10;
  private readonly MIN_QUERY_LENGTH = 1;

  /**
   * Resolve a free-text query to a single best match: either a subcategory
   * (categoryId + subcategorySlug) or a category (categoryId only).
   * Prefers subcategory match when available.
   * Matches via: FTS (plain + prefix), trigram on full searchable text. Rank combines both.
   */
  async resolveQuery(q: string): Promise<ResolvedQuery | null> {
    const trimmed = q.trim();
    if (trimmed.length < this.MIN_QUERY_LENGTH) return null;
    const prefixQuery = buildPrefixTsQuery(trimmed);

    // Subcategories: FTS (plain + prefix) OR trigram on searchable_text; combined ranking
    const [subSql, subParam] = buildSubcategoryQuery(trimmed, prefixQuery, 1);
    const subcategories = await prisma.$queryRawUnsafe<SubcategorySearchRow[]>(
      subSql,
      subParam
    );
    if (subcategories.length > 0) {
      return {
        categoryId: subcategories[0].categoryId,
        subcategorySlug: subcategories[0].slug,
      };
    }

    const [catSql, catParam] = buildCategoryQuery(trimmed, prefixQuery, 1);
    const categories = await prisma.$queryRawUnsafe<CategorySearchRow[]>(
      catSql,
      catParam
    );
    if (categories.length > 0) {
      return { categoryId: categories[0].id };
    }

    return null;
  }

  /**
   * Search categories and subcategories for typeahead suggestions.
   * Same matching and ranking as resolveQuery.
   */
  async searchCategoriesAndSubcategories(
    q: string,
    limit: number = this.DEFAULT_LIMIT
  ): Promise<{
    categories: CategorySearchRow[];
    subcategories: SubcategorySearchRow[];
  }> {
    const trimmed = q.trim();
    if (trimmed.length < this.MIN_QUERY_LENGTH) {
      return { categories: [], subcategories: [] };
    }
    const prefixQuery = buildPrefixTsQuery(trimmed);
    const cap = Math.min(limit, 20);
    const half = Math.max(1, Math.floor(cap / 2));

    const [catSql, catParam] = buildCategoryQuery(trimmed, prefixQuery, half);
    const [subSql, subParam] = buildSubcategoryQuery(trimmed, prefixQuery, cap);
    const [categories, subcategories] = await Promise.all([
      prisma.$queryRawUnsafe<CategorySearchRow[]>(catSql, catParam),
      prisma.$queryRawUnsafe<SubcategorySearchRow[]>(subSql, subParam),
    ]);

    return { categories, subcategories };
  }
}

function subcategoryWhereClause(trimmed: string, prefixQuery: string): string {
  const prefixCond =
    prefixQuery.length > 0
      ? `OR s."fts" @@ to_tsquery('spanish', '${prefixQuery.replace(/'/g, "''")}')`
      : "";
  return `s."isActive" = true
    AND (
      s."fts" @@ plainto_tsquery('spanish', $1)
      ${prefixCond}
      OR s."searchable_text" % $1
    )`;
}

function categoryWhereClause(trimmed: string, prefixQuery: string): string {
  const prefixCond =
    prefixQuery.length > 0
      ? `OR "fts" @@ to_tsquery('spanish', '${prefixQuery.replace(/'/g, "''")}')`
      : "";
  return `"deletedAt" IS NULL AND "isActive" = true
    AND (
      "fts" @@ plainto_tsquery('spanish', $1)
      ${prefixCond}
      OR "searchable_text" % $1
    )`;
}

function buildSubcategoryQuery(
  trimmed: string,
  prefixQuery: string,
  limit: number
): [string, string] {
  const where = subcategoryWhereClause(trimmed, prefixQuery);
  const order =
    prefixQuery.length > 0
      ? `( COALESCE(ts_rank(s."fts", plainto_tsquery('spanish', $1)), 0) * 2 + COALESCE(ts_rank(s."fts", to_tsquery('spanish', '${prefixQuery.replace(/'/g, "''")}')), 0) * 2 + COALESCE(similarity(s."searchable_text", $1), 0) ) DESC`
      : `( COALESCE(ts_rank(s."fts", plainto_tsquery('spanish', $1)), 0) * 2 + COALESCE(similarity(s."searchable_text", $1), 0) ) DESC`;
  const sql = `
    SELECT s.id, s.name, s.slug, s."categoryId", c.name AS "categoryName", c.slug AS "categorySlug"
    FROM "subcategories" s
    INNER JOIN "categories" c ON c.id = s."categoryId" AND c."deletedAt" IS NULL AND c."isActive" = true
    WHERE ${where}
    ORDER BY ${order}
    LIMIT ${limit}
  `;
  return [sql.trim(), trimmed];
}

function buildCategoryQuery(
  trimmed: string,
  prefixQuery: string,
  limit: number
): [string, string] {
  const where = categoryWhereClause(trimmed, prefixQuery);
  const order =
    prefixQuery.length > 0
      ? `( COALESCE(ts_rank("fts", plainto_tsquery('spanish', $1)), 0) * 2 + COALESCE(ts_rank("fts", to_tsquery('spanish', '${prefixQuery.replace(/'/g, "''")}')), 0) * 2 + COALESCE(similarity("searchable_text", $1), 0) ) DESC`
      : `( COALESCE(ts_rank("fts", plainto_tsquery('spanish', $1)), 0) * 2 + COALESCE(similarity("searchable_text", $1), 0) ) DESC`;
  const sql = `
    SELECT id, name, slug
    FROM "categories"
    WHERE ${where}
    ORDER BY ${order}
    LIMIT ${limit}
  `;
  return [sql.trim(), trimmed];
}
