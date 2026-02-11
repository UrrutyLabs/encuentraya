/**
 * Location schemas for base address geocoding.
 * serviceArea is derived from geocode (department) for display only.
 */

import { z } from "zod";

/** Geocoded base location (from IDE or client) */
export const baseLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  postalCode: z.string().optional(),
  addressLine: z.string().optional(),
});
export type BaseLocation = z.infer<typeof baseLocationSchema>;
