import { trpc } from "@/lib/trpc/client";

/**
 * Hook to fetch pro details by ID
 * Encapsulates the pro.getById query
 */
export function useProDetail(proId: string | undefined) {
  const {
    data: pro,
    isLoading,
    error,
  } = trpc.pro.getById.useQuery(
    { id: proId! },
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
