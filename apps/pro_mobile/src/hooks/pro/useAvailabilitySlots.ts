import { useState } from "react";
import { trpc } from "@lib/trpc/client";
import { useQueryClient } from "../shared/useQueryClient";
import type { AvailabilitySlot, AvailabilitySlotInput } from "@repo/domain";

interface UseAvailabilitySlotsReturn {
  slots: AvailabilitySlot[];
  isLoading: boolean;
  error: string | null;
  updateSlots: (slots: AvailabilitySlotInput[]) => Promise<void>;
  isSaving: boolean;
}

/**
 * Hook to manage pro availability slots.
 * Fetches current availability slots and provides update function.
 * Uses optimistic updates for instant UI feedback.
 */
export function useAvailabilitySlots(): UseAvailabilitySlotsReturn {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch availability slots
  const { data: slots = [], isLoading } =
    trpc.pro.getAvailabilitySlots.useQuery(undefined, {
      retry: false,
      refetchOnWindowFocus: false,
    });

  const updateSlotsMutation = trpc.pro.updateAvailabilitySlots.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [["pro", "getAvailabilitySlots"]],
      });
      await queryClient.cancelQueries({ queryKey: [["pro", "getMyProfile"]] });

      // Snapshot previous value
      const previousSlots = slots;

      // Optimistically update slots
      // Create temporary IDs for new slots (they'll be replaced by server response)
      const optimisticSlots: AvailabilitySlot[] = variables.slots.map(
        (slot, index) => ({
          id: `temp-${index}`,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      queryClient.setQueryData(
        [["pro", "getAvailabilitySlots"]],
        optimisticSlots
      );

      // Also optimistically update isAvailable in pro profile
      const pro = queryClient.getQueryData([["pro", "getMyProfile"]]);
      if (pro) {
        queryClient.setQueryData([["pro", "getMyProfile"]], {
          ...pro,
          isAvailable: variables.slots.length > 0,
        });
      }

      return { previousSlots, previousPro: pro };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSlots) {
        queryClient.setQueryData(
          [["pro", "getAvailabilitySlots"]],
          context.previousSlots
        );
      }
      if (context?.previousPro) {
        queryClient.setQueryData(
          [["pro", "getMyProfile"]],
          context.previousPro
        );
      }
      setError(err.message || "Error al actualizar disponibilidad");
    },
    onSuccess: (data) => {
      setError(null);
      // Update with server response
      queryClient.setQueryData([["pro", "getAvailabilitySlots"]], data);
      // Invalidate pro profile to refetch isAvailable
      queryClient.invalidateQueries({ queryKey: [["pro", "getMyProfile"]] });
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure consistency
      queryClient.invalidateQueries({
        queryKey: [["pro", "getAvailabilitySlots"]],
      });
      queryClient.invalidateQueries({ queryKey: [["pro", "getMyProfile"]] });
    },
  });

  const updateSlots = async (newSlots: AvailabilitySlotInput[]) => {
    setError(null);
    try {
      await updateSlotsMutation.mutateAsync({ slots: newSlots });
    } catch (err) {
      // Error handled by mutation
      throw err;
    }
  };

  return {
    slots,
    isLoading,
    error,
    updateSlots,
    isSaving: updateSlotsMutation.isPending,
  };
}
