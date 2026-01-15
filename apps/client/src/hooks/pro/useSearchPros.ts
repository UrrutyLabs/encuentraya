import { trpc } from "@/lib/trpc/client";
import { Category } from "@repo/domain";

interface SearchFilters {
  category?: Category;
  date?: string;
  time?: string;
}

export function useSearchPros(filters: SearchFilters) {
  const { data: pros, isLoading, error } = trpc.client.searchPros.useQuery(
    {
      category: filters.category,
      date: filters.date ? new Date(filters.date) : undefined,
      time: filters.time,
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
