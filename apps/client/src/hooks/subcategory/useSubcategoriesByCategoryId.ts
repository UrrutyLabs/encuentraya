import { trpc } from "@/lib/trpc/client";
import type { Subcategory } from "@repo/domain";

/**
 * Hook to fetch subcategories by categoryId
 * Returns active subcategories for the given category, sorted by displayOrder
 */
export function useSubcategoriesByCategoryId(categoryId?: string) {
  const {
    data: subcategories,
    isLoading,
    error,
  } = trpc.subcategory.getByCategoryId.useQuery(
    { categoryId: categoryId! },
    {
      enabled: !!categoryId,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes (subcategories don't change often)
    }
  );

  return {
    subcategories: subcategories ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook to fetch a single subcategory by slug and categoryId
 * Useful for URL-based subcategory selection
 */
export function useSubcategoryBySlugAndCategoryId(
  slug?: string,
  categoryId?: string
) {
  const {
    data: subcategory,
    isLoading,
    error,
  } = trpc.subcategory.getBySlugAndCategoryId.useQuery(
    { slug: slug!, categoryId: categoryId! },
    {
      enabled: !!slug && !!categoryId,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  return {
    subcategory: subcategory ?? null,
    isLoading,
    error,
  };
}
