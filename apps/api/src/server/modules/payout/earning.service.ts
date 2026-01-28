import { injectable, inject } from "tsyringe";
import type { EarningRepository } from "./earning.repo";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { OrderRepository } from "@modules/order/order.repo";
import type { OrderLineItemRepository } from "@modules/order/orderLineItem.repo";
import {
  PaymentStatus,
  Role,
  OrderStatus,
  OrderLineItemType,
} from "@repo/domain";
import type { Actor } from "@infra/auth/roles";
import { TOKENS } from "@/server/container/tokens";
import { computeAvailableAt } from "./config";
import { OrderNotFoundError } from "@modules/order/order.errors";

/**
 * Error thrown when earning cannot be created
 */
export class EarningCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EarningCreationError";
  }
}

/**
 * Pro earning output
 * Represents an earning as returned to a pro user
 */
export interface ProEarning {
  id: string;
  orderId: string;
  orderDisplayId: string;
  grossAmount: number;
  platformFeeAmount: number;
  netAmount: number;
  status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
  currency: string;
  availableAt: Date | null;
  createdAt: Date;
}

/**
 * Earning service
 * Contains business logic for earning operations
 */
@injectable()
export class EarningService {
  constructor(
    @inject(TOKENS.EarningRepository)
    private readonly earningRepository: EarningRepository,
    @inject(TOKENS.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.OrderLineItemRepository)
    private readonly orderLineItemRepository: OrderLineItemRepository
  ) {}

  /**
   * Create an earning record for a completed order with captured payment
   * Rules:
   * - order must exist
   * - order status must be COMPLETED
   * - payment for order must be CAPTURED
   * - earning must not already exist for orderId
   * - compute amounts from order line items:
   *   - grossAmount = labor line item amount
   *   - platformFeeAmount = platform_fee line item amount
   *   - netAmount = grossAmount - platformFeeAmount
   * - set status=PENDING and availableAt = now + coolingOff
   */
  async createEarningForOrder(
    actorOrSystem: Actor | { role: "SYSTEM" },
    orderId: string
  ): Promise<void> {
    // Get order
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    // Validate order status is COMPLETED
    if (order.status !== OrderStatus.COMPLETED) {
      throw new EarningCreationError(
        `Order ${orderId} must be COMPLETED to create earning. Current status: ${order.status}`
      );
    }

    // Check if earning already exists
    const existingEarning = await this.earningRepository.findByOrderId(orderId);
    if (existingEarning) {
      // Idempotent: if earning already exists, skip creation
      return;
    }

    // Get payment for order
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new EarningCreationError(`No payment found for order ${orderId}`);
    }

