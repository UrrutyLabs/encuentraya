"use client";

import { useSearchParams } from "next/navigation";
import { useCheckout } from "@/hooks/useCheckout";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Navigation } from "@/components/presentational/Navigation";
import { PaymentStatus, formatCurrency } from "@repo/domain";
import Link from "next/link";

export function CheckoutScreen() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

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
    } catch (err) {
      // Error handled by mutation onError
    }
  };

  // Missing bookingId
  if (!bookingId) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="h2" className="mb-2 text-text">
                Falta el identificador de la reserva.
              </Text>
              <Link href="/my-bookings">
                <Button variant="secondary" className="mt-4">
                  Volver a mis reservas
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="body" className="text-muted">
                Cargando...
              </Text>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Check if payment is already authorized
  const isAuthorized =
    payment &&
    (payment.status === PaymentStatus.AUTHORIZED ||
      payment.status === PaymentStatus.CAPTURED);

  if (isAuthorized) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8">
              <Text variant="h1" className="mb-4 text-primary">
                Autorizar pago
              </Text>
              <Text variant="body" className="mb-6 text-text">
                El pago ya está autorizado.
              </Text>
              <Link href={`/my-bookings/${bookingId}`}>
                <Button variant="primary">Ver reserva</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Format date and time
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-UY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("es-UY", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Calculate amount: use payment if exists (minor units), otherwise use booking (major units)
  const amountEstimated = payment?.amountEstimated ?? (booking?.totalAmount ?? 0);
  const isAmountInMinorUnits = !!payment; // Payment amounts are in minor units, booking.totalAmount is in major units
  const currency = payment?.currency || "UYU";

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Text variant="h1" className="mb-6 text-primary">
            Autorizar pago
          </Text>

          {/* Booking Summary */}
          {booking && (
            <Card className="p-6 mb-6">
              <Text variant="h2" className="mb-4 text-text">
                Resumen de la reserva
              </Text>
              <div className="space-y-2">
                <div>
                  <Text variant="small" className="text-muted">
                    Fecha y hora:
                  </Text>
                  <Text variant="body" className="text-text">
                    {formatDate(booking.scheduledAt)} a las {formatTime(booking.scheduledAt)}
                  </Text>
                </div>
                {booking.description && (
                  <div>
                    <Text variant="small" className="text-muted">
                      Dirección:
                    </Text>
                    <Text variant="body" className="text-text">
                      {booking.description.replace(/^Servicio en /, "")}
                    </Text>
                  </div>
                )}
                {booking.estimatedHours && (
                  <div>
                    <Text variant="small" className="text-muted">
                      Horas estimadas:
                    </Text>
                    <Text variant="body" className="text-text">
                      {booking.estimatedHours} {booking.estimatedHours === 1 ? "hora" : "horas"}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Amount Summary */}
          <Card className="p-6 mb-6">
            <Text variant="h2" className="mb-4 text-text">
              Monto estimado: {formatCurrency(amountEstimated, currency, isAmountInMinorUnits)}
            </Text>
            <Text variant="small" className="text-muted">
              Este es un monto estimado. El cobro final depende del trabajo realizado. Nunca se
              cobrará más sin aviso.
            </Text>
          </Card>

          {/* Error message */}
          {error && (
            <Card className="p-4 mb-6 bg-danger/10 border-danger/20">
              <Text variant="body" className="text-danger">
                {error}
              </Text>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={authorizePayment}
              disabled={isAuthorizing || !bookingId}
            >
              {isAuthorizing ? "Cargando..." : "Autorizar pago"}
            </Button>
            <Link href="/my-bookings">
              <Button variant="ghost">Volver a mis reservas</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
