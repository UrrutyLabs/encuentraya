"use client";

import { memo, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, CreditCard, RotateCcw, Star, ArrowRight } from "lucide-react";
import { Card } from "@repo/ui";
import { Text } from "@repo/ui";
import { Badge } from "@repo/ui";
import type { Booking } from "@repo/domain";
import {
  BookingStatus,
  getBookingStatusLabel,
  getBookingStatusVariant,
} from "@repo/domain";

interface BookingCardProps {
  booking: Booking;
  hasReview?: boolean;
}

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

export const BookingCard = memo(
  function BookingCard({ booking, hasReview = false }: BookingCardProps) {
    const router = useRouter();

    // Memoize computed values
    const statusLabel = useMemo(
      () => getBookingStatusLabel(booking.status),
      [booking.status]
    );
    const statusVariant = useMemo(
      () => getBookingStatusVariant(booking.status),
      [booking.status]
    );
    const categoryLabel = useMemo(
      () => CATEGORY_LABELS[booking.category] || booking.category,
      [booking.category]
    );
    const formattedDate = useMemo(
      () => formatDate(booking.scheduledAt),
      [booking.scheduledAt]
    );

    const showReviewPrompt = useMemo(
      () => booking.status === BookingStatus.COMPLETED && !hasReview,
      [booking.status, hasReview]
    );
    const showPaymentPrompt = useMemo(
      () => booking.status === BookingStatus.PENDING_PAYMENT,
      [booking.status]
    );
    const showRebookPrompt = useMemo(
      () => booking.status === BookingStatus.COMPLETED && booking.proId,
      [booking.status, booking.proId]
    );

    // Memoize event handlers
    const handleCardClick = useCallback(() => {
      router.push(`/my-bookings/${booking.id}`);
    }, [router, booking.id]);

    const handlePayNow = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/checkout?bookingId=${booking.id}`);
      },
      [router, booking.id]
    );

    const handleRebook = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/book?rebookFrom=${booking.id}`);
      },
      [router, booking.id]
    );

    return (
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex justify-between items-start mb-2">
          <Text variant="h2" className="text-text">
            {categoryLabel}
          </Text>
          <Badge variant={statusVariant} showIcon>
            {statusLabel}
          </Badge>
        </div>
        <Text variant="body" className="text-muted mb-2 line-clamp-2">
          {booking.description}
        </Text>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted" />
          <Text variant="small" className="text-muted">
            {formattedDate}
          </Text>
        </div>
        <div className="flex justify-between items-center">
          <Text variant="small" className="text-text font-medium">
            ${booking.totalAmount.toFixed(0)}
          </Text>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {showPaymentPrompt && (
              <button
                onClick={handlePayNow}
                className="flex items-center gap-1 px-3 py-1 bg-primary text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                <CreditCard className="w-4 h-4" />
                Pagar ahora
              </button>
            )}
            {/* Prioritize review action when pending */}
            {showReviewPrompt ? (
              <>
                <Link
                  href={`/my-bookings/${booking.id}/review`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1 bg-primary text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                >
                  <Star className="w-4 h-4" />
                  Calificar
                </Link>
                {showRebookPrompt && (
                  <button
                    onClick={handleRebook}
                    className="flex items-center gap-1 text-primary hover:underline text-sm font-medium"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Volver a contratar
                  </button>
                )}
              </>
            ) : (
              <>
                {showRebookPrompt && (
                  <button
                    onClick={handleRebook}
                    className="flex items-center gap-1 px-3 py-1 bg-primary text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Volver a contratar
                  </button>
                )}
                {/* Only show "Ver detalles" when there are no action buttons */}
                {!showPaymentPrompt && !showRebookPrompt && (
                  <Text
                    variant="small"
                    className="text-muted flex items-center gap-1"
                  >
                    Ver detalles
                    <ArrowRight className="w-3 h-3" />
                  </Text>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    return (
      prevProps.booking.id === nextProps.booking.id &&
      prevProps.booking.status === nextProps.booking.status &&
      prevProps.hasReview === nextProps.hasReview
    );
  }
);
