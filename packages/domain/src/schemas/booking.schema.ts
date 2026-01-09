import { z } from "zod";
import { categorySchema, bookingStatusSchema } from "../enums";

/**
 * Booking schema
 */
export const bookingSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  proId: z.string(),
  category: categorySchema,
  description: z.string().min(1),
  status: bookingStatusSchema,
  scheduledAt: z.date(),
  completedAt: z.date().optional(),
  cancelledAt: z.date().optional(),
  hourlyRate: z.number().positive(),
  estimatedHours: z.number().positive(),
  totalAmount: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Booking = z.infer<typeof bookingSchema>;

/**
 * Booking creation input schema
 */
export const bookingCreateInputSchema = z.object({
  proId: z.string().min(1),
  category: categorySchema,
  description: z.string().min(1),
  scheduledAt: z.date(),
  estimatedHours: z.number().positive(),
});

export type BookingCreateInput = z.infer<typeof bookingCreateInputSchema>;

/**
 * Booking creation output schema
 */
export const bookingCreateOutputSchema = bookingSchema;

export type BookingCreateOutput = z.infer<typeof bookingCreateOutputSchema>;
