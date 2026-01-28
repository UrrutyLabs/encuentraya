import { z } from "zod";

/**
 * User roles in the system
 */
export enum Role {
  CLIENT = "client",
  PRO = "pro",
  ADMIN = "admin",
}

/**
 * Booking status lifecycle
 */
export enum BookingStatus {
  PENDING_PAYMENT = "pending_payment",
  PENDING = "pending",
  ACCEPTED = "accepted",
  ON_MY_WAY = "on_my_way",
  ARRIVED = "arrived",
  REJECTED = "rejected",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

/**
 * Payment provider types
 */
export enum PaymentProvider {
  MERCADO_PAGO = "MERCADO_PAGO",
}

/**
 * Payment types
 */
export enum PaymentType {
  PREAUTH = "PREAUTH",
}

/**
 * Payment status lifecycle
 */
export enum PaymentStatus {
  CREATED = "CREATED",
  REQUIRES_ACTION = "REQUIRES_ACTION",
  AUTHORIZED = "AUTHORIZED",
  CAPTURED = "CAPTURED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

/**
 * Service categories available in the marketplace
 */
export enum Category {
  PLUMBING = "plumbing",
  ELECTRICAL = "electrical",
  CLEANING = "cleaning",
  HANDYMAN = "handyman",
  PAINTING = "painting",
}

/**
 * Order status lifecycle
 */
export enum OrderStatus {
  DRAFT = "draft",
  PENDING_PRO_CONFIRMATION = "pending_pro_confirmation",
  ACCEPTED = "accepted",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  AWAITING_CLIENT_APPROVAL = "awaiting_client_approval",
  DISPUTED = "disputed",
  COMPLETED = "completed",
  PAID = "paid",
  CANCELED = "canceled",
}

/**
 * Order line item types
 */
export enum OrderLineItemType {
  LABOR = "labor",
  PLATFORM_FEE = "platform_fee",
  TAX = "tax",
  TIP = "tip",
  DISCOUNT = "discount",
  ADJUSTMENT = "adjustment",
  CANCELLATION_FEE = "cancellation_fee",
}

/**
 * Tax behavior for line items
 */
export enum TaxBehavior {
  TAXABLE = "taxable",
  NON_TAXABLE = "non_taxable",
  TAX_INCLUDED = "tax_included",
}

/**
 * Pricing modes
 */
export enum PricingMode {
  HOURLY = "hourly",
}

/**
 * Approval methods for hours
 */
export enum ApprovalMethod {
  CLIENT_ACCEPTED = "client_accepted",
  AUTO_ACCEPTED = "auto_accepted",
  ADMIN_ADJUSTED = "admin_adjusted",
}

/**
 * Dispute status
 */
export enum DisputeStatus {
  NONE = "none",
  OPEN = "open",
  RESOLVED = "resolved",
  CANCELED = "canceled",
}

/**
 * Zod schemas for enums
 */
export const roleSchema = z.nativeEnum(Role);
export const bookingStatusSchema = z.nativeEnum(BookingStatus);
export const categorySchema = z.nativeEnum(Category);
export const paymentProviderSchema = z.nativeEnum(PaymentProvider);
export const paymentTypeSchema = z.nativeEnum(PaymentType);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);
export const orderStatusSchema = z.nativeEnum(OrderStatus);
export const orderLineItemTypeSchema = z.nativeEnum(OrderLineItemType);
export const taxBehaviorSchema = z.nativeEnum(TaxBehavior);
export const pricingModeSchema = z.nativeEnum(PricingMode);
export const approvalMethodSchema = z.nativeEnum(ApprovalMethod);
export const disputeStatusSchema = z.nativeEnum(DisputeStatus);
