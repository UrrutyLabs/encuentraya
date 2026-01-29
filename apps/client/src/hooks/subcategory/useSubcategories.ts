import { trpc } from "@/lib/trpc/client";

/**
 * Hook to fetch all subcategories
 * Returns all active subcategories from the database
 */
export function useAllSubcategories() {
  const {
    data: subcategories,
    isLoading,
    error,
  } = trpc.subcategory.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  return {
    subcategories: subcategories ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook to fetch a single subcategory by ID
 * Useful when you have a subcategory ID and need the full subcategory object
 */
export function useSubcategoryById(id?: string) {
  const {
    data: subcategory,
    isLoading,
    error,
  } = trpc.subcategory.getById.useQuery(
    { id: id! },
    {
      enabled: !!id,
      refetchOnWindowFocus: false,
    }
  );

  return {
    subcategory: subcategory ?? null,
    isLoading,
    error,
  };
}
