import { useState } from "react";
import { trpc } from "../lib/trpc/client";

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
 */
export function useAvailability(): UseAvailabilityReturn {
  const [error, setError] = useState<string | null>(null);

  // Fetch pro profile to get current availability state
  const { data: pro, isLoading, refetch } = trpc.pro.getMyProfile.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const setAvailabilityMutation = trpc.pro.setAvailability.useMutation({
    onSuccess: () => {
      setError(null);
      // Refetch pro profile after updating availability
      refetch();
    },
    onError: (err) => {
      setError(err.message || "Error al actualizar disponibilidad");
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
