import { injectable, inject } from "tsyringe";
import type { ReviewRepository } from "./review.repo";
import type { OrderRepository } from "@modules/order/order.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { ProService } from "@modules/pro/pro.service";
import type { AvatarUrlService } from "@modules/avatar/avatar-url.service";
import type {
  ReviewCreateInput,
  ReviewCreateOutput,
  Review,
} from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { Role, OrderStatus } from "@repo/domain";
import { OrderNotFoundError } from "@modules/order/order.errors";
import {
  OrderNotCompletedError,
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
 * 1. Create review on completed order (should succeed):
 *    - Ensure order exists with status=COMPLETED or PAID
 *    - Call review.create with { orderId, rating: 4, comment: "Great service!" }
 *    - Expected: Review created successfully
 *
 * 2. Create review on non-completed order (should fail):
 *    - Ensure order exists with status=PENDING or ACCEPTED
 *    - Call review.create with { orderId, rating: 4 }
 *    - Expected: OrderNotCompletedError (BAD_REQUEST)
 *
 * 3. Create duplicate review (should fail):
 *    - Create a review for an order
 *    - Try to create another review for the same order
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
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.ProService)
    private readonly proService: ProService,
    @inject(TOKENS.AvatarUrlService)
    private readonly avatarUrlService: AvatarUrlService
  ) {}
  /**
   * Create a review for a completed order
   * Business rules:
   * - Actor must exist (protected)
   * - Order must exist
   * - Order.status must be COMPLETED or PAID
   * - actor.userId must equal order.clientUserId (only the client can review)
   * - Only one review per order (if exists -> return domain error)
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

    // Get order
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    // Verify order belongs to client
    if (order.clientUserId !== actor.id) {
      throw new UnauthorizedReviewError(
        "create review",
        "Order does not belong to this client"
      );
    }

    // Verify order is completed or paid
    if (
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.PAID
    ) {
      throw new OrderNotCompletedError(input.orderId, order.status);
    }

    // Verify order has a pro assigned (required for completed orders)
    if (!order.proProfileId) {
      throw new Error("Order must have a pro assigned to be reviewed");
    }

    // Check if review already exists
    const existingReview = await this.reviewRepository.findByOrderId(
      input.orderId
    );
    if (existingReview) {
      throw new ReviewAlreadyExistsError(input.orderId);
    }

    // Create review
    const review = await this.reviewRepository.create({
      orderId: input.orderId,
      proProfileId: order.proProfileId,
      clientUserId: order.clientUserId,
      rating: input.rating,
      comment: input.comment,
    });

    // Hook: Notify ProService that a review was created
    // Note: Rating is calculated dynamically from reviews, so no stored fields need updating
    // This hook is here for consistency and potential future use (e.g., caching, analytics)
    if (order.proProfileId) {
      try {
        await this.proService.onReviewCreated(order.proProfileId);
      } catch (error) {
        // Log but don't fail review creation if hook fails
        console.error(
          `Failed to notify pro service about review creation for pro ${order.proProfileId}:`,
          error
        );
      }
    }

    // Adapt to domain type
    return {
      id: review.id,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }

  /**
   * Get review by order ID
   * Authorization: Only client, assigned pro, or admin can view
   * Returns null if review doesn't exist yet
   */
  async getByOrderId(actor: Actor, orderId: string): Promise<Review | null> {
    // Get order to check authorization
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // Authorization: client, assigned pro, or admin
    if (actor.role !== Role.ADMIN) {
      if (actor.role === Role.CLIENT) {
        if (order.clientUserId !== actor.id) {
          throw new UnauthorizedReviewError(
            "view review",
            "Only the client who made the order can view this review"
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
        // Check if pro is assigned to this order
        if (order.proProfileId !== proProfile.id) {
          throw new UnauthorizedReviewError(
            "view review",
            "Only the pro assigned to this order can view this review"
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
    const review = await this.reviewRepository.findByOrderId(orderId);
    if (!review) {
      return null;
    }
    // Map to domain type
    return {
      id: review.id,
      orderId: review.orderId,
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

    // Resolve client avatar URLs in parallel, then map to domain type
    const withAvatars = await Promise.all(
      reviews.map(async (review) => {
        const clientAvatarUrl = await this.avatarUrlService.resolveClientAvatar(
          review.clientUserId,
          review.clientAvatarPath
        );
        return {
          id: review.id,
          orderId: review.orderId,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          clientDisplayName: review.clientDisplayName,
          clientAvatarUrl,
        };
      })
    );
    return withAvatars;
  }

  /**
   * Get review status map for multiple orders
   * Returns a map of orderId -> hasReview (boolean)
   */
  async getReviewStatusByOrderIds(
    orderIds: string[]
  ): Promise<Record<string, boolean>> {
    if (orderIds.length === 0) {
      return {};
    }

    const reviews = await this.reviewRepository.findByOrderIds(orderIds);
    const reviewMap = new Set(reviews.map((r) => r.orderId));

    const statusMap: Record<string, boolean> = {};
    for (const orderId of orderIds) {
      statusMap[orderId] = reviewMap.has(orderId);
    }

    return statusMap;
  }
}
