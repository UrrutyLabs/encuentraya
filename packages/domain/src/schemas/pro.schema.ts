import { z } from "zod";
import { pricingModeSchema } from "../enums";
import { baseLocationSchema } from "./location.schema";

/**
 * Per-category rate for a pro (junction ProProfileCategory).
 * Used in getById/categoryRelations and in create/update categoryRates input.
 */
export const categoryRelationSchema = z.object({
  categoryId: z.string(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    pricingMode: pricingModeSchema.optional(),
  }),
  hourlyRateCents: z.number().int().positive().nullable(),
  startingFromCents: z.number().int().positive().nullable(),
});
export type CategoryRelation = z.infer<typeof categoryRelationSchema>;

/**
 * Input for setting per-category rates (create/update pro).
 * For hourly categories: hourlyRateCents required. For fixed: startingFromCents required.
 */
export const categoryRateInputSchema = z.object({
  categoryId: z.string(),
  hourlyRateCents: z.number().int().positive().optional(),
  startingFromCents: z.number().int().positive().optional(),
});
export type CategoryRateInput = z.infer<typeof categoryRateInputSchema>;

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
 * Starting price for a category (when pro.getById is called with categoryId).
 * Used for hire column: "Desde $X/hora" (hourly) or "Desde $X" (fixed).
 */
export const startingPriceForCategorySchema = z.object({
  hourlyRateCents: z.number().int().positive().nullable(),
  startingFromCents: z.number().int().positive().nullable(),
  pricingMode: pricingModeSchema,
});
export type StartingPriceForCategory = z.infer<
  typeof startingPriceForCategorySchema
>;

const DEFAULT_SERVICE_RADIUS_KM = 10;

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
  categoryIds: z.array(z.string()), // FK array to Category table (legacy / derived from categoryRelations)
  categoryRelations: z.array(categoryRelationSchema).optional(), // Per-category rates (hourlyRateCents, startingFromCents)
  /** Set when getById is called with categoryId; used for hire column. */
  startingPriceForCategory: startingPriceForCategorySchema.optional(),
  serviceArea: z.string().optional(),
  serviceRadiusKm: z
    .number()
    .int()
    .min(1)
    .max(500)
    .default(DEFAULT_SERVICE_RADIUS_KM),
  baseCountryCode: z.string().optional(),
  baseLatitude: z.number().optional(),
  baseLongitude: z.number().optional(),
  basePostalCode: z.string().optional(),
  baseAddressLine: z.string().optional(),
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

/** avatarUrl: full URL (legacy) or storage path pro/{userId}/{filename} from avatar upload */
const avatarUrlInputSchema = z
  .union([z.string().url(), z.string().regex(/^pro\/.+/), z.literal("")])
  .optional()
  .nullable();

const serviceRadiusKmSchema = z.number().int().min(1).max(500).optional();

const proOnboardInputShape = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  hourlyRate: z.number().positive(),
  categoryIds: z.array(z.string()).min(0).optional(),
  categoryRates: z.array(categoryRateInputSchema).optional(),
  baseAddress: z.string().min(1).optional(),
  baseLocation: baseLocationSchema.optional(),
  baseCountryCode: z.string().length(2).optional(),
  serviceRadiusKm: serviceRadiusKmSchema,
  bio: z.string().optional(),
  avatarUrl: avatarUrlInputSchema,
});

/**
 * Pro onboarding input schema.
 * Provide categoryIds (legacy) or categoryRates (per-category rates by pricingMode).
 * serviceArea is derived from base address geocode (department) for display.
 */
export const proOnboardInputSchema = proOnboardInputShape.refine(
  (data) =>
    (data.categoryIds?.length ?? 0) >= 1 ||
    (data.categoryRates?.length ?? 0) >= 1,
  { message: "Provide categoryIds or categoryRates with at least one category" }
);

export type ProOnboardInput = z.infer<typeof proOnboardInputSchema>;

/**
 * Pro update profile input schema (all fields optional; used for PATCH).
 */
export const proUpdateProfileInputSchema = proOnboardInputShape.partial();
export type ProUpdateProfileInput = z.infer<typeof proUpdateProfileInputSchema>;

/**
 * Pro set availability input schema (simple version)
 */
export const proSetAvailabilityInputSchema = z.object({
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
