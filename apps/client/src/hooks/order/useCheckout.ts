import { trpc } from "@/lib/trpc/client";
import { useState } from "react";

/**
 * Hook to handle checkout flow
 * Encapsulates order details, payment info, and preauth creation
 */
export function useCheckout(orderId: string | undefined) {
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  const { data: order, isLoading: isLoadingOrder } =
    trpc.order.getById.useQuery(
      { id: orderId! },
      {
        enabled: !!orderId,
        retry: false,
      }
    );

  // Fetch payment summary
  const { data: payment, isLoading: isLoadingPayment } =
    trpc.payment.getByOrder.useQuery(
      { orderId: orderId! },
      {
        enabled: !!orderId,
        retry: false,
      }
    );

  // Create preauth mutation
  const createPreauth = trpc.payment.createPreauthForOrder.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to provider checkout URL
        window.location.assign(data.checkoutUrl);
      } else {
        setError("No se pudo obtener la URL de pago. Probá de nuevo.");
      }
    },
    onError: () => {
      setError("No pudimos iniciar el pago. Probá de nuevo.");
    },
  });

  const handleAuthorizePayment = async () => {
    if (!orderId) return;
    setError(null);
    try {
      await createPreauth.mutateAsync({ orderId });
    } catch {
      // Error handled by mutation onError
    }
  };

  return {
    order,
    payment,
    isLoading: isLoadingOrder || isLoadingPayment,
    authorizePayment: handleAuthorizePayment,
    isAuthorizing: createPreauth.isPending,
    error: error || createPreauth.error?.message,
  };
}
