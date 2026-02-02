import { injectable, inject } from "tsyringe";
import type { PaymentRepository } from "./payment.repo";
import type { PaymentEventRepository } from "./paymentEvent.repo";
import type { OrderRepository } from "@modules/order/order.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { PaymentProviderClient } from "./provider";
import type { Actor } from "@infra/auth/roles";
import {
  PaymentProvider,
  PaymentType,
  PaymentStatus,
  OrderStatus,
  Role,
} from "@repo/domain";
import { OrderNotFoundError } from "@modules/order/order.errors";
import { TOKENS } from "@/server/container/tokens";
import { getPaymentProviderClient } from "./registry";
import type { EarningService } from "@modules/payout/earning.service";
import type { AuditService } from "@modules/audit/audit.service";
import { AuditEventType } from "@modules/audit/audit.repo";
import type { ClientProfileService } from "@modules/user/clientProfile.service";

/**
 * Payment service
 * Contains business logic for payment operations
 */
@injectable()
export class PaymentService {
  constructor(
    private readonly providerClient: PaymentProviderClient,
    private readonly provider: PaymentProvider = PaymentProvider.MERCADO_PAGO,
    @inject(TOKENS.PaymentRepository)
    private readonly paymentRepository: PaymentRepository,
    @inject(TOKENS.PaymentEventRepository)
    private readonly paymentEventRepository: PaymentEventRepository,
    @inject(TOKENS.OrderRepository)
    private readonly orderRepository: OrderRepository,
    @inject(TOKENS.ProRepository)
    private readonly proRepository: ProRepository,
    @inject(TOKENS.EarningService)
    private readonly earningService: EarningService,
    @inject(TOKENS.AuditService)
    private readonly auditService: AuditService,
    @inject(TOKENS.ClientProfileService)
    private readonly clientProfileService: ClientProfileService
  ) {}

  /**
   * Get the provider client for this service instance
   */
  getProviderClient(): PaymentProviderClient {
    return this.providerClient;
  }

  /**
   * Create a preauthorization for an order
   * Business rules:
   * - Actor must be logged in and must be the order client
   * - Order must be in ACCEPTED status (pro has accepted, client needs to authorize payment)
   * - Create a Payment row with status CREATED + idempotencyKey
   * - Call provider client createPreauth -> store providerReference + checkoutUrl, update status REQUIRES_ACTION
   * - Return checkoutUrl
   */
  async createPreauthForOrder(
    actor: Actor,
    input: { orderId: string }
  ): Promise<{ paymentId: string; checkoutUrl: string | null }> {
    // Authorization: Only clients can create payments
    if (actor.role !== Role.CLIENT) {
      throw new Error("Only clients can create payments");
    }

    // Get order
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) {
      throw new OrderNotFoundError(input.orderId);
    }

    // Verify order belongs to client
    if (order.clientUserId !== actor.id) {
      throw new Error("Order does not belong to this client");
    }

