import { z } from "zod";
import {
  categorySchema,
  orderStatusSchema,
  orderLineItemTypeSchema,
  taxBehaviorSchema,
  pricingModeSchema,
  approvalMethodSchema,
  disputeStatusSchema,
} from "../enums";

/**
 * Order line item schema
 */
export const orderLineItemSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  type: orderLineItemTypeSchema,
  description: z.string(),
  quantity: z.number().nonnegative(),
  unitAmount: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  currency: z.string(),
  taxBehavior: taxBehaviorSchema.optional(),
  taxRate: z.number().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
});

export type OrderLineItem = z.infer<typeof orderLineItemSchema>;

/**
 * Order schema
 */
export const orderSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  clientUserId: z.string(),
  proProfileId: z.string().nullable(),
  category: categorySchema,
  subcategoryId: z.string().nullable(),

  // Job details
  title: z.string().nullable(),
  description: z.string().nullable(),
  addressText: z.string(),
  addressLat: z.number().nullable(),
  addressLng: z.number().nullable(),
  scheduledWindowStartAt: z.date(),
  scheduledWindowEndAt: z.date().nullable(),

  // Lifecycle
  status: orderStatusSchema,
  acceptedAt: z.date().nullable(),
  confirmedAt: z.date().nullable(),
  startedAt: z.date().nullable(),
  arrivedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  paidAt: z.date().nullable(),
  canceledAt: z.date().nullable(),
  cancelReason: z.string().nullable(),

  // Pricing snapshots
  pricingMode: pricingModeSchema,
  hourlyRateSnapshotAmount: z.number().positive(),
  currency: z.string(),
  minHoursSnapshot: z.number().positive().nullable(),

  // Hours
  estimatedHours: z.number().positive(),
  finalHoursSubmitted: z.number().positive().nullable(),
  approvedHours: z.number().positive().nullable(),
  approvalMethod: approvalMethodSchema.nullable(),
  approvalDeadlineAt: z.date().nullable(),

  // Totals (cached)
  subtotalAmount: z.number().nonnegative().nullable(),
  platformFeeAmount: z.number().nonnegative().nullable(),
  taxAmount: z.number().nonnegative().nullable(),
  totalAmount: z.number().nonnegative().nullable(),
  totalsCalculatedAt: z.date().nullable(),

  // Tax snapshot
  taxScheme: z.string().nullable(),
  taxRate: z.number().nonnegative().nullable(),
  taxIncluded: z.boolean(),
  taxRegion: z.string().nullable(),
  taxCalculatedAt: z.date().nullable(),

  // Dispute fields
  disputeStatus: disputeStatusSchema,
  disputeReason: z.string().nullable(),
  disputeOpenedBy: z.string().nullable(),

  // Metadata
  isFirstOrder: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Order = z.infer<typeof orderSchema>;

/**
 * Order creation input schema
 */
export const orderCreateInputSchema = z.object({
  proProfileId: z.string().optional(),
  category: categorySchema,
  subcategoryId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  addressText: z.string().min(1),
  addressLat: z.number().optional(),
  addressLng: z.number().optional(),
  scheduledWindowStartAt: z.date(),
  scheduledWindowEndAt: z.date().optional(),
  estimatedHours: z.number().positive(),
  isFirstOrder: z.boolean().optional(),
});

export type OrderCreateInput = z.infer<typeof orderCreateInputSchema>;

/**
 * Order update input schema
 */
export const orderUpdateInputSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  addressText: z.string().optional(),
  addressLat: z.number().optional(),
  addressLng: z.number().optional(),
  scheduledWindowStartAt: z.date().optional(),
  scheduledWindowEndAt: z.date().optional(),
  estimatedHours: z.number().positive().optional(),
  finalHoursSubmitted: z.number().positive().optional(),
  approvedHours: z.number().positive().optional(),
  approvalMethod: approvalMethodSchema.optional(),
  approvalDeadlineAt: z.date().optional(),
  cancelReason: z.string().optional(),
  disputeReason: z.string().optional(),
  disputeOpenedBy: z.string().optional(),
});

export type OrderUpdateInput = z.infer<typeof orderUpdateInputSchema>;

/**
 * Order line item creation input schema
 */
export const orderLineItemCreateInputSchema = z.object({
  type: orderLineItemTypeSchema,
  description: z.string().min(1),
  quantity: z.number().nonnegative(),
  unitAmount: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  currency: z.string().default("UYU"),
  taxBehavior: taxBehaviorSchema.optional(),
  taxRate: z.number().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type OrderLineItemCreateInput = z.infer<
  typeof orderLineItemCreateInputSchema
>;
