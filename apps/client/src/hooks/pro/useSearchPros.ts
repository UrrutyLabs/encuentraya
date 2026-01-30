import { trpc } from "@/lib/trpc/client";
import type { TimeWindow } from "@repo/domain";

interface SearchFilters {
  categoryId?: string; // FK to Category table
  subcategory?: string; // Subcategory slug (for future API support)
  date?: string;
  timeWindow?: TimeWindow;
  searchQuery?: string; // For future API support, currently not used
}

export function useSearchPros(filters: SearchFilters) {
  const {
    data: pros,
    isLoading,
    error,
  } = trpc.clientSearch.searchPros.useQuery(
    {
      categoryId: filters.categoryId,
      subcategory: filters.subcategory,
      date: filters.date ? new Date(filters.date) : undefined,
      timeWindow: filters.timeWindow,
      // Note: searchQuery is not yet supported by API
      // It's included in the interface for future use
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return {
    pros: pros ?? [],
    isLoading,
    error,
  };
}
