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
 * Zod schemas for enums
 */
export const roleSchema = z.nativeEnum(Role);
export const bookingStatusSchema = z.nativeEnum(BookingStatus);
export const categorySchema = z.nativeEnum(Category);
export const paymentProviderSchema = z.nativeEnum(PaymentProvider);
export const paymentTypeSchema = z.nativeEnum(PaymentType);
export const paymentStatusSchema = z.nativeEnum(PaymentStatus);
