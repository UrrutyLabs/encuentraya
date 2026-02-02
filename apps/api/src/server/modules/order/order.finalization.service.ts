import { injectable, inject } from "tsyringe";
import type { OrderRepository } from "./order.repo";
import type { OrderLineItemRepository } from "./orderLineItem.repo";
import type { ReceiptRepository } from "./receipt.repo";
import type { Order } from "@repo/domain";
import {
  OrderStatus,
  ApprovalMethod,
  PaymentStatus,
  PricingMode,
} from "@repo/domain";
import { TOKENS } from "@/server/container";
import {
  buildLineItemsForFinalization,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  calculateTaxableBase,
  DEFAULT_PLATFORM_FEE_RATE,
  DEFAULT_TAX_RATE,
} from "./order.calculations";
import { roundMinorUnits } from "@repo/domain";
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
    @inject(TOKENS.ReceiptRepository)
    private readonly receiptRepository: ReceiptRepository,
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
    const pricingMode = (updatedOrder.pricingMode ?? "hourly") as string;
    const isFixed = pricingMode === PricingMode.FIXED;
    if (
      isFixed &&
      (updatedOrder.quotedAmountCents == null ||
        updatedOrder.quotedAmountCents <= 0)
    ) {
      throw new Error(
        `Order ${orderId} is fixed-price but has no quoted amount. Cannot finalize.`
      );
    }
    const laborAmountCents = isFixed
      ? (updatedOrder.quotedAmountCents as number)
      : undefined;

    const lineItems = buildLineItemsForFinalization(
      updatedOrder,
      approvedHours,
      platformFeeRate,
      taxRate,
      laborAmountCents
    );

    // Replace all existing line items with new ones
    await this.orderLineItemRepository.replaceOrderLineItems(
      orderId,
      lineItems
    );

    // Step 4: Compute totals from line items and persist
    // All line items are already in minor units after buildLineItemsForFinalization
    const finalLineItems =
      await this.orderLineItemRepository.findByOrderId(orderId);

    // All calculations in minor units
    const subtotal = roundMinorUnits(calculateSubtotal(finalLineItems));
    const taxableBase = roundMinorUnits(calculateTaxableBase(finalLineItems));
    const taxAmount = roundMinorUnits(calculateTax(taxableBase, taxRate));
    const total = roundMinorUnits(calculateTotal(subtotal, taxAmount));

    // Extract platform fee from line items (already in minor units)
    const platformFeeItem = finalLineItems.find(
      (item) => item.type === "platform_fee"
    );
    const platformFeeAmount = platformFeeItem
      ? roundMinorUnits(platformFeeItem.amount)
      : 0;

    // Update order with calculated totals (all in minor units)
    const finalizedOrder = await this.orderRepository.update(orderId, {
      subtotalAmount: subtotal, // Minor units
      platformFeeAmount: platformFeeAmount, // Minor units
      taxAmount: taxAmount, // Minor units
      totalAmount: total, // Minor units
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

    // Persist receipt (immutable snapshot for display/audit)
    const finalizedAt = new Date();
    const receiptLineItems = finalLineItems.map((item) => ({
      type: item.type,
      description: item.description,
      amount: item.amount,
    }));
    const laborItem = finalLineItems.find((i) => i.type === "labor");
    const laborAmount = laborItem ? roundMinorUnits(laborItem.amount) : 0;
    try {
      await this.receiptRepository.create({
        orderId,
        lineItems: receiptLineItems,
        laborAmount,
        platformFeeAmount,
        platformFeeRate,
        taxAmount,
        taxRate,
        subtotalAmount: subtotal,
        totalAmount: total,
        currency: updatedOrder.currency,
        finalizedAt,
        approvedHours,
      });
    } catch (error) {
      // Idempotent: if receipt already exists (e.g. duplicate finalize), log and continue
      const existing = await this.receiptRepository.findByOrderId(orderId);
      if (!existing) {
        console.error(`Failed to create receipt for order ${orderId}:`, error);
        throw error;
      }
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
