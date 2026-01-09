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
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
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
