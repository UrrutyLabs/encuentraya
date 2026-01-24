import { PaymentProvider, PaymentStatus } from "@repo/domain";
import type {
  PaymentProviderClient,
  CreatePreauthInput,
  CreatePreauthResult,
  ProviderWebhookEvent,
  ProviderPaymentStatus,
} from "../provider";

/**
 * Mercado Pago API response types
 * Minimal interfaces for only the fields we actually use
 */
interface MercadoPagoPreference {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
}

interface MercadoPagoPayment {
  status: string; // MP status: "pending", "approved", "rejected", etc.
  transaction_amount?: number; // Amount in major units (e.g., 100.00 UYU)
}

/**
 * Mercado Pago payment provider client
 *
 * Mercado Pago Status Mapping:
 *
 * MP Status          -> Internal PaymentStatus
 * ------------------    ---------------------
 * "pending"         -> REQUIRES_ACTION
 * "approved"        -> AUTHORIZED
 * "authorized"      -> AUTHORIZED
 * "in_process"      -> REQUIRES_ACTION
 * "in_mediation"    -> REQUIRES_ACTION
 * "rejected"        -> FAILED
 * "cancelled"       -> CANCELLED
 * "refunded"        -> REFUNDED
 * "charged_back"    -> REFUNDED
 *
 * Note: MP uses "approved" for authorized payments that can be captured later.
 * For preauth flow, we map "approved" to AUTHORIZED status.
 */
export class MercadoPagoClient implements PaymentProviderClient {
  private readonly accessToken: string;
  private readonly baseUrl = "https://api.mercadopago.com";

