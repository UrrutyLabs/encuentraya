import { trpc } from "../lib/trpc/client";
import { useState } from "react";
import { BookingStatus } from "@repo/domain";

interface UseBookingActionsReturn {
  acceptBooking: (bookingId: string) => Promise<void>;
  rejectBooking: (bookingId: string) => Promise<void>;
  arriveBooking: (bookingId: string) => Promise<void>;
  completeBooking: (bookingId: string) => Promise<void>;
  isAccepting: boolean;
  isRejecting: boolean;
  isArriving: boolean;
  isCompleting: boolean;
  error: string | null;
}

/**
 * Hook to encapsulate booking action mutations for pros.
 * Handles accept, reject, arrive, and complete actions.
 */
export function useBookingActions(
  onSuccess?: () => void
): UseBookingActionsReturn {
  const [error, setError] = useState<string | null>(null);

  const acceptMutation = trpc.booking.accept.useMutation({
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

  const arriveMutation = trpc.booking.arrive.useMutation({
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
    arriveBooking,
    completeBooking,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isArriving: arriveMutation.isPending,
    isCompleting: completeMutation.isPending,
    error,
  };
}
