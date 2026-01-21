import { trpc } from "@/lib/trpc/client";
import { useState } from "react";

/**
 * Hook to handle checkout flow
 * Encapsulates booking details, payment info, and preauth creation
 */
export function useCheckout(bookingId: string | undefined) {
  const [error, setError] = useState<string | null>(null);

  // Fetch booking details
  const { data: booking, isLoading: isLoadingBooking } = trpc.booking.getById.useQuery(
    { id: bookingId! },
    {
      enabled: !!bookingId,
      retry: false,
    }
  );

  // Fetch payment summary
  const { data: payment, isLoading: isLoadingPayment } = trpc.payment.getByBooking.useQuery(
    { bookingId: bookingId! },
    {
      enabled: !!bookingId,
      retry: false,
    }
  );

  // Create preauth mutation
  const createPreauth = trpc.payment.createPreauthForBooking.useMutation({
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
    if (!bookingId) return;
    setError(null);
    try {
      await createPreauth.mutateAsync({ bookingId });
    } catch {
      // Error handled by mutation onError
    }
  };

  return {
    booking,
    payment,
    isLoading: isLoadingBooking || isLoadingPayment,
    authorizePayment: handleAuthorizePayment,
    isAuthorizing: createPreauth.isPending,
    error: error || createPreauth.error?.message,
  };
}
