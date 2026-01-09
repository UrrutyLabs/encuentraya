import { BookingStatus } from "@repo/domain";

/**
 * Domain error for invalid booking state transitions
 */
export class InvalidBookingStateError extends Error {
  constructor(
    public readonly currentStatus: BookingStatus,
    public readonly attemptedStatus: BookingStatus
  ) {
    super(
      `Invalid state transition from ${currentStatus} to ${attemptedStatus}`
    );
    this.name = "InvalidBookingStateError";
  }
}

/**
 * Domain error for unauthorized booking actions
 */
export class UnauthorizedBookingActionError extends Error {
  constructor(
    public readonly action: string,
    public readonly reason: string
  ) {
    super(`Unauthorized to ${action}: ${reason}`);
    this.name = "UnauthorizedBookingActionError";
  }
}

/**
 * Domain error for booking not found
 */
export class BookingNotFoundError extends Error {
  constructor(public readonly bookingId: string) {
    super(`Booking not found: ${bookingId}`);
    this.name = "BookingNotFoundError";
  }
}
