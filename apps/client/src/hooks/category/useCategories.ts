import { trpc } from "@/lib/trpc/client";

/**
 * Hook to fetch all active categories
 * Returns categories sorted by sortOrder, excluding soft-deleted ones
 */
export function useCategories() {
  const {
    data: categories,
    isLoading,
    error,
  } = trpc.category.getAll.useQuery(
    { includeDeleted: false },
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes (categories don't change often)
    }
  );

  return {
    categories: categories ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(categoryId?: string) {
  const {
    data: category,
    isLoading,
    error,
  } = trpc.category.getById.useQuery(
    { id: categoryId!, includeDeleted: false },
    {
      enabled: !!categoryId,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  return {
    category: category ?? null,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch a single category by slug (e.g., "plumbing")
 * Useful for URL-based category selection
 */
export function useCategoryBySlug(slug?: string) {
  const {
    data: category,
    isLoading,
    error,
  } = trpc.category.getBySlug.useQuery(
    { slug: slug!, includeDeleted: false },
    {
      enabled: !!slug,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  return {
    category: category ?? null,
    isLoading,
    error,
  };
}
