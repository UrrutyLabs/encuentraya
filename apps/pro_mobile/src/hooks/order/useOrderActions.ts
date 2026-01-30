import { trpc } from "@lib/trpc/client";
import { useState } from "react";
import { useQueryClient } from "../shared/useQueryClient";
import { OrderStatus } from "@repo/domain";
import type { Order } from "@repo/domain";

interface UseOrderActionsReturn {
  acceptOrder: (orderId: string) => Promise<void>;
  rejectOrder: (orderId: string, reason?: string) => Promise<void>;
  markOnMyWay: (orderId: string) => Promise<void>;
  arriveOrder: (orderId: string) => Promise<void>;
  completeOrder: (orderId: string, finalHours: number) => Promise<void>;
  isAccepting: boolean;
  isRejecting: boolean;
  isMarkingOnMyWay: boolean;
  isArriving: boolean;
  isCompleting: boolean;
  error: string | null;
}

/**
 * Hook to encapsulate order action mutations for pros.
 * Handles accept, reject (cancel), mark on my way (markInProgress), arrive, and complete (submitHours) actions.
 * Uses optimistic updates for instant UI feedback.
 * Note: UI displays these as "Jobs" (Trabajos) to users
 */
export function useOrderActions(onSuccess?: () => void): UseOrderActionsReturn {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Helper to create optimistic update for order status changes
  const createOrderOptimisticUpdate = (newStatus: OrderStatus) => {
    return {
      onMutate: async (variables: { orderId: string }) => {
        // Cancel outgoing refetches
        const orderQueryKey: [string[], { id: string }] = [
          ["order", "getById"],
          { id: variables.orderId },
        ];
        await queryClient.cancelQueries({ queryKey: orderQueryKey });
        await queryClient.cancelQueries({
          queryKey: [["order", "listByPro"]],
        });

        // Snapshot previous values
        const previousOrder = queryClient.getQueryData<Order>(orderQueryKey);

        // Optimistically update order status
        if (previousOrder) {
          queryClient.setQueryData<Order>(orderQueryKey, {
            ...previousOrder,
            status: newStatus,
          });
        }

        return { previousOrder };
      },
      onError: (
        err: Error,
        variables: { orderId: string },
        context: { previousOrder?: Order }
      ) => {
        // Rollback on error
        if (context?.previousOrder) {
          const orderQueryKey: [string[], { id: string }] = [
            ["order", "getById"],
            { id: variables.orderId },
          ];
          queryClient.setQueryData<Order>(orderQueryKey, context.previousOrder);
        }
      },
      onSettled: (
        data: unknown,
        error: unknown,
        variables: { orderId: string }
      ) => {
        // Invalidate related queries after mutation settles
        const orderQueryKey: [string[], { id: string }] = [
          ["order", "getById"],
          { id: variables.orderId },
        ];
        queryClient.invalidateQueries({ queryKey: orderQueryKey });
        queryClient.invalidateQueries({ queryKey: [["order", "listByPro"]] });
      },
    };
  };

  const acceptMutation = trpc.order.accept.useMutation({
    ...createOrderOptimisticUpdate(OrderStatus.ACCEPTED),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Error al aceptar el trabajo");
    },
  });

  const rejectMutation = trpc.order.cancel.useMutation({
    ...createOrderOptimisticUpdate(OrderStatus.CANCELED),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Error al rechazar el trabajo");
    },
  });

  const markOnMyWayMutation = trpc.order.markInProgress.useMutation({
    ...createOrderOptimisticUpdate(OrderStatus.IN_PROGRESS),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Error al marcar como en camino");
    },
  });

  const arriveMutation = trpc.order.markArrived.useMutation({
    // markArrived doesn't change status, it sets arrivedAt timestamp
    // So we don't use optimistic status update, but we still invalidate queries
    onMutate: async (variables: { orderId: string }) => {
      const orderQueryKey: [string[], { id: string }] = [
        ["order", "getById"],
        { id: variables.orderId },
      ];
      await queryClient.cancelQueries({ queryKey: orderQueryKey });
      await queryClient.cancelQueries({
        queryKey: [["order", "listByPro"]],
      });
    },
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Error al marcar como llegado");
    },
    onSettled: (
      data: unknown,
      error: unknown,
      variables: { orderId: string }
    ) => {
      const orderQueryKey: [string[], { id: string }] = [
        ["order", "getById"],
        { id: variables.orderId },
      ];
      queryClient.invalidateQueries({ queryKey: orderQueryKey });
      queryClient.invalidateQueries({ queryKey: [["order", "listByPro"]] });
    },
  });

  const completeMutation = trpc.order.submitHours.useMutation({
    ...createOrderOptimisticUpdate(OrderStatus.AWAITING_CLIENT_APPROVAL),
    onSuccess: () => {
      setError(null);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (err: { message?: string }) => {
      setError(err.message || "Error al completar el trabajo");
    },
  });

  const acceptOrder = async (orderId: string) => {
    setError(null);
    try {
      await acceptMutation.mutateAsync({ orderId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al aceptar el trabajo";
      setError(message);
      throw err;
    }
  };

  const rejectOrder = async (orderId: string, reason?: string) => {
    setError(null);
    try {
      await rejectMutation.mutateAsync({ orderId, reason });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al rechazar el trabajo";
      setError(message);
      throw err;
    }
  };

  const markOnMyWay = async (orderId: string) => {
    setError(null);
    try {
      await markOnMyWayMutation.mutateAsync({ orderId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al marcar como en camino";
      setError(message);
      throw err;
    }
  };

  const arriveOrder = async (orderId: string) => {
    setError(null);
    try {
      await arriveMutation.mutateAsync({ orderId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al marcar como llegado";
      setError(message);
      throw err;
    }
  };

  const completeOrder = async (orderId: string, finalHours: number) => {
    setError(null);
    try {
      await completeMutation.mutateAsync({ orderId, finalHours });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al completar el trabajo";
      setError(message);
      throw err;
    }
  };

  return {
    acceptOrder,
    rejectOrder,
    markOnMyWay,
    arriveOrder,
    completeOrder,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
    isMarkingOnMyWay: markOnMyWayMutation.isPending,
    isArriving: arriveMutation.isPending,
    isCompleting: completeMutation.isPending,
    error,
  };
}
