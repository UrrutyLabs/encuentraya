import { OrderStatus } from "@repo/domain";

/**
 * Get the Spanish label for an Order status
 * Maps OrderStatus enum values to admin-friendly Spanish labels
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.DRAFT]: "Borrador",
    [OrderStatus.PENDING_PRO_CONFIRMATION]: "Pendiente de confirmación",
    [OrderStatus.ACCEPTED]: "Aceptado",
    [OrderStatus.CONFIRMED]: "Confirmado",
    [OrderStatus.IN_PROGRESS]: "En progreso",
    [OrderStatus.AWAITING_CLIENT_APPROVAL]: "Esperando aprobación del cliente",
    [OrderStatus.DISPUTED]: "En disputa",
    [OrderStatus.COMPLETED]: "Completado",
    [OrderStatus.PAID]: "Pagado",
    [OrderStatus.CANCELED]: "Cancelado",
  };
  return labels[status] || status;
}

/**
 * Get the badge variant color for an Order status
 * Maps OrderStatus to UI badge variants for consistent styling
 *
 * Variant meanings:
 * - info (blue): Informational/neutral state
 * - success (green): Positive/complete state
 * - warning (yellow): Needs attention/action
 * - danger (red): Negative/cancelled state
 */
export function getOrderStatusVariant(
  status: OrderStatus
): "info" | "success" | "warning" | "danger" {
  const variants: Record<
    OrderStatus,
    "info" | "success" | "warning" | "danger"
  > = {
    [OrderStatus.DRAFT]: "info",
    [OrderStatus.PENDING_PRO_CONFIRMATION]: "warning",
    [OrderStatus.ACCEPTED]: "success",
    [OrderStatus.CONFIRMED]: "success",
    [OrderStatus.IN_PROGRESS]: "info",
    [OrderStatus.AWAITING_CLIENT_APPROVAL]: "warning",
    [OrderStatus.DISPUTED]: "danger",
    [OrderStatus.COMPLETED]: "success",
    [OrderStatus.PAID]: "success",
    [OrderStatus.CANCELED]: "danger",
  };
  return variants[status] || "info";
}
