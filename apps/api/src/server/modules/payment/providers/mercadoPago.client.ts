import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { PaymentProvider, PaymentStatus } from "@repo/domain";
import type {
  PaymentProviderClient,
  CreatePreauthInput,
  CreatePreauthResult,
  ProviderWebhookEvent,
  ProviderPaymentStatus,
} from "../provider";
import crypto from "crypto";
import { logger } from "@/server/infrastructure/utils/logger";

/**
 * Mercado Pago payment provider client using official SDK
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
  private readonly client: MercadoPagoConfig;
  private readonly preference: Preference;
  private readonly payment: Payment;
  private readonly webhookSecret: string | null;
  private readonly accessToken: string;

  constructor() {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error(
        "MERCADOPAGO_ACCESS_TOKEN environment variable is required. Get it from Mercado Pago dashboard → Credentials"
      );
    }

    this.accessToken = accessToken;

    // Webhook secret is optional but recommended for production
    this.webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || null;

    // Initialize SDK client
    this.client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    });

    // Initialize API objects
    this.preference = new Preference(this.client);
    this.payment = new Payment(this.client);
  }

  /**
   * Create a payment preference (preauth) for redirect-based checkout
   * Returns preference ID and checkout URL
   */
  async createPreauth(input: CreatePreauthInput): Promise<CreatePreauthResult> {
    // Convert amount from minor units (cents) to major units (dollars/pesos)
    const amountInMajorUnits = input.amount.amount / 100;

    // Build return URLs (these are the payment return pages in the CLIENT app)
    // Note: Payment pages are in the client app, not the API server
    // CLIENT_URL should point to the client app (e.g., http://localhost:3000 in dev, https://encuentraya.com in prod)
    const clientBaseUrl =
      process.env.CLIENT_URL ||
      process.env.NEXT_PUBLIC_CLIENT_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://encuentraya.com" // Update with your production client URL
        : "http://localhost:3000"); // Client app runs on port 3000 in development
    const successUrl = `${clientBaseUrl}/payment/success`;
    const pendingUrl = `${clientBaseUrl}/payment/pending`;
    const failureUrl = `${clientBaseUrl}/payment/failure`;

    logger.info({ successUrl }, "successUrl");
    logger.info({ pendingUrl }, "pendingUrl");
    logger.info({ failureUrl }, "failureUrl");

    // Build webhook notification URL (API endpoint)
    const apiBaseUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://api.urrutylabs.com" // Update with your production API URL
        : "http://localhost:3002"); // API runs on port 3002 in development
    const notificationUrl = `${apiBaseUrl}/api/webhooks/mercadopago`;

    logger.info({ notificationUrl }, "notificationUrl");

    // Build payer object if information is available
    const payer: Record<string, unknown> = {};
    if (input.payer?.email) {
      payer.email = input.payer.email;
    }
    if (input.payer?.firstName) {
      payer.first_name = input.payer.firstName;
    }
    if (input.payer?.lastName) {
      payer.last_name = input.payer.lastName;
    }

    // Build item with optional category_id
    const item: Record<string, unknown> = {
      id: input.orderId, // Required by SDK
      title: `Orden #${input.displayOrderId}`,
      description: `Pago de orden de servicio`,
      quantity: 1,
      unit_price: amountInMajorUnits,
      currency_id: input.amount.currency,
    };
    if (input.categoryId) {
      item.category_id = input.categoryId;
    }

    // Create preference payload using SDK types
    const preferenceBody: Record<string, unknown> = {
      items: [item],
      back_urls: {
        success: successUrl,
        pending: pendingUrl,
        failure: failureUrl,
      },
      auto_return: "approved" as const, // Redirect automatically when approved
      external_reference: input.orderId, // Store order ID for webhook matching
      statement_descriptor: "EncuentraYa", // Appears on customer's statement
      notification_url: notificationUrl, // Webhook endpoint for payment notifications
      metadata: {
        orderId: input.orderId,
        clientUserId: input.clientUserId,
        idempotencyKey: input.idempotencyKey,
        ...input.metadata,
      },
    };

    // Add payer information if available (improves approval rates)
    if (Object.keys(payer).length > 0) {
      preferenceBody.payer = payer;
    }

    try {
      // Use SDK to create preference
      // Type assertion needed because SDK expects specific types but we're building dynamically
      const preference = await this.preference.create({
        body: preferenceBody as {
          items: Array<{
            id: string;
            title: string;
            description: string;
            quantity: number;
            unit_price: number;
            currency_id: string;
            category_id?: string;
          }>;
          back_urls: {
            success: string;
            pending: string;
            failure: string;
          };
          auto_return: "approved";
          external_reference: string;
          statement_descriptor: string;
          notification_url: string;
          metadata: Record<string, string>;
          payer?: {
            email?: string;
            first_name?: string;
            last_name?: string;
          };
        },
      });

      logger.info({ preference }, "preference");

      // Map MP preference status to our PaymentStatus
      // Preferences are created in "pending" state until user completes payment
      const status = PaymentStatus.REQUIRES_ACTION;

      // Get checkout URL (prefer init_point, fallback to sandbox_init_point)
      const checkoutUrl =
        preference.init_point || preference.sandbox_init_point || null;

      if (!preference.id) {
        throw new Error("Mercado Pago preference created but no ID returned");
      }

      return {
        providerReference: preference.id, // Preference ID
        checkoutUrl: checkoutUrl || null,
        status,
      };
    } catch (error) {
      // Log the full error for debugging
      console.error("Mercado Pago preference creation error:", error);

      // Extract error message from various error types
      let errorMessage = "Unknown error";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        // SDK might throw an object with error details
        const errorObj = error as Record<string, unknown>;
        if (errorObj.message && typeof errorObj.message === "string") {
          errorMessage = errorObj.message;
        } else if (errorObj.error && typeof errorObj.error === "string") {
          errorMessage = errorObj.error;
        } else if (errorObj.cause && typeof errorObj.cause === "string") {
          errorMessage = errorObj.cause;
        } else {
          // Try to stringify the error object
          try {
            errorMessage = JSON.stringify(errorObj);
          } catch {
            errorMessage = String(error);
          }
        }
      } else {
        errorMessage = String(error);
      }

      throw new Error(
        `Failed to create Mercado Pago preference: ${errorMessage}`
      );
    }
  }

  /**
   * Verify webhook signature using X-Signature header
   * Mercado Pago signs webhooks using HMAC-SHA256 with the webhook secret
   *
   * According to Mercado Pago documentation, the signature is calculated using a manifest string:
   * manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};"
   * signature = HMAC-SHA256(manifest, webhook_secret)
   */
  private verifyWebhookSignature(
    dataId: string,
    xRequestId: string,
    signature: string | null
  ): boolean {
    // If no secret configured, skip verification (not recommended for production)
    if (!this.webhookSecret) {
      console.warn(
        "MERCADOPAGO_WEBHOOK_SECRET not configured. Webhook signature verification skipped."
      );
      return true; // Allow in development, but log warning
    }

    if (!signature) {
      return false; // No signature provided
    }

    console.log("dataId", dataId);
    console.log("xRequestId", xRequestId);
    console.log("signature", signature);

    try {
      // Extract signature components
      // Format: "ts={timestamp},v1={signature}"
      const signatureParts = signature.split(",");
      const signatureMap: Record<string, string> = {};
      signatureParts.forEach((part) => {
        const [key, value] = part.split("=");
        if (key && value) {
          signatureMap[key.trim()] = value.trim();
        }
      });

      const v1Signature = signatureMap.v1;
      const ts = signatureMap.ts;

      if (!v1Signature || !ts) {
        return false;
      }

      console.log("v1Signature", v1Signature);
      console.log("ts", ts);

      // Build manifest string according to Mercado Pago documentation
      // Format: "id:{data.id};request-id:{x-request-id};ts:{ts};"
      // If data.id is alphanumeric, it must be sent in lowercase (per MP docs)
      const dataIdForManifest = /^[a-zA-Z0-9]+$/.test(dataId)
        ? dataId.toLowerCase()
        : dataId;
      const manifest = `id:${dataIdForManifest};request-id:${xRequestId};ts:${ts};`;

      console.log("manifest", manifest);

      // Create expected signature: HMAC-SHA256 of manifest with secret
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(manifest)
        .digest("hex");

      console.log("expectedSignature", expectedSignature);

      // Compare signatures using constant-time comparison to prevent timing attacks
      const receivedBuf = Buffer.from(v1Signature, "utf8");
      const expectedBuf = Buffer.from(expectedSignature, "utf8");
      if (receivedBuf.length !== expectedBuf.length) {
        return false;
      }
      return crypto.timingSafeEqual(receivedBuf, expectedBuf);
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  /**
   * Parse and validate webhook payload from Mercado Pago
   * MP sends webhooks with payment updates
   * Includes signature verification for security
   *
   * Mercado Pago webhook format:
   * - Query params (optional): data.id={payment_id}&type=payment — when configured via "Your integrations"
   * - When URL is from notification_url (preference), MP often sends only the body without query params
   * - Headers: x-signature, x-request-id
   * - Body: JSON with type, data.id, action, etc.
   */
  async parseWebhook(request: Request): Promise<ProviderWebhookEvent | null> {
    try {
      const rawBody = await request.clone().text();
      const signature = request.headers.get("x-signature");
      const xRequestId = request.headers.get("x-request-id");
      const url = new URL(request.url);

      console.log("HOLA");
      console.log("rawBody", rawBody);
      console.log("signature", signature);
      console.log("xRequestId", xRequestId);
      console.log("url", url);

      // Parse body first so we can use it when query params are missing (e.g. notification_url flow)
      let body: Record<string, unknown> | null = null;
      try {
        body = rawBody
          ? (JSON.parse(rawBody) as Record<string, unknown>)
          : null;
      } catch {
        body = null;
      }

      console.log("body", body);

      // Resolve data.id and type: prefer query params, fallback to body (per MP docs)
      const dataIdFromQuery = url.searchParams.get("data.id");
      const typeFromQuery = url.searchParams.get("type");
      const dataIdFromBody =
        body?.data != null &&
        typeof body.data === "object" &&
        body.data !== null &&
        "id" in body.data
          ? String((body.data as { id: unknown }).id)
          : null;
      const typeFromBody = body?.type != null ? String(body.type) : null;

      const dataId = dataIdFromQuery ?? dataIdFromBody;
      const type = typeFromQuery ?? typeFromBody;

      console.log("dataId", dataId);
      console.log("type", type);

      // Verify this is a payment webhook
      if (type !== "payment" || !dataId) {
        return null; // Not a payment webhook or missing data.id
      }

      // Verify webhook signature using manifest string format
      if (!this.verifyWebhookSignature(dataId, xRequestId || "", signature)) {
        logger.warn("Invalid webhook signature");
        return null; // Reject webhook with invalid signature
      }

      logger.info({ body }, "body");

      // Per MP docs: data.id = payment ID (for GET /v1/payments/{id}); body.id = notification ID
      const data = body?.data as { id: string | number } | undefined;
      if (!body || body.type !== "payment" || !data?.id) {
        return null; // Invalid body structure
      }

      const paymentId = String(data.id);

      console.log("paymentId", paymentId);

      // Fetch full payment details to get status and external_reference (orderId)
      const paymentDetails = await this.fetchPaymentDetails(paymentId);
      if (!paymentDetails) {
        return null;
      }

      const eventType =
        typeof body.action === "string" ? body.action : "payment.updated";

      return {
        provider: PaymentProvider.MERCADO_PAGO,
        providerReference: paymentId,
        eventType,
        raw: body,
        orderId: paymentDetails.external_reference ?? undefined,
      };
    } catch (error) {
      logger.error({ err: error }, "Error parsing Mercado Pago webhook");
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
   * Mercado Pago: Uses PUT /v1/payments/{payment_id}/capture
   * Note: In MP, "approved" payments are already captured, but we can use this
   * endpoint for partial captures or to confirm capture
   *
   * Note: The SDK may not have a direct capture method, so we use the REST API directly
   */
  async capture(
    providerReference: string,
    amount?: number
  ): Promise<{ capturedAmount: number }> {
    const captureAmount = amount ? amount / 100 : undefined; // Convert to major units

    const captureBody: Record<string, unknown> = {};
    if (captureAmount !== undefined) {
      captureBody.capture_amount = captureAmount;
    }

    try {
      // Use REST API directly as SDK may not have capture method
      const baseUrl = "https://api.mercadopago.com";
      const response = await fetch(
        `${baseUrl}/v1/payments/${providerReference}/capture`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(captureBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Mercado Pago capture error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = (await response.json()) as {
        status?: string;
        transaction_amount?: number;
      };

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
   * Uses REST API directly as SDK may not have refund method
   */
  async refund(providerReference: string, amount?: number): Promise<void> {
    const refundAmount = amount ? amount / 100 : undefined; // Convert to major units

    const refundBody: Record<string, unknown> = {};
    if (refundAmount !== undefined) {
      refundBody.amount = refundAmount;
    }

    try {
      // Use REST API directly as SDK may not have refund method
      const baseUrl = "https://api.mercadopago.com";
      const response = await fetch(
        `${baseUrl}/v1/payments/${providerReference}/refunds`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify(refundBody),
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
   * Fetch payment details from Mercado Pago API using SDK
   */
  private async fetchPaymentDetails(paymentId: string): Promise<{
    status: string;
    transaction_amount?: number;
    external_reference?: string;
  } | null> {
    try {
      // Use SDK to fetch payment
      const payment = await this.payment.get({ id: paymentId });
      logger.info({ payment }, "payment");
      return {
        status: payment.status || "",
        transaction_amount: payment.transaction_amount,
      };
    } catch (error) {
      // Check if it's a 404 (payment not found)
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        return null;
      }
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
