import { trpc } from "@/lib/trpc/client";

/**
 * Hook to fetch pro details by ID
 * When categoryId is provided, API returns startingPriceForCategory for the hire column (category-level rate).
 */
export function useProDetail(
  proId: string | undefined,
  categoryId?: string | null
) {
  const {
    data: pro,
    isLoading,
    error,
  } = trpc.pro.getById.useQuery(
    { id: proId!, categoryId: categoryId ?? undefined },
    {
      enabled: !!proId,
      retry: false,
    }
  );

  return {
    pro,
    isLoading,
    error,
  };
}
