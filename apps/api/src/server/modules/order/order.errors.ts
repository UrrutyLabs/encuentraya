import { OrderStatus } from "@repo/domain";

/**
 * Domain error for invalid order state transitions
 */
export class InvalidOrderStateError extends Error {
  constructor(
    public readonly currentStatus: OrderStatus,
    public readonly attemptedStatus: OrderStatus
  ) {
    super(
      `Invalid state transition from ${currentStatus} to ${attemptedStatus}`
    );
    this.name = "InvalidOrderStateError";
  }
}

/**
 * Domain error for unauthorized order actions
 */
export class UnauthorizedOrderActionError extends Error {
  constructor(
    public readonly action: string,
    public readonly reason: string
  ) {
    super(`Unauthorized to ${action}: ${reason}`);
    this.name = "UnauthorizedOrderActionError";
  }
}

/**
 * Domain error for order not found
 */
export class OrderNotFoundError extends Error {
  constructor(public readonly orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = "OrderNotFoundError";
  }
}