    // Verify order is in ACCEPTED status (pro has accepted, ready for payment authorization)
    if (order.status !== OrderStatus.ACCEPTED) {
      throw new Error(
        `Order must be in ACCEPTED status, current status: ${order.status}`
      );
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findByOrderId(
      input.orderId
    );
    if (existingPayment) {
      // Return existing payment if it's still in a valid state
      if (
        existingPayment.status === PaymentStatus.CREATED ||
        existingPayment.status === PaymentStatus.REQUIRES_ACTION
      ) {
        return {
          paymentId: existingPayment.id,
          checkoutUrl: existingPayment.checkoutUrl,
        };
      }
      throw new Error("Payment already exists for this order");
    }

    // Calculate amount from order (use totalAmount if finalized, otherwise estimate)
    // Payment amounts must be in MINOR units (e.g., 40260 cents)
    let amountEstimated: number;
    if (order.totalAmount !== null) {
      amountEstimated = Math.round(order.totalAmount);
    } else {
      const pricingMode = (order.pricingMode ?? "hourly") as string;
      if (pricingMode === "fixed") {
        if (
          order.quotedAmountCents == null ||
          order.quotedAmountCents <= 0 ||
          !order.quoteAcceptedAt
        ) {
          throw new Error(
            "Quote must be submitted and accepted before authorizing payment for fixed-price orders"
          );
        }
        amountEstimated = order.quotedAmountCents;
      } else {
        const totalAmount =
          order.hourlyRateSnapshotAmount * (order.estimatedHours ?? 0);
        amountEstimated = Math.round(totalAmount);
      }
    }

    // Generate idempotency key
    const idempotencyKey = `${input.orderId}-${Date.now()}`;

    // Fetch client profile information for better approval rates
    let payerInfo:
      | { email?: string; firstName?: string; lastName?: string }
      | undefined;
    try {
      const clientProfile = await this.clientProfileService.getProfile(
        actor.id
      );
      if (
        clientProfile.email ||
        clientProfile.firstName ||
        clientProfile.lastName
      ) {
        payerInfo = {
          email: clientProfile.email || undefined,
          firstName: clientProfile.firstName || undefined,
          lastName: clientProfile.lastName || undefined,
        };
      }
    } catch (error) {
      // Log but don't fail - payer info is optional
      console.warn(`Failed to fetch client profile for payment: ${error}`);
    }

    // Create payment record with CREATED status
    const payment = await this.paymentRepository.create({
      provider: this.provider,
      type: PaymentType.PREAUTH,
      orderId: input.orderId,
      clientUserId: actor.id,
      proProfileId: order.proProfileId,
      currency: order.currency,
      amountEstimated,
      idempotencyKey,
    });

    try {
      // Call provider to create preauth
      const preauthResult = await this.providerClient.createPreauth({
        orderId: input.orderId,
        clientUserId: actor.id,
        proProfileId: order.proProfileId,
        amount: {
          amount: amountEstimated,
          currency: order.currency,
        },
        idempotencyKey,
        payer: payerInfo,
        categoryId: order.categoryId,
      });

      // Update payment with provider reference and checkout URL
      await this.paymentRepository.updateStatusAndAmounts(payment.id, {
        status: preauthResult.status,
        providerReference: preauthResult.providerReference,
        checkoutUrl: preauthResult.checkoutUrl,
      });

      return {
        paymentId: payment.id,
        checkoutUrl: preauthResult.checkoutUrl,
      };
    } catch (error) {
      // If provider call fails, mark payment as FAILED
      await this.paymentRepository.updateStatusAndAmounts(payment.id, {
        status: PaymentStatus.FAILED,
      });
      throw error;
    }
  }

  /**
   * Handle provider webhook event
   * Business rules:
   * - Persist PaymentEvent(raw) - provides idempotency via event storage
   * - Map provider status to PaymentStatus using safe transitions
   * - If payment becomes AUTHORIZED -> set order status from ACCEPTED -> CONFIRMED
   * - If payment fails/cancelled -> keep order in ACCEPTED (client can retry)
   *
   * Idempotency: Events are stored in PaymentEvent table. If the same event arrives twice,
   * it's safe to process again as status transitions are validated.
   *
   * Order Status Behavior:
   * - Payment AUTHORIZED: Order ACCEPTED -> CONFIRMED (ready for pro to start work)
   * - Payment FAILED/CANCELLED: Order stays in ACCEPTED (client can retry or cancel)
   * - Payment REFUNDED: Order status unchanged (already completed/cancelled)
   */
  async handleProviderWebhook(event: {
    provider: PaymentProvider;
    providerReference: string;
    eventType: string;
    raw: unknown;
  }): Promise<void> {
    // Find payment by provider reference
    const payment = await this.paymentRepository.findByProviderReference(
      event.provider,
      event.providerReference
    );

    if (!payment) {
      // Log but don't throw - webhook might be for a payment we don't have
      console.warn(
        `Payment not found for provider reference: ${event.providerReference}`
      );
      return;
    }

    // Persist webhook event (idempotency: same event can be stored multiple times)
    // Note: We don't check for duplicates here - PaymentEvent table allows multiple events
    // The idempotency comes from safe status transitions below
    await this.paymentEventRepository.createEvent({
      paymentId: payment.id,
      provider: event.provider,
      eventType: event.eventType,
      raw: event.raw,
    });

    // Fetch current status from provider for reconciliation
    const providerStatus = await this.providerClient.fetchPaymentStatus(
      event.providerReference
    );

    // Map provider status to internal PaymentStatus
    const newStatus = providerStatus.status;

    // Validate safe status transition
    if (!this.isValidStatusTransition(payment.status, newStatus)) {
      console.warn(
        `Invalid status transition for payment ${payment.id}: ${payment.status} -> ${newStatus}. Keeping current status.`
      );
      return;
    }

    // Update payment status and amounts if changed
    if (newStatus !== payment.status) {
      await this.paymentRepository.updateStatusAndAmounts(payment.id, {
        status: newStatus,
        amountAuthorized:
          providerStatus.authorizedAmount ?? payment.amountAuthorized,
        amountCaptured: providerStatus.capturedAmount ?? payment.amountCaptured,
      });

      // Handle order status updates based on payment status (if payment has orderId)
      if (payment.orderId) {
        const order = await this.orderRepository.findById(payment.orderId);
        if (order) {
          if (newStatus === PaymentStatus.AUTHORIZED) {
            // Payment authorized -> order can proceed to CONFIRMED (ready for pro to start)
            if (order.status === OrderStatus.ACCEPTED) {
              await this.orderRepository.updateStatus(
                payment.orderId,
                OrderStatus.CONFIRMED
              );
            }
          } else if (
            newStatus === PaymentStatus.FAILED ||
            newStatus === PaymentStatus.CANCELLED
          ) {
            // Payment failed/cancelled -> keep order in ACCEPTED
            // Client can retry payment or cancel the order
            // Note: We don't automatically cancel the order - let the client decide
          }
        }
      }
    } else {
      // Status unchanged, but amounts might have changed (e.g., partial capture)
      if (
        providerStatus.authorizedAmount !== payment.amountAuthorized ||
        providerStatus.capturedAmount !== payment.amountCaptured
      ) {
        await this.paymentRepository.updateStatusAndAmounts(payment.id, {
          amountAuthorized:
            providerStatus.authorizedAmount ?? payment.amountAuthorized,
          amountCaptured:
            providerStatus.capturedAmount ?? payment.amountCaptured,
        });
      }
    }
  }

