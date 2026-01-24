import { injectable, inject } from "tsyringe";
import type { ReviewRepository } from "./review.repo";
import type { BookingRepository } from "@modules/booking/booking.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type {
  ReviewCreateInput,
  ReviewCreateOutput,
  Review,
} from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { Role, BookingStatus } from "@repo/domain";
import { BookingNotFoundError } from "@modules/booking/booking.errors";
import {
  BookingNotCompletedError,
  ReviewAlreadyExistsError,
  UnauthorizedReviewError,
} from "./review.errors";
import { TOKENS } from "@/server/container/tokens";

/**
 * Review service
 * Contains business logic for review operations
 *
 * Manual Test Examples:
 *
 * 1. Create review on completed booking (should succeed):
 *    - Ensure booking exists with status=COMPLETED
 *    - Call review.create with { bookingId, rating: 4, comment: "Great service!" }
 *    - Expected: Review created successfully
 *
 * 2. Create review on non-completed booking (should fail):
 *    - Ensure booking exists with status=PENDING or ACCEPTED
 *    - Call review.create with { bookingId, rating: 4 }
 *    - Expected: BookingNotCompletedError (BAD_REQUEST)
 *
 * 3. Create duplicate review (should fail):
 *    - Create a review for a booking
 *    - Try to create another review for the same booking
 *    - Expected: ReviewAlreadyExistsError (CONFLICT)
 *
 * 4. Unauthorized review creation (should fail):
 *    - As a PRO role, try to create a review
 *    - Expected: UnauthorizedReviewError (FORBIDDEN)
 */
@injectable()
export class ReviewService {
  constructor(
    @inject(TOKENS.ReviewRepository)
    private readonly reviewRepository: ReviewRepository,
    @inject(TOKENS.BookingRepository)
    private readonly bookingRepository: BookingRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository
  ) {}
  /**
   * Create a review for a completed booking
   * Business rules:
   * - Actor must exist (protected)
   * - Booking must exist
   * - Booking.status must be COMPLETED
   * - actor.userId must equal booking.clientUserId (only the client can review)
   * - Only one review per booking (if exists -> return domain error)
   * - rating must be 1..5
   * Return created review
   */
  async createReview(
    actor: Actor,
    input: ReviewCreateInput
  ): Promise<ReviewCreateOutput> {
    // Authorization: Only clients can create reviews
    if (actor.role !== Role.CLIENT) {
      throw new UnauthorizedReviewError(
        "create review",
        "Only clients can create reviews"
      );
    }

    // Validate rating
    if (input.rating < 1 || input.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Get booking
    const booking = await this.bookingRepository.findById(input.bookingId);
    if (!booking) {
      throw new BookingNotFoundError(input.bookingId);
    }

    // Verify booking belongs to client
    if (booking.clientUserId !== actor.id) {
      throw new UnauthorizedReviewError(
        "create review",
        "Booking does not belong to this client"
      );
    }

    // Verify booking is completed
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BookingNotCompletedError(input.bookingId, booking.status);
    }

    // Verify booking has a pro assigned (required for completed bookings)
    if (!booking.proProfileId) {
      throw new Error("Booking must have a pro assigned to be reviewed");
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findByBookingId(
      input.bookingId
    );
    if (existingReview) {
      throw new ReviewAlreadyExistsError(input.bookingId);
    }

    // Create review
    const review = await this.reviewRepository.create({
      bookingId: input.bookingId,
      proProfileId: booking.proProfileId,
      clientUserId: booking.clientUserId,
      rating: input.rating,
      comment: input.comment,
    });

    // Adapt to domain type
    return {
      id: review.id,
      bookingId: review.bookingId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }

  /**
   * Get review by booking ID
   * Authorization: Only client, assigned pro, or admin can view
   * Returns null if review doesn't exist yet
   */
  async getByBookingId(
    actor: Actor,
    bookingId: string
  ): Promise<Review | null> {
    // Get booking to check authorization
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError(bookingId);
    }

    // Authorization: client, assigned pro, or admin
    if (actor.role !== Role.ADMIN) {
      if (actor.role === Role.CLIENT) {
        if (booking.clientUserId !== actor.id) {
          throw new UnauthorizedReviewError(
            "view review",
            "Only the client who made the booking can view this review"
          );
        }
      } else if (actor.role === Role.PRO) {
        // Get pro profile for actor
        const proProfile = await this.proRepository.findByUserId(actor.id);
        if (!proProfile) {
          throw new UnauthorizedReviewError(
            "view review",
            "Pro profile not found"
          );
        }
        // Check if pro is assigned to this booking
        if (booking.proProfileId !== proProfile.id) {
          throw new UnauthorizedReviewError(
            "view review",
            "Only the pro assigned to this booking can view this review"
          );
        }
      } else {
        throw new UnauthorizedReviewError(
          "view review",
          "Only clients, assigned pros, or admins can view reviews"
        );
      }
    }

    // Get review (may be null if not yet created)
    const review = await this.reviewRepository.findByBookingId(bookingId);
    if (!review) {
      return null;
    }
    // Map to domain type
    return {
      id: review.id,
      bookingId: review.bookingId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }

  /**
   * List reviews for a pro profile
   * Public endpoint - anyone can view reviews for a pro
   */
  async listForPro(proProfileId: string, limit?: number, cursor?: string) {
    const reviews = await this.reviewRepository.listForPro(
      proProfileId,
      limit,
      cursor
    );

    // Map to domain type
    return reviews.map((review) => ({
      id: review.id,
      bookingId: review.bookingId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));
  }

  /**
   * Get review status map for multiple bookings
   * Returns a map of bookingId -> hasReview (boolean)
   */
  async getReviewStatusByBookingIds(
    bookingIds: string[]
  ): Promise<Record<string, boolean>> {
    if (bookingIds.length === 0) {
      return {};
    }

    const reviews = await this.reviewRepository.findByBookingIds(bookingIds);
    const reviewMap = new Set(reviews.map((r) => r.bookingId));

    const statusMap: Record<string, boolean> = {};
    for (const bookingId of bookingIds) {
      statusMap[bookingId] = reviewMap.has(bookingId);
    }

    return statusMap;
  }
}
