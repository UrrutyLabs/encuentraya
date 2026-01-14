"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Text } from "@/components/ui/Text";
import { Badge } from "@/components/ui/Badge";
import type { Booking } from "@repo/domain";
import { BookingStatus } from "@repo/domain";

interface BookingCardProps {
  booking: Booking;
  hasReview?: boolean;
}

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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function BookingCard({ booking, hasReview = false }: BookingCardProps) {
  const router = useRouter();
  const statusLabel = STATUS_LABELS[booking.status];
  const statusVariant = STATUS_VARIANTS[booking.status];
  const categoryLabel = CATEGORY_LABELS[booking.category] || booking.category;
  const showReviewPrompt =
    booking.status === BookingStatus.COMPLETED && !hasReview;
  const showPaymentPrompt =
    booking.status === BookingStatus.PENDING_PAYMENT;
  const showRebookPrompt =
    booking.status === BookingStatus.COMPLETED && booking.proId;

  const handleCardClick = () => {
    router.push(`/my-bookings/${booking.id}`);
  };

  const handlePayNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/checkout?bookingId=${booking.id}`);
  };

  const handleRebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/book?rebookFrom=${booking.id}`);
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-2">
        <Text variant="h2" className="text-text">
          {categoryLabel}
        </Text>
        <div className="flex gap-2 items-center">
          {showReviewPrompt && (
            <Badge variant="warning">Pendiente de reseña</Badge>
          )}
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
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
        <div className="flex items-center gap-2">
          {showPaymentPrompt && (
            <button
              onClick={handlePayNow}
              className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              Pagar ahora
            </button>
          )}
          {showRebookPrompt && (
            <button
              onClick={handleRebook}
              className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
            >
              Volver a contratar
            </button>
          )}
          {showReviewPrompt && (
            <Link
              href={`/my-bookings/${booking.id}/review`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline text-sm font-medium"
            >
              Calificar
            </Link>
          )}
          <Text variant="small" className="text-muted">
            Ver detalles →
          </Text>
        </div>
      </div>
    </Card>
  );
}
