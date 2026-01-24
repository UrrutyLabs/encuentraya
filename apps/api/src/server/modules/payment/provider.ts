import { PaymentProvider, PaymentStatus } from "@repo/domain";

/**
 * Money representation (amount in minor units, e.g., cents)
 */
export interface Money {
  amount: number; // in minor units (e.g., 1000 = 10.00 UYU)
  currency: string; // e.g., "UYU"
}

/**
 * Input for creating a preauthorization
 */
export interface CreatePreauthInput {
  bookingId: string;
  clientUserId: string;
  proProfileId: string | null;
  amount: Money;
  idempotencyKey: string;
  metadata?: Record<string, string>; // Additional metadata for provider
}

/**
 * Result of creating a preauthorization
 */
export interface CreatePreauthResult {
  providerReference: string; // e.g., preferenceId, paymentIntentId
  checkoutUrl: string | null; // URL for redirect flows, null for direct payment
  status: PaymentStatus; // Initial status from provider
}

/**
 * Provider webhook event (normalized)
 */
export interface ProviderWebhookEvent {
  provider: PaymentProvider;
  providerReference: string;
  eventType: string; // e.g., "payment.created", "payment.authorized"
  raw: unknown; // Original provider payload
}

/**
 * Payment status from provider
 */
export interface ProviderPaymentStatus {
  status: PaymentStatus;
  authorizedAmount?: number | null; // in minor units
  capturedAmount?: number | null; // in minor units
}

/**
 * Payment provider client interface
 * Implementations should be provider-specific (e.g., MercadoPagoClient)
 */
export interface PaymentProviderClient {
  /**
   * Create a preauthorization (payment intent)
   * Returns provider reference and checkout URL if needed
   */
  createPreauth(input: CreatePreauthInput): Promise<CreatePreauthResult>;

  /**
   * Parse and validate webhook payload from provider
   * Returns null if payload is invalid or not recognized
   */
  parseWebhook(request: Request): Promise<ProviderWebhookEvent | null>;

  /**
   * Fetch current payment status from provider
   * Useful for reconciliation or status checks
   */
  fetchPaymentStatus(providerReference: string): Promise<ProviderPaymentStatus>;

  /**
   * Capture an authorized payment (charge the funds)
   * If amount is not provided, captures the full authorized amount
   * Returns the captured amount in minor units
   */
  capture(
    providerReference: string,
    amount?: number
  ): Promise<{ capturedAmount: number }>;

  /**
   * Refund a payment (optional for MVP)
   * If amount is not provided, refunds the full amount
   */
  refund?(providerReference: string, amount?: number): Promise<void>;
}
