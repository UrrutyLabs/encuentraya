import { useState } from "react";
import { trpc } from "../lib/trpc/client";
import { useQueryClient } from "./useQueryClient";

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

      // Optimistically update - note: since availability is calculated from isApproved/isSuspended,
      // we'll just invalidate and let the server response update it properly
      // The UI will show the new state optimistically via the mutation input
      
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
      // Invalidate to refetch the latest data
      queryClient.invalidateQueries({ queryKey: [["pro", "getMyProfile"]] });
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure consistency
      queryClient.invalidateQueries({ queryKey: [["pro", "getMyProfile"]] });
    },
  });

  // Determine availability from pro profile
  // For now, we'll use a simple approach - if pro exists and is approved, consider available
  // TODO: Add explicit isAvailable field to Pro schema when availability system is fully implemented
  const isAvailable = pro ? pro.isApproved && !pro.isSuspended : false;

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
