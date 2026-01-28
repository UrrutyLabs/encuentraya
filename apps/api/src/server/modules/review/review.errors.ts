/**
 * Domain error for attempting to review a non-completed order
 */
export class OrderNotCompletedError extends Error {
  constructor(
    public readonly orderId: string,
    public readonly currentStatus: string
  ) {
    super(
      `Cannot review order ${orderId}: order must be completed or paid, but current status is ${currentStatus}`
    );
    this.name = "OrderNotCompletedError";
  }
}

/**
 * Domain error for attempting to create a review when one already exists
 */
export class ReviewAlreadyExistsError extends Error {
  constructor(public readonly orderId: string) {
    super(`Review already exists for order: ${orderId}`);
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
