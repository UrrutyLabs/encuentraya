import { BookingStatus } from "../enums";

/**
 * Get the Spanish label for a booking status
 */
export function getBookingStatusLabel(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    [BookingStatus.PENDING_PAYMENT]: "Pago pendiente",
    [BookingStatus.PENDING]: "Pendiente",
    [BookingStatus.ACCEPTED]: "Aceptada",
    [BookingStatus.ON_MY_WAY]: "En camino",
    [BookingStatus.ARRIVED]: "Llegó",
    [BookingStatus.COMPLETED]: "Completada",
    [BookingStatus.REJECTED]: "Rechazada",
    [BookingStatus.CANCELLED]: "Cancelada",
  };
  return labels[status] || status;
}

/**
 * Get the badge variant color for a booking status (Option 1: Workflow progression)
 * - PENDING_PAYMENT: warning (yellow) - needs payment
 * - PENDING: info (blue) - awaiting action
 * - ACCEPTED: success (green) - positive confirmation
 * - ON_MY_WAY: info (blue) - in progress
 * - ARRIVED: success (green) - positive milestone
 * - COMPLETED: success (green) - final success state
 * - REJECTED: danger (red) - negative outcome
 * - CANCELLED: danger (red) - cancelled/negative outcome
 */
export function getBookingStatusVariant(
  status: BookingStatus
): "info" | "success" | "warning" | "danger" {
  const variants: Record<
    BookingStatus,
    "info" | "success" | "warning" | "danger"
  > = {
    [BookingStatus.PENDING_PAYMENT]: "warning",
    [BookingStatus.PENDING]: "info",
    [BookingStatus.ACCEPTED]: "success",
    [BookingStatus.ON_MY_WAY]: "info",
    [BookingStatus.ARRIVED]: "success",
    [BookingStatus.COMPLETED]: "success",
    [BookingStatus.REJECTED]: "danger",
    [BookingStatus.CANCELLED]: "danger",
  };
  return variants[status] || "info";
}
