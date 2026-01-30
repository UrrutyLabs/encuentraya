import { router, publicProcedure, adminProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { CategoryService } from "./category.service";
import { ConfigService } from "./config.service";
import {
  categoryCreateInputSchema,
  categoryUpdateInputSchema,
} from "@repo/domain";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Resolve services from container
const categoryService = container.resolve<CategoryService>(
  TOKENS.CategoryService
);
const configService = container.resolve<ConfigService>(TOKENS.ConfigService);

export const categoryRouter = router({
  // ========== Category CRUD Operations ==========

  /**
   * Get all categories (excluding soft-deleted by default)
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          includeDeleted: z.boolean().optional().default(false),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        return await categoryService.getAllCategories(
          input?.includeDeleted ?? false
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get all categories",
        });
      }
    }),

  /**
   * Get category by ID
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
        includeDeleted: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        const category = await categoryService.getCategoryById(
          input.id,
          input.includeDeleted
        );
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Category not found with id ${input.id}`,
          });
        }
        return category;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get category",
        });
      }
    }),

  /**
   * Get category by key
   */
  getByKey: publicProcedure
    .input(
      z.object({
        key: z.string(),
        includeDeleted: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        const category = await categoryService.getCategoryByKey(
          input.key,
          input.includeDeleted
        );
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Category not found with key ${input.key}`,
          });
        }
        return category;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get category by key",
        });
      }
    }),

  /**
   * Get category by slug
   */
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        includeDeleted: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      try {
        const category = await categoryService.getCategoryBySlug(
          input.slug,
          input.includeDeleted
        );
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Category not found with slug ${input.slug}`,
          });
        }
        return category;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get category by slug",
        });
      }
    }),

  /**
   * Create a new category (Admin only)
   * If a soft-deleted category with the same key exists, reactivates it
   */
  create: adminProcedure
    .input(categoryCreateInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await categoryService.createCategory(input);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already exists")
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create category",
        });
      }
    }),

  /**
   * Update a category (Admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: categoryUpdateInputSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const category = await categoryService.updateCategory(
          input.id,
          input.data
        );
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Category not found with id ${input.id}`,
          });
        }
        return category;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update category",
        });
      }
    }),

  /**
   * Soft delete a category (Admin only)
   * Sets deletedAt instead of hard delete
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const category = await categoryService.deleteCategory(input.id);
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Category not found with id ${input.id}`,
          });
        }
        return category;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete category",
        });
      }
    }),

  /**
   * Restore a soft-deleted category (Admin only)
   * Sets deletedAt = NULL
   */
  restore: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const category = await categoryService.restoreCategory(input.id);
        if (!category) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Category not found with id ${input.id}`,
          });
        }
        return category;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to restore category",
        });
      }
    }),

  /**
   * Get effective config for a category/subcategory combination
   * Merges: system defaults → category config → subcategory config
   */
  getEffectiveConfig: publicProcedure
    .input(
      z.object({
        categoryId: z.string(),
        subcategoryId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        return await configService.getEffectiveConfig(
          input.categoryId,
          input.subcategoryId
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get effective config",
        });
      }
    }),
});
