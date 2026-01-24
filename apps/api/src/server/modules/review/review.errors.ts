/**
 * Domain error for attempting to review a non-completed booking
 */
export class BookingNotCompletedError extends Error {
  constructor(
    public readonly bookingId: string,
    public readonly currentStatus: string
  ) {
    super(
      `Cannot review booking ${bookingId}: booking must be completed, but current status is ${currentStatus}`
    );
    this.name = "BookingNotCompletedError";
  }
}

/**
 * Domain error for attempting to create a review when one already exists
 */
export class ReviewAlreadyExistsError extends Error {
  constructor(public readonly bookingId: string) {
    super(`Review already exists for booking: ${bookingId}`);
    this.name = "ReviewAlreadyExistsError";
  }
}

/**
 * Domain error for unauthorized review actions
 */
export class UnauthorizedReviewError extends Error {
  constructor(
    public readonly action: string,
    public readonly reason: string
  ) {
    super(`Unauthorized to ${action}: ${reason}`);
    this.name = "UnauthorizedReviewError";
  }
}
