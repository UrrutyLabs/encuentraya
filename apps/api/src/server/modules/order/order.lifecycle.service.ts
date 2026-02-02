import { injectable, inject } from "tsyringe";
import type { OrderRepository } from "./order.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { Order } from "@repo/domain";
import { OrderStatus, PaymentStatus, PricingMode } from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { MAX_WORK_PROOF_PHOTOS } from "@repo/upload";
import { TOKENS } from "@/server/container";
import { OrderService } from "./order.service";
import type { PaymentServiceFactory } from "@modules/payment";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import {
  validateStateTransition,
  authorizeProAction,
  authorizeClientAction,
  authorizeOrderCancellation,
} from "./order.helpers";

/**
 * Order lifecycle service
 * Handles order state transitions according to ORDER_FLOW.md
 */
@injectable()
export class OrderLifecycleService {
  constructor(
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.OrderService)
    private readonly orderService: OrderService,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.PaymentServiceFactory)
    private readonly paymentServiceFactory: PaymentServiceFactory,
    @inject(TOKENS.PaymentRepository)
    private readonly paymentRepository: PaymentRepository
  ) {}

  /**
   * Accept order (pro accepts the order request)
   * Transition: pending_pro_confirmation → accepted
   */
  async acceptOrder(actor: Actor, orderId: string): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Validate state transition
    validateStateTransition(order.status, OrderStatus.ACCEPTED);

    // Authorization: Pro must be assigned to order, or actor must be admin
    await authorizeProAction(actor, order, "accept order", this.proRepository);

    // Update status to accepted
    const updated = await this.orderService.updateOrderStatus(
      orderId,
      OrderStatus.ACCEPTED
    );
    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }
    return updated;
  }

  /**
   * Confirm order (client authorizes payment)
   * Transition: accepted → confirmed
   * This is when payment authorization happens
   * Note: Payment should already be authorized via createPreauthForOrder before calling this
   */
  async confirmOrder(actor: Actor, orderId: string): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Validate state transition
    validateStateTransition(order.status, OrderStatus.CONFIRMED);

    // Authorization: Client must own order, or actor must be admin
    authorizeClientAction(actor, order, "confirm order");

    // Verify payment is authorized before confirming order
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new Error(
        `Payment not found for order ${orderId}. Payment must be authorized before confirming order.`
      );
    }

    if (payment.status !== PaymentStatus.AUTHORIZED) {
      throw new Error(
        `Payment for order ${orderId} must be AUTHORIZED before confirming. Current payment status: ${payment.status}`
      );
    }

    // Update status to confirmed
    const updated = await this.orderService.updateOrderStatus(
      orderId,
      OrderStatus.CONFIRMED
    );
    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }
    return updated;
  }

  /**
   * Mark order as in progress (pro starts work)
   * Transition: confirmed → in_progress
   */
  async markInProgress(actor: Actor, orderId: string): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Validate state transition
    validateStateTransition(order.status, OrderStatus.IN_PROGRESS);

    // Authorization: Pro must be assigned to order, or actor must be admin
    await authorizeProAction(
      actor,
      order,
      "mark order in progress",
      this.proRepository
    );

    // Update status to in_progress
    const updated = await this.orderService.updateOrderStatus(
      orderId,
      OrderStatus.IN_PROGRESS
    );
    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }
    return updated;
  }

  /**
   * Mark order as arrived (pro marks arrived at location)
   * This is a sub-state within in_progress
   * We can track this via a timestamp, but status remains IN_PROGRESS
   */
  async markArrived(actor: Actor, orderId: string): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Verify order is in IN_PROGRESS status (required for markArrived)
    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new Error(
        `Order ${orderId} is not in IN_PROGRESS status. Current status: ${order.status}`
      );
    }

    // Authorization: Pro must be assigned to order, or actor must be admin
    await authorizeProAction(
      actor,
      order,
      "mark order arrived",
      this.proRepository
    );

    // Update arrivedAt timestamp (status remains IN_PROGRESS)
    // Update the arrivedAt field directly without changing status
    const updated = await this.orderRepository.update(orderId, {
      arrivedAt: new Date(),
    });
    if (!updated) {
      throw new Error(`Failed to update order: ${orderId}`);
    }

    const updatedOrder = await this.orderService.getOrderById(orderId);
    if (!updatedOrder) {
      throw new Error(`Failed to retrieve updated order: ${orderId}`);
    }
    return updatedOrder;
  }

  /**
   * Submit quote (pro sends fixed-price quote)
   * Only for fixed-price orders in status accepted. Status remains accepted.
   */
  async submitQuote(
    actor: Actor,
    orderId: string,
    amountCents: number,
    message?: string
  ): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    if (order.status !== OrderStatus.ACCEPTED) {
      throw new Error(
        `Order ${orderId} must be in status accepted to submit quote. Current: ${order.status}`
      );
    }

    const pricingMode = (order.pricingMode ?? "hourly") as string;
    if (pricingMode !== PricingMode.FIXED) {
      throw new Error(
        `Order ${orderId} is not a fixed-price order. Submit quote is only for fixed-price orders.`
      );
    }

    await authorizeProAction(actor, order, "submit quote", this.proRepository);

    if (amountCents <= 0) {
      throw new Error("Quote amount must be greater than 0");
    }

    const updated = await this.orderRepository.update(orderId, {
      quotedAmountCents: amountCents,
      quotedAt: new Date(),
      quoteMessage: message ?? null,
    });

    if (!updated) {
      throw new Error(`Failed to update order ${orderId}`);
    }

    return this.orderService.getOrderById(orderId) as Promise<Order>;
  }

  /**
   * Accept quote (client accepts pro's fixed-price quote)
   * Only for fixed-price orders in status accepted with quote set. Status remains accepted.
   */
  async acceptQuote(actor: Actor, orderId: string): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    if (order.status !== OrderStatus.ACCEPTED) {
      throw new Error(
        `Order ${orderId} must be in status accepted to accept quote. Current: ${order.status}`
      );
    }

    const pricingMode = (order.pricingMode ?? "hourly") as string;
    if (pricingMode !== PricingMode.FIXED) {
      throw new Error(
        `Order ${orderId} is not a fixed-price order. Accept quote is only for fixed-price orders.`
      );
    }

    if (order.quotedAmountCents == null || order.quotedAmountCents <= 0) {
      throw new Error(
        `Order ${orderId} has no quote to accept. Pro must submit a quote first.`
      );
    }

    authorizeClientAction(actor, order, "accept quote");

    const updated = await this.orderRepository.update(orderId, {
      quoteAcceptedAt: new Date(),
    });

    if (!updated) {
      throw new Error(`Failed to update order ${orderId}`);
    }

    return this.orderService.getOrderById(orderId) as Promise<Order>;
  }

  /**
   * Submit completion (pro marks fixed-price job complete, no hours)
   * Transition: in_progress → awaiting_client_approval
   * Only for fixed-price orders.
   */
  async submitCompletion(
    actor: Actor,
    orderId: string,
    options?: { photoUrls?: string[] }
  ): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new Error(
        `Order ${orderId} must be in progress to submit completion. Current: ${order.status}`
      );
    }

    const pricingMode = (order.pricingMode ?? "hourly") as string;
    if (pricingMode !== PricingMode.FIXED) {
      throw new Error(
        `Order ${orderId} is not a fixed-price order. Use submitHours for hourly orders.`
      );
    }

    await authorizeProAction(
      actor,
      order,
      "submit completion",
      this.proRepository
    );

    if (
      options?.photoUrls &&
      options.photoUrls.length > MAX_WORK_PROOF_PHOTOS
    ) {
      throw new Error(
        `Work proof photos cannot exceed ${MAX_WORK_PROOF_PHOTOS}. Received ${options.photoUrls.length}.`
      );
    }

    await this.orderRepository.update(orderId, {
      completedAt: new Date(),
      finalHoursSubmitted: null,
      workProofPhotoUrlsJson: options?.photoUrls
        ? (options.photoUrls as unknown)
        : undefined,
    });

    const updated = await this.orderService.updateOrderStatus(
      orderId,
      OrderStatus.AWAITING_CLIENT_APPROVAL
    );
    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }
    return updated;
  }

  /**
   * Submit hours (pro completes work and submits final hours)
   * Transition: in_progress → awaiting_client_approval
   */
  async submitHours(
    actor: Actor,
    orderId: string,
    finalHours: number,
    options?: { photoUrls?: string[] }
  ): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Validate state transition
    validateStateTransition(order.status, OrderStatus.AWAITING_CLIENT_APPROVAL);

    // Authorization: Pro must be assigned to order, or actor must be admin
    await authorizeProAction(actor, order, "submit hours", this.proRepository);

    // Validate final hours
    if (finalHours <= 0) {
      throw new Error("Final hours must be greater than 0");
    }

    if (
      options?.photoUrls &&
      options.photoUrls.length > MAX_WORK_PROOF_PHOTOS
    ) {
      throw new Error(
        `Work proof photos cannot exceed ${MAX_WORK_PROOF_PHOTOS}. Received ${options.photoUrls.length}.`
      );
    }

    // Update order with final hours and set status to awaiting_client_approval
    await this.orderRepository.update(orderId, {
      finalHoursSubmitted: finalHours,
      completedAt: new Date(),
      workProofPhotoUrlsJson: options?.photoUrls
        ? (options.photoUrls as unknown)
        : undefined,
    });

    const updated = await this.orderService.updateOrderStatus(
      orderId,
      OrderStatus.AWAITING_CLIENT_APPROVAL
    );
    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }
    return updated;
  }

  /**
   * Approve hours (client accepts submitted hours)
   * This triggers finalization and payment capture
   * Transition: awaiting_client_approval → completed (then → paid after capture)
   * Note: Finalization is handled separately by OrderFinalizationService
   */
  async approveHours(actor: Actor, orderId: string): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Validate that transition to COMPLETED is possible (finalization service will do the actual transition)
    validateStateTransition(order.status, OrderStatus.COMPLETED);

    // Authorization: Client must own order, or actor must be admin
    authorizeClientAction(actor, order, "approve hours");

    const pricingMode = (order.pricingMode ?? "hourly") as string;
    const isFixed = pricingMode === PricingMode.FIXED;

    // For hourly orders: require final hours submitted. For fixed: no hours (pro used submitCompletion).
    if (!isFixed && !order.finalHoursSubmitted) {
      throw new Error("Final hours must be submitted before approval");
    }

    // Finalization will be handled by OrderFinalizationService (uses quotedAmountCents for fixed)
    const approvedHours = isFixed ? 0 : (order.finalHoursSubmitted as number);
    await this.orderRepository.update(orderId, {
      approvedHours,
      approvalMethod: "client_accepted",
    });

    // Return updated order (finalization will be called separately)
    return this.orderService.getOrderById(orderId) as Promise<Order>;
  }

  /**
   * Dispute hours (client disputes submitted hours)
   * Transition: awaiting_client_approval → disputed
   */
  async disputeHours(
    actor: Actor,
    orderId: string,
    reason: string
  ): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Validate state transition
    validateStateTransition(order.status, OrderStatus.DISPUTED);

    // Authorization: Client must own order, or actor must be admin
    authorizeClientAction(actor, order, "dispute hours");

    // Update status to disputed with reason
    const updated = await this.orderService.updateOrderStatus(
      orderId,
      OrderStatus.DISPUTED,
      {
        disputeReason: reason,
        disputeOpenedBy: actor.id,
      }
    );
    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }
    return updated;
  }

  /**
   * Cancel order
   * Can be called by client or pro depending on order ownership
   * Valid transitions: pending_pro_confirmation → canceled, accepted → canceled,
   * confirmed → canceled, in_progress → canceled (via state machine),
   * disputed → canceled
   */
  async cancelOrder(
    actor: Actor,
    orderId: string,
    reason?: string
  ): Promise<Order> {
    const order = await this.orderService.getOrderOrThrow(orderId);

    // Validate state transition (will throw if transition is invalid)
    validateStateTransition(order.status, OrderStatus.CANCELED);

    // Authorization: Client or pro must own order, or actor must be admin
    await authorizeOrderCancellation(actor, order, this.proRepository);

    // Update status to canceled
    const updated = await this.orderService.updateOrderStatus(
      orderId,
      OrderStatus.CANCELED,
      {
        cancelReason: reason,
      }
    );
    if (!updated) {
      throw new Error(`Failed to update order status: ${orderId}`);
    }
    return updated;
  }
}