  constructor() {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN environment variable is required. Get it from Mercado Pago dashboard → Credentials"
      );
    }
    this.accessToken = accessToken;
  }

  /**
   * Create a payment preference (preauth) for redirect-based checkout
   * Returns preference ID and checkout URL
   */
  async createPreauth(input: CreatePreauthInput): Promise<CreatePreauthResult> {
    // Convert amount from minor units (cents) to major units (dollars/pesos)
    const amountInMajorUnits = input.amount.amount / 100;

    // Build return URLs (these are the payment return pages we created)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    const successUrl = `${baseUrl.replace("/api", "")}/payment/success`;
    const pendingUrl = `${baseUrl.replace("/api", "")}/payment/pending`;
    const failureUrl = `${baseUrl.replace("/api", "")}/payment/failure`;

    // Create preference payload
    const preferencePayload = {
      items: [
        {
          title: `Reserva #${input.bookingId}`,
          description: `Pago de reserva de servicio`,
          quantity: 1,
          unit_price: amountInMajorUnits,
          currency_id: input.amount.currency,
        },
      ],
      back_urls: {
        success: successUrl,
        pending: pendingUrl,
        failure: failureUrl,
      },
      auto_return: "approved", // Redirect automatically when approved
      external_reference: input.bookingId, // Store booking ID for webhook matching
      statement_descriptor: "ARRREGLATODO", // Appears on customer's statement
      metadata: {
        bookingId: input.bookingId,
        clientUserId: input.clientUserId,
        idempotencyKey: input.idempotencyKey,
        ...input.metadata,
      },
      // For preauth, we want to authorize but not capture immediately
      // MP doesn't have explicit preauth, but we can use "pending" status
      // and capture later when work is completed
    };

    try {
      const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(preferencePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Mercado Pago API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const preference = (await response.json()) as MercadoPagoPreference;

      // Map MP preference status to our PaymentStatus
      // Preferences are created in "pending" state until user completes payment
      const status = PaymentStatus.REQUIRES_ACTION;

      return {
        providerReference: preference.id, // Preference ID
        checkoutUrl:
          preference.init_point || preference.sandbox_init_point || null, // Checkout URL
        status,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to create Mercado Pago preference: ${error.message}`
        );
      }
      throw new Error(
        "Failed to create Mercado Pago preference: Unknown error"
      );
    }
  }

  /**
   * Parse and validate webhook payload from Mercado Pago
   * MP sends webhooks with payment updates
   */
  async parseWebhook(request: Request): Promise<ProviderWebhookEvent | null> {
    try {
      const body = await request.json();

      // MP webhook structure:
      // {
      //   "action": "payment.updated",
      //   "api_version": "v1",
      //   "data": { "id": "123456789" },
      //   "date_created": "2024-01-11T12:00:00Z",
      //   "id": 123456,
      //   "live_mode": false,
      //   "type": "payment",
      //   "user_id": "123456"
      // }

      if (body.type !== "payment" || !body.data?.id) {
        return null; // Not a payment webhook or invalid structure
      }

      const paymentId = body.data.id;

      // Fetch full payment details to get status and external_reference (bookingId)
      const paymentDetails = await this.fetchPaymentDetails(paymentId);
      if (!paymentDetails) {
        return null;
      }

      return {
        provider: PaymentProvider.MERCADO_PAGO,
        providerReference: paymentId,
        eventType: body.action || "payment.updated",
        raw: body,
      };
    } catch (error) {
      console.error("Error parsing Mercado Pago webhook:", error);
      return null;
    }
  }

  /**
   * Fetch current payment status from Mercado Pago
   * providerReference can be either a payment ID or preference ID
   * If it's a preference ID, we need to find the associated payment
   */
  async fetchPaymentStatus(
    providerReference: string
  ): Promise<ProviderPaymentStatus> {
    // Try to fetch as payment ID first
    const payment = await this.fetchPaymentDetails(providerReference);

    // If not found, it might be a preference ID - try to get payments for that preference
    if (!payment) {
      // For preferences, we'd need to search payments by external_reference
      // For now, assume providerReference is a payment ID
      throw new Error(`Payment not found: ${providerReference}`);
    }

    const status = this.mapMpStatusToInternalStatus(payment.status);
    const transactionAmount = payment.transaction_amount
      ? Math.round(payment.transaction_amount * 100)
      : null; // Convert to minor units

    return {
      status,
      authorizedAmount:
        status === PaymentStatus.AUTHORIZED ? transactionAmount : null,
      capturedAmount:
        status === PaymentStatus.CAPTURED ? transactionAmount : null,
    };
  }

  /**
   * Capture an authorized payment (charge the funds)
   * Mercado Pago: Uses POST /v1/payments/{payment_id}/capture
   * Note: MP doesn't have explicit capture - "approved" payments are already captured
   * But we can use this endpoint to confirm capture or handle partial captures
   */
  async capture(
    providerReference: string,
    amount?: number
  ): Promise<{ capturedAmount: number }> {
    const captureAmount = amount ? amount / 100 : undefined; // Convert to major units

    const capturePayload: Record<string, unknown> = {};
    if (captureAmount !== undefined) {
      capturePayload.capture_amount = captureAmount;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v1/payments/${providerReference}/capture`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(capturePayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Mercado Pago capture error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = (await response.json()) as MercadoPagoPayment;

      // Return captured amount in minor units
      const capturedAmount = result.transaction_amount
        ? Math.round(result.transaction_amount * 100)
        : amount || 0; // Fallback to requested amount or 0

      return { capturedAmount };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to capture Mercado Pago payment: ${error.message}`
        );
      }
      throw new Error("Failed to capture Mercado Pago payment: Unknown error");
    }
  }

  /**
   * Refund a payment (optional for MVP)
   */
  async refund(providerReference: string, amount?: number): Promise<void> {
    const refundAmount = amount ? amount / 100 : undefined; // Convert to major units

    const refundPayload: Record<string, unknown> = {};
    if (refundAmount !== undefined) {
      refundPayload.amount = refundAmount;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/v1/payments/${providerReference}/refunds`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(refundPayload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Mercado Pago refund error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to refund Mercado Pago payment: ${error.message}`
        );
      }
      throw new Error("Failed to refund Mercado Pago payment: Unknown error");
    }
  }

  /**
   * Fetch payment details from Mercado Pago API
   */
  private async fetchPaymentDetails(
    paymentId: string
  ): Promise<MercadoPagoPayment | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorText = await response.text();
        throw new Error(
          `Mercado Pago API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return (await response.json()) as MercadoPagoPayment;
    } catch (error) {
      console.error("Error fetching payment details from Mercado Pago:", error);
      return null;
    }
  }

  /**
   * Map Mercado Pago status to internal PaymentStatus
   */
  private mapMpStatusToInternalStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case "pending":
      case "in_process":
      case "in_mediation":
        return PaymentStatus.REQUIRES_ACTION;
      case "approved":
      case "authorized":
        return PaymentStatus.AUTHORIZED;
      case "refunded":
      case "charged_back":
        return PaymentStatus.REFUNDED;
      case "cancelled":
        return PaymentStatus.CANCELLED;
      case "rejected":
        return PaymentStatus.FAILED;
      default:
        // Default to CREATED for unknown statuses
        return PaymentStatus.CREATED;
    }
  }
}
