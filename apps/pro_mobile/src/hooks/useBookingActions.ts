import { trpc } from "../lib/trpc/client";
import { useState } from "react";
import { useQueryClient } from "./useQueryClient";
import { BookingStatus } from "@repo/domain";
import type { Booking } from "@repo/domain";

interface UseBookingActionsReturn {
  acceptBooking: (bookingId: string) => Promise<void>;
  rejectBooking: (bookingId: string) => Promise<void>;
  markOnMyWay: (bookingId: string) => Promise<void>;
  arriveBooking: (bookingId: string) => Promise<void>;
  completeBooking: (bookingId: string) => Promise<void>;
  isAccepting: boolean;
  isRejecting: boolean;
  isMarkingOnMyWay: boolean;
  isArriving: boolean;
  isCompleting: boolean;
  error: string | null;
}

/**
 * Hook to encapsulate booking action mutations for pros.
 * Handles accept, reject, mark on my way, arrive, and complete actions.
 * Uses optimistic updates for instant UI feedback.
 */
export function useBookingActions(
  onSuccess?: () => void
): UseBookingActionsReturn {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Helper to create optimistic update for booking status changes
  const createBookingOptimisticUpdate = (newStatus: BookingStatus) => {
    return {
      onMutate: async (variables: { bookingId: string }) => {
        // Cancel outgoing refetches
        const bookingQueryKey: [string[], { id: string }] = [
          ["booking", "getById"],
          { id: variables.bookingId },
        ];
        await queryClient.cancelQueries({ queryKey: bookingQueryKey });
        await queryClient.cancelQueries({ queryKey: [["booking", "proInbox"]] });
        await queryClient.cancelQueries({ queryKey: [["booking", "proJobs"]] });

        // Snapshot previous values
        const previousBooking = queryClient.getQueryData<Booking>(bookingQueryKey);

        // Optimistically update booking status
        if (previousBooking) {
          queryClient.setQueryData<Booking>(bookingQueryKey, {
            ...previousBooking,
            status: newStatus,
          });
        }

        return { previousBooking };
      },
      onError: (
        err: Error,
        variables: { bookingId: string },
        context: { previousBooking?: Booking }
      ) => {
        // Rollback on error
        if (context?.previousBooking) {
          const bookingQueryKey: [string[], { id: string }] = [
            ["booking", "getById"],
            { id: variables.bookingId },
          ];
          queryClient.setQueryData<Booking>(bookingQueryKey, context.previousBooking);
        }
      },
      onSettled: (data: unknown, error: unknown, variables: { bookingId: string }) => {
        // Invalidate related queries after mutation settles
        const bookingQueryKey: [string[], { id: string }] = [
          ["booking", "getById"],
          { id: variables.bookingId },
        ];
        queryClient.invalidateQueries({ queryKey: bookingQueryKey });
        queryClient.invalidateQueries({ queryKey: [["booking", "proInbox"]] });
        queryClient.invalidateQueries({ queryKey: [["booking", "proJobs"]] });
      },
    };
  };

  const acceptMutation = trpc.booking.accept.useMutation({
    ...createBookingOptimisticUpdate(BookingStatus.ACCEPTED),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err) => {
      setError(err.message || "Error al aceptar la reserva");
    },
  });

  const rejectMutation = trpc.booking.reject.useMutation({
    ...createBookingOptimisticUpdate(BookingStatus.REJECTED),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err) => {
      setError(err.message || "Error al rechazar la reserva");
    },
  });

  const markOnMyWayMutation = trpc.booking.onMyWay.useMutation({
    ...createBookingOptimisticUpdate(BookingStatus.ON_MY_WAY),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err) => {
      setError(err.message || "Error al marcar como en camino");
    },
  });

  const arriveMutation = trpc.booking.arrive.useMutation({
    ...createBookingOptimisticUpdate(BookingStatus.ARRIVED),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err) => {
      setError(err.message || "Error al marcar como llegado");
    },
  });

  const completeMutation = trpc.booking.complete.useMutation({
    ...createBookingOptimisticUpdate(BookingStatus.COMPLETED),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err) => {
      setError(err.message || "Error al completar la reserva");
    },
  });

  const acceptBooking = async (bookingId: string) => {
    setError(null);
    try {
      await acceptMutation.mutateAsync({ bookingId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al aceptar la reserva";
      setError(message);
      throw err;
    }
  };

  const rejectBooking = async (bookingId: string) => {
    setError(null);
    try {
      await rejectMutation.mutateAsync({ bookingId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al rechazar la reserva";
      setError(message);
      throw err;
    }
  };

  const markOnMyWay = async (bookingId: string) => {
    setError(null);
    try {
      await markOnMyWayMutation.mutateAsync({ bookingId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al marcar como en camino";
      setError(message);
      throw err;
    }
  };

  const arriveBooking = async (bookingId: string) => {
    setError(null);
    try {
      await arriveMutation.mutateAsync({ bookingId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al marcar como llegado";
      setError(message);
      throw err;
    }
  };

  const completeBooking = async (bookingId: string) => {
    setError(null);
    try {
      await completeMutation.mutateAsync({ bookingId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al completar la reserva";
      setError(message);
      throw err;
    }
  };

  return {
    acceptBooking,
    rejectBooking,
    markOnMyWay,
    arriveBooking,
    completeBooking,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isMarkingOnMyWay: markOnMyWayMutation.isPending,
    isArriving: arriveMutation.isPending,
    isCompleting: completeMutation.isPending,
    error,
  };
}
