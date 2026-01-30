import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { OrderStatus, CategoryMetadataInput } from "@repo/domain";
import { logger } from "@/lib/logger";
import { useQueryClient } from "../shared";
import { invalidateRelatedQueries } from "@/lib/react-query/utils";

export interface CreateOrderInput {
  proProfileId?: string;
  categoryId: string; // FK to Category table
  subcategoryId?: string;
  categoryMetadataJson?: CategoryMetadataInput; // Optional snapshot of category metadata
  title?: string;
  description?: string;
  addressText: string;
  addressLat?: number;
  addressLng?: number;
  scheduledWindowStartAt: Date;
  scheduledWindowEndAt?: Date;
  estimatedHours: number;
}

/**
 * Hook to create an order
 * Encapsulates the order.create mutation and handles navigation
 */
export function useCreateOrder() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createOrder = trpc.order.create.useMutation({
    ...invalidateRelatedQueries(queryClient, [[["order", "listByClient"]]]),
    onSuccess: (data) => {
      // Redirect based on order status
      // For orders that need payment, redirect to checkout
      // Otherwise redirect to order detail
      if (
        data.status === OrderStatus.PENDING_PRO_CONFIRMATION ||
        data.status === OrderStatus.CONFIRMED
      ) {
        router.push(`/checkout?orderId=${data.id}`);
      } else {
        router.push(`/my-jobs/${data.id}`);
      }
    },
  });

  const handleCreate = async (input: CreateOrderInput) => {
    try {
      await createOrder.mutateAsync(input);
      // Success - mutation's onSuccess will handle redirect
    } catch (error) {
      logger.error(
        "Error creating order",
        error instanceof Error ? error : new Error(String(error)),
        {
          input,
        }
      );
      throw error;
    }
  };

  return {
    createOrder: handleCreate,
    isPending: createOrder.isPending,
    error: createOrder.error,
  };
}
