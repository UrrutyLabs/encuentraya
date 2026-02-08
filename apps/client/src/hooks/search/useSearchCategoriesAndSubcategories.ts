import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";
import type { CategorySuggestion, SubcategorySuggestion } from "@repo/domain";

export type SuggestionItem =
  | { type: "category"; slug: string; name: string }
  | { type: "subcategory"; slug: string; categorySlug: string; name: string };

/**
 * Hook to fetch category and subcategory suggestions for search typeahead.
 * Wraps tRPC clientSearch.searchCategoriesAndSubcategories.
 * Call with a debounced query (e.g. from useDebouncedValue) to avoid excessive requests.
 */
export function useSearchCategoriesAndSubcategories(query: string, limit = 10) {
  const { data, isFetching } =
    trpc.clientSearch.searchCategoriesAndSubcategories.useQuery(
      { q: query, limit },
      { enabled: query.length >= 1 }
    );

  const suggestionItems = useMemo((): SuggestionItem[] => {
    if (!data) return [];
    const cats: SuggestionItem[] = (data.categories ?? []).map(
      (c: CategorySuggestion) => ({
        type: "category",
        slug: c.slug,
        name: c.name,
      })
    );
    const subs: SuggestionItem[] = (data.subcategories ?? []).map(
      (s: SubcategorySuggestion) => ({
        type: "subcategory",
        slug: s.slug,
        categorySlug: s.categorySlug,
        name: s.name,
      })
    );
    return [...cats, ...subs];
  }, [data]);

  return { suggestionItems, isFetching };
}
