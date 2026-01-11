"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Text } from "@/components/ui/Text";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Navigation } from "@/components/presentational/Navigation";
import { trpc } from "@/lib/trpc/client";
import { BookingStatus } from "@repo/domain";

const STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "Pendiente",
  [BookingStatus.ACCEPTED]: "Aceptada",
  [BookingStatus.ARRIVED]: "Llegó",
  [BookingStatus.REJECTED]: "Rechazada",
  [BookingStatus.COMPLETED]: "Completada",
  [BookingStatus.CANCELLED]: "Cancelada",
};

const STATUS_VARIANTS: Record<BookingStatus, "info" | "success" | "warning" | "danger"> = {
  [BookingStatus.PENDING]: "info",
  [BookingStatus.ACCEPTED]: "success",
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

  const { data: booking, isLoading, error } = trpc.booking.getById.useQuery(
    { id: bookingId },
    {
      retry: false,
    }
  );

  // Fetch pro details
  const { data: pro } = trpc.pro.getById.useQuery(
    { id: booking?.proId || "" },
    {
      enabled: !!booking?.proId,
      retry: false,
    }
  );

  // Cancel mutation
  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      router.push("/my-bookings");
    },
  });

  const canCancel =
    booking &&
    (booking.status === BookingStatus.PENDING ||
      booking.status === BookingStatus.ACCEPTED);

  const handleCancel = async () => {
    if (!booking || !canCancel) return;

    if (confirm("¿Estás seguro de que querés cancelar esta reserva?")) {
      try {
        await cancelBooking.mutateAsync({ bookingId: booking.id });
        // Success - mutation's onSuccess will handle redirect
      } catch (error) {
        // Error is handled by mutation state
        console.error("Error cancelling booking:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <Navigation showLogin={false} showProfile={true} />
        <div className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 text-center">
              <Text variant="body" className="text-muted">
                Cargando reserva...
              </Text>
            </Card>
          </div>
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

  const statusLabel = STATUS_LABELS[booking.status];
  const statusVariant = STATUS_VARIANTS[booking.status];
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
              <Button variant="ghost">← Volver</Button>
            </Link>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          <Text variant="h1" className="mb-6 text-primary">
            Detalle de reserva
          </Text>

          {/* Pro Summary */}
          {pro && (
            <Card className="p-6 mb-6">
              <Text variant="h2" className="mb-4 text-text">
                Profesional
              </Text>
              <div className="flex items-center justify-between">
                <div>
                  <Text variant="body" className="text-text font-medium mb-1">
                    {pro.name}
                  </Text>
                  <Text variant="small" className="text-muted">
                    ${pro.hourlyRate.toFixed(0)}/hora
                  </Text>
                </div>
                <Link href={`/pros/${pro.id}`}>
                  <Button variant="ghost">Ver perfil</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Booking Summary */}
          <Card className="p-6 mb-6">
            <Text variant="h2" className="mb-4 text-text">
              Detalles del servicio
            </Text>
            <div className="space-y-3">
              <div>
                <Text variant="small" className="text-muted mb-1">
                  Categoría
                </Text>
                <Text variant="body" className="text-text">
                  {categoryLabel}
                </Text>
              </div>
              <div>
                <Text variant="small" className="text-muted mb-1">
                  Fecha y hora
                </Text>
                <Text variant="body" className="text-text">
                  {formatDate(booking.scheduledAt)}
                </Text>
              </div>
              <div>
                <Text variant="small" className="text-muted mb-1">
                  Dirección
                </Text>
                <Text variant="body" className="text-text">
                  {address}
                </Text>
              </div>
              <div>
                <Text variant="small" className="text-muted mb-1">
                  Horas estimadas
                </Text>
                <Text variant="body" className="text-text">
                  {booking.estimatedHours} {booking.estimatedHours === 1 ? "hora" : "horas"}
                </Text>
              </div>
              <div>
                <Text variant="small" className="text-muted mb-1">
                  Descripción
                </Text>
                <Text variant="body" className="text-text">
                  {booking.description}
                </Text>
              </div>
            </div>
          </Card>

          {/* Cost Summary */}
          <Card className="p-6 mb-6">
            <Text variant="h2" className="mb-4 text-text">
              Resumen de costo
            </Text>
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
                disabled={cancelBooking.isPending}
                className="w-full md:w-auto"
              >
                {cancelBooking.isPending ? "Cancelando..." : "Cancelar reserva"}
              </Button>
            </Card>
          )}

          {booking.status === BookingStatus.COMPLETED && (
            <Card className="p-6">
              <Text variant="body" className="text-muted">
                Esta reserva fue completada el{" "}
                {booking.completedAt
                  ? formatDateShort(booking.completedAt)
                  : formatDateShort(booking.updatedAt)}
                .
              </Text>
            </Card>
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
