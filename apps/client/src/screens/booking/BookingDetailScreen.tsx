"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  User,
  Filter,
  Calendar,
  MapPin,
  Hourglass,
  FileText,
  DollarSign,
  X,
  Star,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Navigation } from "@/components/presentational/Navigation";
import { BookingDetailSkeleton } from "@/components/presentational/BookingDetailSkeleton";
import { BookingStatus, formatCurrency } from "@repo/domain";
import { useBookingDetail } from "@/hooks/useBookingDetail";
import { useCancelBooking } from "@/hooks/useCancelBooking";

const STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING_PAYMENT]: "Pago pendiente",
  [BookingStatus.PENDING]: "Pendiente",
  [BookingStatus.ACCEPTED]: "Aceptada",
  [BookingStatus.ON_MY_WAY]: "En camino",
  [BookingStatus.ARRIVED]: "Llegó",
  [BookingStatus.REJECTED]: "Rechazada",
  [BookingStatus.COMPLETED]: "Completada",
  [BookingStatus.CANCELLED]: "Cancelada",
};

const STATUS_VARIANTS: Record<BookingStatus, "info" | "success" | "warning" | "danger"> = {
  [BookingStatus.PENDING_PAYMENT]: "warning",
  [BookingStatus.PENDING]: "info",
  [BookingStatus.ACCEPTED]: "success",
  [BookingStatus.ON_MY_WAY]: "info",
  [BookingStatus.ARRIVED]: "success",
  [BookingStatus.REJECTED]: "danger",
  [BookingStatus.COMPLETED]: "success",
  [BookingStatus.CANCELLED]: "warning",
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: "Plomería",
  electrical: "Electricidad",
  cleaning: "Limpieza",
  handyman: "Arreglos generales",
  painting: "Pintura",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("es-UY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function BookingDetailScreen() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  // Fetch booking and related data via hook
  const { booking, pro, existingReview, payment, isLoading, error } =
    useBookingDetail(bookingId);

  // Cancel booking hook
  const { cancelBooking, isPending: isCancelling } = useCancelBooking();

  const canCancel =
    booking &&
    (booking.status === BookingStatus.PENDING_PAYMENT ||
      booking.status === BookingStatus.PENDING ||
      booking.status === BookingStatus.ACCEPTED);

  const handleCancel = async () => {
    if (!booking || !canCancel) return;

    if (confirm("¿Estás seguro de que querés cancelar esta reserva?")) {
      try {
        await cancelBooking(booking.id);
        // Success - hook's onSuccess will handle redirect
      } catch (error) {
        // Error is handled by hook state
        console.error("Error cancelling booking:", error);
      }
    }
  };

  const handleAuthorizePayment = () => {
    router.push(`/checkout?bookingId=${bookingId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <BookingDetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="h2" className="mb-2 text-text">
                Reserva no encontrada
              </Text>
              <Text variant="body" className="text-muted mb-4">
                La reserva que buscas no existe o fue eliminada.
              </Text>
              <Link href="/my-bookings">
                <Button variant="primary">Volver a mis reservas</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[booking.status as BookingStatus];
  const statusVariant = STATUS_VARIANTS[booking.status as BookingStatus];
  const categoryLabel = CATEGORY_LABELS[booking.category] || booking.category;

  // Extract address from description (assuming format "Servicio en {address}")
  const addressMatch = booking.description.match(/Servicio en (.+)/);
  const address = addressMatch ? addressMatch[1] : booking.description;

  return (
    <div className="min-h-screen bg-bg">
      <Navigation showLogin={false} showProfile={true} />
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/my-bookings">
              <Button variant="ghost" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            </Link>
            <Badge variant={statusVariant} showIcon>
              {statusLabel}
            </Badge>
          </div>

          <Text variant="h1" className="mb-6 text-primary">
            Detalle de reserva
          </Text>

          {/* Pro Summary */}
          {/* Payment Banner - Show when payment is pending */}
          {booking.status === BookingStatus.PENDING_PAYMENT && (
            <Card className="p-6 mb-6 bg-warning/10 border-warning/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    <Text variant="h2" className="text-text">
                      Pago pendiente
                    </Text>
                  </div>
                  <Text variant="body" className="text-muted mb-2">
                    Para continuar con tu reserva, necesitás autorizar el pago.
                  </Text>
                  {payment && (
                    <div className="flex items-center gap-2 mt-2">
                      <DollarSign className="w-4 h-4 text-text" />
                      <Text variant="body" className="text-text font-medium">
                        Monto estimado: {formatCurrency(payment.amountEstimated, payment.currency, true)}
                      </Text>
                    </div>
                  )}
                </div>
                <Badge variant="warning" showIcon>
                  Pago pendiente
                </Badge>
              </div>
              <Button
                variant="primary"
                onClick={handleAuthorizePayment}
                className="w-full md:w-auto flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Autorizar pago
              </Button>
            </Card>
          )}

          {pro && (
            <Card className="p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <Text variant="h2" className="text-text">
                  Profesional
                </Text>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Text variant="body" className="text-text font-medium mb-1">
                    {pro.name}
                  </Text>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-muted" />
                    <Text variant="small" className="text-muted">
                      ${pro.hourlyRate.toFixed(0)}/hora
                    </Text>
                  </div>
                </div>
                <Link href={`/pros/${pro.id}`}>
                  <Button variant="ghost" className="flex items-center gap-2">
                    Ver perfil
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Booking Summary */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <Text variant="h2" className="text-text">
                Detalles del servicio
              </Text>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Filter className="w-4 h-4 text-muted" />
                  <Text variant="small" className="text-muted">
                    Categoría
                  </Text>
                </div>
                <Text variant="body" className="text-text">
                  {categoryLabel}
                </Text>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-muted" />
                  <Text variant="small" className="text-muted">
                    Fecha y hora
                  </Text>
                </div>
                <Text variant="body" className="text-text">
                  {formatDate(booking.scheduledAt)}
                </Text>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-muted" />
                  <Text variant="small" className="text-muted">
                    Dirección
                  </Text>
                </div>
                <Text variant="body" className="text-text">
                  {address}
                </Text>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Hourglass className="w-4 h-4 text-muted" />
                  <Text variant="small" className="text-muted">
                    Horas estimadas
                  </Text>
                </div>
                <Text variant="body" className="text-text">
                  {booking.estimatedHours} {booking.estimatedHours === 1 ? "hora" : "horas"}
                </Text>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-muted" />
                  <Text variant="small" className="text-muted">
                    Descripción
                  </Text>
                </div>
                <Text variant="body" className="text-text">
                  {booking.description}
                </Text>
              </div>
            </div>
          </Card>

          {/* Cost Summary */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              <Text variant="h2" className="text-text">
                Resumen de costo
              </Text>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Text variant="body" className="text-muted">
                  Tarifa por hora
                </Text>
                <Text variant="body" className="text-text">
                  ${booking.hourlyRate.toFixed(0)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text variant="body" className="text-muted">
                  Horas estimadas
                </Text>
                <Text variant="body" className="text-text">
                  {booking.estimatedHours}
                </Text>
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between">
                  <Text variant="body" className="text-text font-medium">
                    Total estimado
                  </Text>
                  <Text variant="h2" className="text-primary">
                    ${booking.totalAmount.toFixed(0)}
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          {canCancel && (
            <Card className="p-6">
              <Text variant="h2" className="mb-4 text-text">
                Acciones
              </Text>
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full md:w-auto flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {isCancelling ? "Cancelando..." : "Cancelar reserva"}
              </Button>
            </Card>
          )}

          {booking.status === BookingStatus.COMPLETED && (
            <>
              {!existingReview && (
                <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-primary" />
                    <Text variant="h2" className="text-text">
                      ¿Cómo te fue con este trabajo?
                    </Text>
                  </div>
                  <Text variant="body" className="text-muted mb-4">
                    Compartí tu experiencia y ayudá a otros a encontrar el mejor profesional.
                  </Text>
                  <Link href={`/my-bookings/${bookingId}/review`}>
                    <Button variant="primary" className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Dejar reseña
                    </Button>
                  </Link>
                </Card>
              )}
              {booking.proId && (
                <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <RotateCcw className="w-5 h-5 text-primary" />
                    <Text variant="h2" className="text-text">
                      ¿Querés que vuelva este profesional?
                    </Text>
                  </div>
                  <Text variant="body" className="text-muted mb-4">
                    Creá una nueva solicitud para el mismo profesional.
                  </Text>
                  <Link href={`/book?rebookFrom=${bookingId}`}>
                    <Button variant="primary" className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Volver a contratar
                    </Button>
                  </Link>
                </Card>
              )}
              <Card className="p-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <Text variant="body" className="text-muted">
                    Esta reserva fue completada el{" "}
                    {booking.completedAt
                      ? formatDateShort(booking.completedAt)
                      : formatDateShort(booking.updatedAt)}
                    .
                  </Text>
                </div>
              </Card>
            </>
          )}

          {booking.status === BookingStatus.CANCELLED && (
            <Card className="p-6">
              <Text variant="body" className="text-muted">
                Esta reserva fue cancelada el{" "}
                {booking.cancelledAt
                  ? formatDateShort(booking.cancelledAt)
                  : formatDateShort(booking.updatedAt)}
                .
              </Text>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
