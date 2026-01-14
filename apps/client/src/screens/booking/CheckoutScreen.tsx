"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Calendar,
  MapPin,
  Hourglass,
  DollarSign,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Text } from "@repo/ui";
import { Card } from "@repo/ui";
import { Button } from "@repo/ui";
import { Navigation } from "@/components/presentational/Navigation";
import { WhatsAppPromptCard } from "@/components/presentational/WhatsAppPromptCard";
import { useClientProfile } from "@/hooks/useClientProfile";
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

  // Fetch client profile for WhatsApp prompt
  const { profile } = useClientProfile();

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
              <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
              <Text variant="h2" className="mb-2 text-text">
                Falta el identificador de la reserva.
              </Text>
              <Link href="/my-bookings">
                <Button variant="secondary" className="mt-4 flex items-center gap-2 mx-auto">
                  <ArrowLeft className="w-4 h-4" />
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
  const isLoading = isLoadingBooking || isLoadingPayment;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <Text variant="body" className="text-muted">
                  Cargando...
                </Text>
              </div>
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
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-success" />
                <Text variant="h1" className="text-primary">
                  Autorizar pago
                </Text>
              </div>
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
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <Text variant="h2" className="text-text">
                  Resumen de la reserva
                </Text>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-muted" />
                    <Text variant="small" className="text-muted">
                      Fecha y hora:
                    </Text>
                  </div>
                  <Text variant="body" className="text-text">
                    {formatDate(booking.scheduledAt)} a las {formatTime(booking.scheduledAt)}
                  </Text>
                </div>
                {booking.description && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-muted" />
                      <Text variant="small" className="text-muted">
                        Dirección:
                      </Text>
                    </div>
                    <Text variant="body" className="text-text">
                      {booking.description.replace(/^Servicio en /, "")}
                    </Text>
                  </div>
                )}
                {booking.estimatedHours && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Hourglass className="w-4 h-4 text-muted" />
                      <Text variant="small" className="text-muted">
                        Horas estimadas:
                      </Text>
                    </div>
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
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              <Text variant="h2" className="text-text">
                Monto estimado: {formatCurrency(amountEstimated, currency, isAmountInMinorUnits)}
              </Text>
            </div>
            <Text variant="small" className="text-muted">
              Este es un monto estimado. El cobro final depende del trabajo realizado. Nunca se
              cobrará más sin aviso.
            </Text>
          </Card>

          {/* WhatsApp prompt - show if no phone and wants WhatsApp */}
          {profile &&
            !profile.phone &&
            profile.preferredContactMethod === "WHATSAPP" && (
              <WhatsAppPromptCard />
            )}

          {/* Error message */}
          {error && (
            <Card className="p-4 mb-6 bg-danger/10 border-danger/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger" />
                <Text variant="body" className="text-danger">
                  {error}
                </Text>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={handleAuthorizePayment}
              disabled={createPreauth.isPending || !bookingId}
              className="flex items-center gap-2"
            >
              {createPreauth.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Autorizar pago
                </>
              )}
            </Button>
            <Link href="/my-bookings">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver a mis reservas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
