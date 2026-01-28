import { injectable, inject } from "tsyringe";
import type { OrderRepository } from "./order.repo";
import type { OrderLineItemRepository } from "./orderLineItem.repo";
import type { Order } from "@repo/domain";
import { OrderStatus, ApprovalMethod, PaymentStatus } from "@repo/domain";
import { TOKENS } from "@/server/container";
import {
  buildLineItemsForFinalization,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  calculateTaxableBase,
  roundCurrency,
  DEFAULT_PLATFORM_FEE_RATE,
  DEFAULT_TAX_RATE,
} from "./order.calculations";
import { OrderService } from "./order.service";
import type { PaymentServiceFactory } from "@modules/payment";
import type { PaymentRepository } from "@modules/payment/payment.repo";
import type { EarningService } from "@modules/payout/earning.service";
import { validateStateTransition } from "./order.helpers";

/**
 * Order finalization service
 * Implements the finalization algorithm from ARCHITECTURE.md
 * Triggered when client accepts (or auto-accept fires)
 */
@injectable()
export class OrderFinalizationService {
  constructor(
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.OrderLineItemRepository)
    private readonly orderLineItemRepository: OrderLineItemRepository,
    @inject(TOKENS.OrderService)
    private readonly orderService: OrderService,
    @inject(TOKENS.PaymentServiceFactory)
    private readonly paymentServiceFactory: PaymentServiceFactory,
    @inject(TOKENS.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
    @inject(TOKENS.EarningService)
    private readonly earningService: EarningService
  ) {}

  /**
   * Finalize an order
   * Steps:
   * 1. Lock order (idempotency check)
   * 2. Set approved_hours
   * 3. Create/replace final line items (labor, platform_fee, tax)
   * 4. Compute totals from line items and persist
   * 5. Return finalized order
   *
   * Note: Payment capture happens in PaymentService after finalization
   */
  async finalizeOrder(
    orderId: string,
    approvedHours: number,
    approvalMethod: ApprovalMethod
  ): Promise<Order> {
    // Step 1: Lock order (idempotency check)
    // Get current order to check status
    const currentOrder = await this.orderService.getOrderOrThrow(orderId);

    // Check if order is already finalized (terminal states)
    if (
      currentOrder.status === OrderStatus.COMPLETED ||
      currentOrder.status === OrderStatus.PAID
    ) {
      throw new Error(`Order ${orderId} is already finalized`);
    }

    // Validate state transition: awaiting_client_approval → completed
    validateStateTransition(currentOrder.status, OrderStatus.COMPLETED);

    // Step 2: Set approved_hours and approval method
    const updatedOrder = await this.orderRepository.update(orderId, {
      approvedHours,
      approvalMethod: approvalMethod as string,
    });

    if (!updatedOrder) {
      throw new Error(`Failed to update order: ${orderId}`);
    }

    // Step 3: Create/replace final line items
    const platformFeeRate = DEFAULT_PLATFORM_FEE_RATE;
    const taxRate = updatedOrder.taxRate ?? DEFAULT_TAX_RATE;

    const lineItems = buildLineItemsForFinalization(
      updatedOrder,
      approvedHours,
      platformFeeRate,
      taxRate
    );

    // Replace all existing line items with new ones
    await this.orderLineItemRepository.replaceOrderLineItems(
      orderId,
      lineItems
    );

    // Step 4: Compute totals from line items and persist
    const finalLineItems =
      await this.orderLineItemRepository.findByOrderId(orderId);

    const subtotal = roundCurrency(calculateSubtotal(finalLineItems));
    const taxableBase = roundCurrency(calculateTaxableBase(finalLineItems));
    const taxAmount = roundCurrency(calculateTax(taxableBase, taxRate));
    const total = roundCurrency(calculateTotal(subtotal, taxAmount));

    // Extract platform fee from line items
    const platformFeeItem = finalLineItems.find(
      (item) => item.type === "platform_fee"
    );
    const platformFeeAmount = platformFeeItem
      ? roundCurrency(platformFeeItem.amount)
      : 0;

    // Update order with calculated totals
    const finalizedOrder = await this.orderRepository.update(orderId, {
      subtotalAmount: subtotal,
      platformFeeAmount: platformFeeAmount,
      taxAmount: taxAmount,
      totalAmount: total,
      totalsCalculatedAt: new Date(),
      taxScheme: "iva",
      taxRate: taxRate,
      taxIncluded: false,
      taxRegion: "UY",
      taxCalculatedAt: new Date(),
    });

    if (!finalizedOrder) {
      throw new Error(`Failed to finalize order: ${orderId}`);
    }

    // Update status to COMPLETED
    await this.orderRepository.updateStatus(orderId, OrderStatus.COMPLETED);

    // Step 5: Capture payment if authorized and create earning
    // Payment capture happens after finalization (when totals are known)
    try {
      const payment = await this.paymentRepository.findByOrderId(orderId);

      if (payment && payment.status === PaymentStatus.AUTHORIZED) {
        // Get payment service using factory
        const paymentService = await this.paymentServiceFactory(
          payment.provider
        );

        // Attempt to capture payment
        // If capture succeeds, create earning record
        try {
          await paymentService.capturePayment(payment.id);

          // Step 6: Create earning record after successful payment capture
          // Payment status is now CAPTURED (updated synchronously by capturePayment)
          try {
            await this.earningService.createEarningForOrder(
              { role: "SYSTEM" },
              orderId
            );
          } catch (error) {
            // Log but don't fail finalization if earning creation fails
            console.error(
              `Failed to create earning for order ${orderId}:`,
              error
            );
          }
        } catch (error) {
          // Log but don't fail finalization if capture fails
          // Payment can be captured manually later if needed
          console.error(
            `Failed to capture payment ${payment.id} for order ${orderId}:`,
            error
          );
        }
      }
    } catch (error) {
      // Log but don't fail finalization if payment lookup fails
      console.error(
        `Failed to process payment capture for order ${orderId}:`,
        error
      );
    }

    // Step 7: Return finalized order
    return this.orderService.getOrderOrThrow(orderId);
  }
}
