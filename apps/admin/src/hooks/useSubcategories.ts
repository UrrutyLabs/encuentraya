import { trpc } from "@/lib/trpc/client";

/**
 * Hook to get subcategories by category ID
 * @param categoryId - Category ID to filter subcategories
 */
export function useSubcategories(categoryId?: string) {
  return trpc.subcategory.getByCategoryId.useQuery(
    {
      categoryId: categoryId!,
    },
    {
      enabled: !!categoryId,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to get a subcategory by ID
 * @param id - Subcategory ID
 */
export function useSubcategory(id: string) {
  return trpc.subcategory.getById.useQuery(
    {
      id,
    },
    {
      enabled: !!id,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to get a subcategory by slug and category ID
 * @param slug - Subcategory slug
 * @param categoryId - Category ID
 */
export function useSubcategoryBySlugAndCategoryId(
  slug: string,
  categoryId: string
) {
  return trpc.subcategory.getBySlugAndCategoryId.useQuery(
    {
      slug,
      categoryId,
    },
    {
      enabled: !!slug && !!categoryId,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to get all subcategories (across all categories)
 */
export function useAllSubcategories() {
  return trpc.subcategory.getAll.useQuery(undefined, {
    // Cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
