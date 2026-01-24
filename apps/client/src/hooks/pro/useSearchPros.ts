import { trpc } from "@/lib/trpc/client";
import { Category, type TimeWindow } from "@repo/domain";

interface SearchFilters {
  category?: Category;
  date?: string;
  timeWindow?: TimeWindow;
}

export function useSearchPros(filters: SearchFilters) {
  const {
    data: pros,
    isLoading,
    error,
  } = trpc.client.searchPros.useQuery(
    {
      category: filters.category,
      date: filters.date ? new Date(filters.date) : undefined,
      timeWindow: filters.timeWindow,
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
