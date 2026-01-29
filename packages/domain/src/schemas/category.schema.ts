import { z } from "zod";

/**
 * Category schema - data-driven category from database
 */
export const categorySchema = z.object({
  id: z.string(),
  key: z.string(), // Stable identifier like "PLUMBING"
  name: z.string(), // Display name
  slug: z.string(),
  iconName: z.string().nullable(),
  description: z.string().nullable(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  deletedAt: z.date().nullable(),
  configJson: z.record(z.unknown()).nullable(), // JSONB config
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Category = z.infer<typeof categorySchema>;

/**
 * Category list schema
 */
export const categoryListSchema = z.array(categorySchema);

/**
 * Category create input schema (admin only)
 */
export const categoryCreateInputSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  iconName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  configJson: z.record(z.unknown()).nullable().optional(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateInputSchema>;

/**
 * Category update input schema (admin only)
 */
export const categoryUpdateInputSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  iconName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  configJson: z.record(z.unknown()).nullable().optional(),
});

export type CategoryUpdateInput = z.infer<typeof categoryUpdateInputSchema>;
