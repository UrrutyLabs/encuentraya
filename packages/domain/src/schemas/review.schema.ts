import { z } from "zod";

/**
 * Review schema
 */
export const reviewSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.date(),
  clientDisplayName: z.string().optional(), // Format: "FirstName L." (first letter of surname)
});

export type Review = z.infer<typeof reviewSchema>;

/**
 * Review creation input schema
 */
export const reviewCreateInputSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export type ReviewCreateInput = z.infer<typeof reviewCreateInputSchema>;

/**
 * Review creation output schema
 */
export const reviewCreateOutputSchema = reviewSchema;

export type ReviewCreateOutput = z.infer<typeof reviewCreateOutputSchema>;
