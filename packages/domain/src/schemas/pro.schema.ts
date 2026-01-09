import { z } from "zod";
import { categorySchema } from "../enums";

/**
 * Pro (service provider) profile schema
 */
export const proSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  hourlyRate: z.number().positive(),
  categories: z.array(categorySchema),
  serviceArea: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).default(0),
  isApproved: z.boolean().default(false),
  isSuspended: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Pro = z.infer<typeof proSchema>;

/**
 * Pro onboarding input schema
 */
export const proOnboardInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  hourlyRate: z.number().positive(),
  categories: z.array(categorySchema).min(1),
  serviceArea: z.string().optional(),
});

export type ProOnboardInput = z.infer<typeof proOnboardInputSchema>;

/**
 * Pro set availability input schema (simple version)
 */
export const proSetAvailabilityInputSchema = z.object({
  serviceArea: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export type ProSetAvailabilityInput = z.infer<
  typeof proSetAvailabilityInputSchema
>;
