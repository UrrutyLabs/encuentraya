import { z } from "zod";
import {
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
 * Category metadata input schema (snapshot at order creation)
 */
export const categoryMetadataInputSchema = z
  .object({
    categoryId: z.string(),
    categoryKey: z.string().optional(),
    categoryName: z.string().optional(),
    subcategoryId: z.string().optional(),
    subcategoryName: z.string().optional(),
  })
  .passthrough(); // Allow additional fields

export type CategoryMetadataInput = z.infer<typeof categoryMetadataInputSchema>;

/**
 * Order schema
 */
export const orderSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  clientUserId: z.string(),
  proProfileId: z.string().nullable(),
  categoryId: z.string(), // FK to Category table (required)
  categoryMetadataJson: z.record(z.unknown()).nullable(), // Snapshot of category metadata at creation
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
  categoryId: z.string(), // FK to Category table (required)
  subcategoryId: z.string().optional(),
  categoryMetadataJson: categoryMetadataInputSchema.optional(), // Optional snapshot of category metadata
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

/**
 * Order cost estimation input schema
 */
export const orderEstimateInputSchema = z.object({
  proProfileId: z.string(),
  estimatedHours: z.number().positive(),
  categoryId: z.string().optional(), // Optional: for future use
});

export type OrderEstimateInput = z.infer<typeof orderEstimateInputSchema>;

/**
 * Order cost estimation line item schema
 */
export const orderEstimateLineItemSchema = z.object({
  type: z.string(),
  description: z.string(),
  amount: z.number().nonnegative(),
});

export type OrderEstimateLineItem = z.infer<typeof orderEstimateLineItemSchema>;

/**
 * Order cost estimation output schema
 */
export const orderEstimateOutputSchema = z.object({
  laborAmount: z.number().nonnegative(),
  platformFeeAmount: z.number().nonnegative(),
  platformFeeRate: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  taxRate: z.number().nonnegative(),
  subtotalAmount: z.number().nonnegative(),
  totalAmount: z.number().nonnegative(),
  currency: z.string(),
  lineItems: z.array(orderEstimateLineItemSchema),
});

export type OrderEstimateOutput = z.infer<typeof orderEstimateOutputSchema>;

/**
 * Order with optional server-computed cost estimate.
 * Used by getById when order has no persisted totals (pre-finalization).
 */
export const orderWithCostEstimateSchema = orderSchema.merge(
  z.object({
    costEstimate: orderEstimateOutputSchema.optional(),
  })
);
export type OrderWithCostEstimate = z.infer<typeof orderWithCostEstimateSchema>;
