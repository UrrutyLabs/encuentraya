import { trpc } from "@/lib/trpc/client";

export interface EstimateOrderCostInput {
  proProfileId: string;
  estimatedHours: number;
  categoryId?: string;
}

/**
 * Hook to estimate order cost before creation
 * Returns breakdown of labor, platform fee, tax, and totals
 */
export function useEstimateOrderCost(input: EstimateOrderCostInput | null) {
  const estimateQuery = trpc.order.estimateCost.useQuery(
    input || { proProfileId: "", estimatedHours: 0 },
    {
      enabled: !!(
        input?.proProfileId &&
        input?.estimatedHours &&
        input.estimatedHours > 0
      ),
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  return {
    data: estimateQuery.data,
    isLoading: estimateQuery.isLoading,
    error: estimateQuery.error,
    isError: estimateQuery.isError,
  };
}
