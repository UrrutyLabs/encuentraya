import { z } from "zod";

/**
 * Availability slot schema
 */
export const availabilitySlotSchema = z.object({
  id: z.string(),
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;

/**
 * Pro (service provider) profile schema
 */
export const proSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  hourlyRate: z.number().positive(),
  categoryIds: z.array(z.string()), // FK array to Category table
  serviceArea: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).default(0),
  isApproved: z.boolean().default(false),
  isSuspended: z.boolean().default(false),
  isAvailable: z.boolean().default(false),
  profileCompleted: z.boolean().default(false),
  completedJobsCount: z.number().int().min(0).default(0),
  isTopPro: z.boolean().default(false),
  responseTimeMinutes: z.number().int().positive().optional(),
  availabilitySlots: z.array(availabilitySlotSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Pro = z.infer<typeof proSchema>;

/**
 * Pro signup input schema (email + password only)
 * ProProfile is created later during onboarding
 */
export const proSignupInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type ProSignupInput = z.infer<typeof proSignupInputSchema>;

/**
 * Pro onboarding input schema
 */
export const proOnboardInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  hourlyRate: z.number().positive(),
  categoryIds: z.array(z.string()).min(1), // FK array to Category table
  serviceArea: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
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

/**
 * Availability slot input schema (for creating/updating)
 */
export const availabilitySlotInputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
});

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotInputSchema>;

/**
 * Update availability slots input schema
 */
export const updateAvailabilitySlotsInputSchema = z.object({
  slots: z.array(availabilitySlotInputSchema),
});

export type UpdateAvailabilitySlotsInput = z.infer<
  typeof updateAvailabilitySlotsInputSchema
>;
