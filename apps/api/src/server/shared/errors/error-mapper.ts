import { TRPCError } from "@trpc/server";
import {
  OrderNotCompletedError,
  ReviewAlreadyExistsError,
  UnauthorizedReviewError,
} from "@modules/review/review.errors";
import {
  InvalidOrderStateError,
  UnauthorizedOrderActionError,
  OrderNotFoundError,
} from "@modules/order/order.errors";

/**
 * Maps domain errors to tRPC errors
 */
export function mapDomainErrorToTRPCError(error: unknown): TRPCError {
  if (error instanceof OrderNotCompletedError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
    });
  }

  if (error instanceof ReviewAlreadyExistsError) {
    return new TRPCError({
      code: "CONFLICT",
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedReviewError) {
    return new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
    });
  }

  if (error instanceof InvalidOrderStateError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedOrderActionError) {
    return new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
    });
  }

  if (error instanceof OrderNotFoundError) {
    return new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
    });
  }

  // Generic error fallback
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "An error occurred",
  });
}
