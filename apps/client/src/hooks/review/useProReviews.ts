import { useMemo } from "react";
import { trpc } from "@/lib/trpc/client";

/**
 * Hook to fetch paginated reviews for a pro profile
 * Uses infinite query for cursor-based pagination
 */
export function useProReviews(proId: string | undefined, limit: number = 20) {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.review.listForPro.useInfiniteQuery(
    {
      proId: proId!,
      limit,
    },
    {
      enabled: !!proId,
      retry: false,
      refetchOnWindowFocus: false,
      getNextPageParam: (lastPage) => {
        // Use the last review's id as the cursor for the next page
        if (lastPage.length === 0 || lastPage.length < limit) {
          return undefined; // No more pages
        }
        return lastPage[lastPage.length - 1]?.id;
      },
    }
  );

  // Flatten all pages into a single array of reviews
  const reviews = useMemo(() => {
    if (!data) return [];
    return data.pages.flat();
  }, [data]);

  return {
    reviews,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}