    // Validate payment status is CAPTURED
    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new EarningCreationError(
        `Payment for order ${orderId} must be CAPTURED to create earning. Current status: ${payment.status}`
      );
    }

    // Validate payment has captured amount
    if (!payment.amountCaptured || payment.amountCaptured <= 0) {
      throw new EarningCreationError(
        `Payment for order ${orderId} has no captured amount`
      );
    }

    // Validate order has proProfileId
    if (!order.proProfileId) {
      throw new EarningCreationError(`Order ${orderId} has no proProfileId`);
    }

    // Get order line items to extract amounts
    const lineItems = await this.orderLineItemRepository.findByOrderId(orderId);

    // Extract labor amount (grossAmount)
    const laborItem = lineItems.find(
      (item) => item.type === OrderLineItemType.LABOR
    );
    if (!laborItem) {
      throw new EarningCreationError(`Order ${orderId} has no labor line item`);
    }
    const grossAmount = Math.round(laborItem.amount * 100); // Convert to minor units (cents)

    // Extract platform fee amount
    const platformFeeItem = lineItems.find(
      (item) => item.type === OrderLineItemType.PLATFORM_FEE
    );
    if (!platformFeeItem) {
      throw new EarningCreationError(
        `Order ${orderId} has no platform_fee line item`
      );
    }
    const platformFeeAmount = Math.round(platformFeeItem.amount * 100); // Convert to minor units (cents)

    // Calculate net amount
    const netAmount = grossAmount - platformFeeAmount;

    // Compute availableAt (now + cooling-off)
    const availableAt = computeAvailableAt();

    // Create earning
    await this.earningRepository.createFromOrder({
      orderId,
      proProfileId: order.proProfileId,
      clientUserId: order.clientUserId,
      currency: order.currency,
      grossAmount,
      platformFeeAmount,
      netAmount,
      availableAt,
    });
  }

  /**
   * Mark all due earnings as PAYABLE
   * Moves all earnings with status=PENDING and availableAt <= now to PAYABLE
   * Idempotent operation
   */
  async markPayableIfDue(now: Date = new Date()): Promise<number> {
    // Find all PENDING earnings that are due (availableAt <= now)
    // Note: listPayableByPro filters by PAYABLE status, so we need to query differently
    // We'll use a different approach: query PENDING earnings and filter by availableAt

    // Since we don't have a direct query method, we'll need to add one to the repository
    // For now, let's use markManyStatus after finding the IDs
    // Actually, let's check the repository interface again...

    // The repository has listPayableByPro which filters by PAYABLE status,
    // but we need to find PENDING earnings with availableAt <= now
    // We need to add a method to find pending earnings due, or we can query all and filter

    // For MVP, let's add a helper method to the repository
    // But wait, the requirement says to use existing methods if possible

    // Actually, looking at the requirement again: "moves all earnings with status=PENDING and availableAt <= now to PAYABLE"
    // We need to query PENDING earnings where availableAt <= now

    // Since the repository doesn't have this exact query, we'll need to add it
    // But the requirement says to use existing repositories... Let me check if we can work around it

    // Actually, I think we need to add a method to the repository for this
    // But let's implement it in the service using a workaround first, then we can optimize

    // For now, let's implement markPayableIfDue by querying the database directly
    // But that violates the "no Prisma outside repos" rule

    // Let me add a method to the repository interface for this specific use case
    // Actually, let me check the earning.repo.ts again to see what methods exist

    // Looking at the interface, we have:
    // - listPayableByPro (filters by PAYABLE status)
    // - markStatus
    // - markManyStatus

    const pendingDueEarnings = await this.earningRepository.listPendingDue(now);

    if (pendingDueEarnings.length === 0) {
      return 0;
    }

    // Mark all as PAYABLE
    const ids = pendingDueEarnings.map((e) => e.id);
    await this.earningRepository.markManyStatus(ids, "PAYABLE");

    return ids.length;
  }

  /**
   * Get earnings for a pro
   * Returns list of earnings with optional filtering
   */
  async getEarningsForPro(
    actor: Actor,
    options?: {
      status?: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
      limit?: number;
      offset?: number;
    }
  ): Promise<ProEarning[]> {
    // Authorization: Actor must be a pro
    if (actor.role !== Role.PRO) {
      throw new EarningCreationError("Only pros can access earnings");
    }

    // Get pro profile for actor
    const proProfile = await this.proRepository.findByUserId(actor.id);
    if (!proProfile) {
      throw new EarningCreationError("Pro profile not found");
    }

    const earnings = await this.earningRepository.listByProProfileId(
      proProfile.id,
      {
        status: options?.status,
        limit: options?.limit,
        offset: options?.offset,
      }
    );

    return earnings.map((earning) => ({
      id: earning.id,
      orderId: earning.orderId,
      orderDisplayId: earning.orderDisplayId || earning.orderId.slice(-6), // Fallback to last 6 chars if no displayId
      grossAmount: earning.grossAmount,
      platformFeeAmount: earning.platformFeeAmount,
      netAmount: earning.netAmount,
      status: earning.status,
      currency: earning.currency,
      availableAt: earning.availableAt,
      createdAt: earning.createdAt,
    }));
  }
}