  /**
   * Validate safe status transitions
   * Allowed transitions:
   * - CREATED/REQUIRES_ACTION -> AUTHORIZED -> CAPTURED
   * - Any -> FAILED/CANCELLED (terminal states)
   * - Any -> REFUNDED (from CAPTURED)
   */
  private isValidStatusTransition(
    currentStatus: PaymentStatus,
    newStatus: PaymentStatus
  ): boolean {
    // Same status is always valid (idempotency)
    if (currentStatus === newStatus) {
      return true;
    }

    // Terminal states cannot transition (except to REFUNDED from CAPTURED)
    if (
      currentStatus === PaymentStatus.FAILED ||
      currentStatus === PaymentStatus.CANCELLED
    ) {
      return false;
    }

    // REFUNDED can only come from CAPTURED
    if (newStatus === PaymentStatus.REFUNDED) {
      return currentStatus === PaymentStatus.CAPTURED;
    }

    // FAILED and CANCELLED can come from any non-terminal state
    if (
      newStatus === PaymentStatus.FAILED ||
      newStatus === PaymentStatus.CANCELLED
    ) {
      return true;
    }

    // Normal flow: CREATED/REQUIRES_ACTION -> AUTHORIZED -> CAPTURED
    if (newStatus === PaymentStatus.AUTHORIZED) {
      return (
        currentStatus === PaymentStatus.CREATED ||
        currentStatus === PaymentStatus.REQUIRES_ACTION
      );
    }

    if (newStatus === PaymentStatus.CAPTURED) {
      return currentStatus === PaymentStatus.AUTHORIZED;
    }

    // Any other transition is invalid
    return false;
  }

  /**
   * Capture an authorized payment (charge the funds)
   * Business rules:
   * - Payment must be in AUTHORIZED status
   * - Order should be COMPLETED (but we allow capture even if not completed for flexibility)
   * - If amount is not provided, captures the full authorized amount
   * - Updates payment status to CAPTURED
   * - Updates amountCaptured field
   */
  async capturePayment(
    paymentId: string,
    amount?: number
  ): Promise<{ capturedAmount: number }> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    // Validate payment is in AUTHORIZED status
    if (payment.status !== PaymentStatus.AUTHORIZED) {
      throw new Error(
        `Payment must be AUTHORIZED to capture. Current status: ${payment.status}`
      );
    }

    if (!payment.providerReference) {
      throw new Error(`Payment ${paymentId} has no provider reference`);
    }

    // Determine capture amount: use provided amount or full authorized amount
    const captureAmount = amount ?? payment.amountAuthorized;
    if (!captureAmount) {
      throw new Error(`Cannot capture: payment has no authorized amount`);
    }

