import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../shared/useQueryClient";

interface UseAvailabilityReturn {
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  toggleAvailability: () => Promise<void>;
  isSaving: boolean;
}

/**
 * Hook to manage pro availability state.
 * Fetches current availability and provides toggle function.
 * Uses optimistic updates for instant UI feedback.
 */
export function useAvailability(): UseAvailabilityReturn {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch pro profile to get current availability state
  const { data: pro, isLoading } = trpc.pro.getMyProfile.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const setAvailabilityMutation = trpc.pro.setAvailability.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [["pro", "getMyProfile"]] });

      // Snapshot previous value
      const previousPro = pro;

      // Optimistically update the isAvailable field
      // The backend computes isAvailable from the Availability array (has slots = available)
      if (previousPro && variables.isAvailable !== undefined) {
        queryClient.setQueryData([["pro", "getMyProfile"]], {
          ...previousPro,
          isAvailable: variables.isAvailable,
        });
      }
      
      return { previousPro };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPro) {
        queryClient.setQueryData([["pro", "getMyProfile"]], context.previousPro);
      }
      setError(err.message || "Error al actualizar disponibilidad");
    },
    onSuccess: () => {
      setError(null);
      // Invalidate to refetch the latest data and ensure consistency
      queryClient.invalidateQueries({ queryKey: [["pro", "getMyProfile"]] });
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure consistency
      queryClient.invalidateQueries({ queryKey: [["pro", "getMyProfile"]] });
    },
  });

  // Get availability from pro profile
  // The backend computes isAvailable from the Availability array (has slots = available)
  const isAvailable = pro?.isAvailable ?? false;

  const toggleAvailability = async () => {
    const newAvailability = !isAvailable;
    setError(null);
    
    try {
      await setAvailabilityMutation.mutateAsync({
        isAvailable: newAvailability,
      });
    } catch (err) {
      // Error handled by mutation
      throw err;
    }
  };

  return {
    isAvailable,
    isLoading,
    error,
    toggleAvailability,
    isSaving: setAvailabilityMutation.isPending,
  };
}
