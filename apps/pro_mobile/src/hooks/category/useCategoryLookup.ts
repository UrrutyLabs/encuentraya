import { useMemo } from "react";
import { trpc } from "@lib/trpc/client";
import type { Category } from "@repo/domain";

/**
 * Hook to fetch all categories and provide a lookup function
 * Categories are cached by React Query with 7-day staleTime, so they won't refetch frequently
 * Prefetched on app startup for immediate availability
 */
export function useCategoryLookup() {
  const { data: categories = [], isLoading } = trpc.category.getAll.useQuery(
    undefined,
    {
      staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days - categories don't change frequently
      gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days - keep in cache for 7 days
      refetchOnMount: false, // Don't refetch if data exists (even if stale)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect (data is still valid)
    }
  );

  // Create a lookup map by category ID
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((category) => {
      map.set(category.id, category);
    });
    return map;
  }, [categories]);

  /**
   * Get category name by ID
   * Falls back to categoryId if category not found
   */
  const getCategoryName = useMemo(
    () =>
      (categoryId: string | undefined | null): string => {
        if (!categoryId) return "";
        const category = categoryMap.get(categoryId);
        return category?.name || categoryId;
      },
    [categoryMap]
  );

  return {
    categories,
    categoryMap,
    getCategoryName,
    isLoading,
  };
}
