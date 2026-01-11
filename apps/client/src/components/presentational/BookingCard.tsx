import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import type { Booking } from "@repo/domain";
import { BookingStatus } from "@repo/domain";

interface BookingCardProps {
  booking: Booking;
}

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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function BookingCard({ booking }: BookingCardProps) {
  const statusLabel = STATUS_LABELS[booking.status];
  const statusVariant = STATUS_VARIANTS[booking.status];
  const categoryLabel = CATEGORY_LABELS[booking.category] || booking.category;

  return (
    <Link href={`/my-bookings/${booking.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <Text variant="h2" className="text-text">
            {categoryLabel}
          </Text>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <Text variant="body" className="text-muted mb-2 line-clamp-2">
          {booking.description}
        </Text>
        <Text variant="small" className="text-muted mb-3">
          {formatDate(booking.scheduledAt)}
        </Text>
        <div className="flex justify-between items-center">
          <Text variant="small" className="text-text font-medium">
            ${booking.totalAmount.toFixed(0)}
          </Text>
          <Text variant="small" className="text-muted">
            Ver detalles →
          </Text>
        </div>
      </Card>
    </Link>
  );
}
