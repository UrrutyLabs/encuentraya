import { trpc } from "@/lib/trpc/client";
import type { TimeWindow } from "@repo/domain";

export interface SearchFilters {
  categoryId?: string; // FK to Category table
  subcategory?: string; // Subcategory slug
  q?: string; // Free-text query; resolved server-side to category/subcategory
  date?: string;
  timeWindow?: TimeWindow;
  /** Full address for geocoding; enables radius filter and distance sort */
  location?: string;
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
      q: filters.q,
      date: filters.date ? new Date(filters.date) : undefined,
      timeWindow: filters.timeWindow,
      location: filters.location?.trim() || undefined,
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
