import { z } from "zod";

/**
 * Subcategory schema
 * Represents a subcategory within a category
 */
export const subcategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  categoryId: z.string(), // FK to Category table (required)
  imageUrl: z.string().nullable(),
  description: z.string().nullable(),
  displayOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Subcategory = z.infer<typeof subcategorySchema>;

/**
 * Subcategory create input schema (admin only)
 */
export const subcategoryCreateInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  categoryId: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export type SubcategoryCreateInput = z.infer<
  typeof subcategoryCreateInputSchema
>;

/**
 * Subcategory update input schema (admin only)
 */
export const subcategoryUpdateInputSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  imageUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export type SubcategoryUpdateInput = z.infer<
  typeof subcategoryUpdateInputSchema
>;

/**
 * Subcategory list schema
 */
export const subcategoryListSchema = z.array(subcategorySchema);