    try {
      // Call provider to capture payment
      const captureResult = await this.providerClient.capture(
        payment.providerReference,
        captureAmount
      );

      // Update payment status to CAPTURED and store captured amount
      await this.paymentRepository.updateStatusAndAmounts(payment.id, {
        status: PaymentStatus.CAPTURED,
        amountCaptured: captureResult.capturedAmount,
      });

      return { capturedAmount: captureResult.capturedAmount };
    } catch (error) {
      // Log error but don't throw - we want order finalization to succeed even if capture fails
      // The payment can be captured manually later via syncStatus or admin endpoint
      console.error(`Failed to capture payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Sync payment status with provider
   * Useful for reconciliation or manual status checks
   */
  async syncPaymentStatus(paymentId: string, actor: Actor): Promise<void> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    if (!payment.providerReference) {
      throw new Error(`Payment ${paymentId} has no provider reference`);
    }

    const previousStatus = payment.status;

    // Get provider client for this payment
    const providerClient = await getPaymentProviderClient(payment.provider);

    // Fetch current status from provider
    const providerStatus = await providerClient.fetchPaymentStatus(
      payment.providerReference
    );

    // Validate and apply status transition
    if (this.isValidStatusTransition(payment.status, providerStatus.status)) {
      await this.paymentRepository.updateStatusAndAmounts(payment.id, {
        status: providerStatus.status,
        amountAuthorized:
          providerStatus.authorizedAmount ?? payment.amountAuthorized,
        amountCaptured: providerStatus.capturedAmount ?? payment.amountCaptured,
      });

      // Update order status if payment becomes AUTHORIZED (if payment has orderId)
      if (providerStatus.status === PaymentStatus.AUTHORIZED) {
        if (payment.orderId) {
          const order = await this.orderRepository.findById(payment.orderId);
          if (order && order.status === OrderStatus.ACCEPTED) {
            await this.orderRepository.updateStatus(
              payment.orderId,
              OrderStatus.CONFIRMED
            );
          }
        }
      }

      // Log audit event
      await this.auditService.logEvent({
        eventType: AuditEventType.PAYMENT_SYNCED,
        actor,
        resourceType: "payment",
        resourceId: paymentId,
        action: "sync_status",
        metadata: {
          previousStatus,
          newStatus: providerStatus.status,
          orderId: payment.orderId,
          provider: payment.provider,
          providerReference: payment.providerReference,
        },
      });
    } else {
      throw new Error(
        `Invalid status transition: ${payment.status} -> ${providerStatus.status}`
      );
    }
  }

  /**
   * Admin: List all payments with filters
   * Returns payments with order info
   */
  async adminListPayments(filters?: {
    status?: PaymentStatus;
    query?: string; // Search by orderId or providerReference
    limit?: number;
    cursor?: string;
  }): Promise<
    Array<{
      id: string;
      status: PaymentStatus;
      orderId: string;
      provider: PaymentProvider;
      amountEstimated: number;
      amountAuthorized: number | null;
      amountCaptured: number | null;
      currency: string;
      updatedAt: Date;
    }>
  > {
    const payments = await this.paymentRepository.findAll(filters);

    return payments.map((p) => ({
      id: p.id,
      status: p.status,
      orderId: p.orderId,
      provider: p.provider,
      amountEstimated: p.amountEstimated,
      amountAuthorized: p.amountAuthorized,
      amountCaptured: p.amountCaptured,
      currency: p.currency,
      updatedAt: p.updatedAt,
    }));
  }

  /**
   * Admin: Get payment by ID with full details including webhook events
   */
  async adminGetPaymentById(paymentId: string): Promise<{
    id: string;
    status: PaymentStatus;
    orderId: string;
    provider: PaymentProvider;
    providerReference: string | null;
    amountEstimated: number;
    amountAuthorized: number | null;
    amountCaptured: number | null;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
    events: Array<{
      id: string;
      eventType: string;
      raw: unknown;
      createdAt: Date;
    }>;
  }> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    const events = await this.paymentEventRepository.findByPaymentId(paymentId);

    return {
      id: payment.id,
      status: payment.status,
      orderId: payment.orderId,
      provider: payment.provider,
      providerReference: payment.providerReference,
      amountEstimated: payment.amountEstimated,
      amountAuthorized: payment.amountAuthorized,
      amountCaptured: payment.amountCaptured,
      currency: payment.currency,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      events: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        raw: e.raw,
        createdAt: e.createdAt,
      })),
    };
  }
}
