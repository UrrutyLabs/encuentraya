import { trpc } from "@/lib/trpc/client";

/**
 * Hook to get all categories
 * @param includeDeleted - Whether to include soft-deleted categories (default: false)
 */
export function useCategories(options?: { includeDeleted?: boolean }) {
  return trpc.category.getAll.useQuery(
    {
      includeDeleted: options?.includeDeleted ?? false,
    },
    {
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to get a category by ID
 * @param id - Category ID
 * @param includeDeleted - Whether to include soft-deleted categories (default: false)
 */
export function useCategory(
  id: string,
  options?: { includeDeleted?: boolean }
) {
  return trpc.category.getById.useQuery(
    {
      id,
      includeDeleted: options?.includeDeleted ?? false,
    },
    {
      enabled: !!id,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to get a category by key
 * @param key - Category key (e.g., "PLUMBING")
 * @param includeDeleted - Whether to include soft-deleted categories (default: false)
 */
export function useCategoryByKey(
  key: string,
  options?: { includeDeleted?: boolean }
) {
  return trpc.category.getByKey.useQuery(
    {
      key,
      includeDeleted: options?.includeDeleted ?? false,
    },
    {
      enabled: !!key,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to get a category by slug
 * @param slug - Category slug (e.g., "plumbing")
 * @param includeDeleted - Whether to include soft-deleted categories (default: false)
 */
export function useCategoryBySlug(
  slug: string,
  options?: { includeDeleted?: boolean }
) {
  return trpc.category.getBySlug.useQuery(
    {
      slug,
      includeDeleted: options?.includeDeleted ?? false,
    },
    {
      enabled: !!slug,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }
  );
}
