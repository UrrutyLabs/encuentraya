import { router, publicProcedure, adminProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { SubcategoryService } from "./subcategory.service";
import {
  subcategoryCreateInputSchema,
  subcategoryUpdateInputSchema,
} from "@repo/domain";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const subcategoryService = container.resolve<SubcategoryService>(
  TOKENS.SubcategoryService
);

export const subcategoryRouter = router({
  getByCategoryId: publicProcedure
    .input(z.object({ categoryId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await subcategoryService.getSubcategoriesByCategoryId(
          input.categoryId
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get subcategories by categoryId",
        });
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const subcategory = await subcategoryService.getSubcategoryById(
          input.id
        );
        if (!subcategory) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Subcategory not found with id ${input.id}`,
          });
        }
        return subcategory;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get subcategory",
        });
      }
    }),

  getBySlugAndCategoryId: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        categoryId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const subcategory =
          await subcategoryService.getSubcategoryBySlugAndCategoryId(
            input.slug,
            input.categoryId
          );
        if (!subcategory) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Subcategory not found with slug ${input.slug} for categoryId ${input.categoryId}`,
          });
        }
        return subcategory;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get subcategory",
        });
      }
    }),

  getAll: publicProcedure.query(async () => {
    try {
      return await subcategoryService.getAllSubcategories();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get all subcategories",
      });
    }
  }),

  /**
   * Create a new subcategory (Admin only)
   */
  create: adminProcedure
    .input(subcategoryCreateInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await subcategoryService.createSubcategory(input);
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
              : "Failed to create subcategory",
        });
      }
    }),

  /**
   * Update a subcategory (Admin only)
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: subcategoryUpdateInputSchema,
      })
    )
    .mutation(async ({ input }) => {
      try {
        const subcategory = await subcategoryService.updateSubcategory(
          input.id,
          input.data
        );
        if (!subcategory) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Subcategory not found with id ${input.id}`,
          });
        }
        return subcategory;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
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
              : "Failed to update subcategory",
        });
      }
    }),

  /**
   * Delete a subcategory (Admin only)
   * Hard delete - permanently removes the subcategory
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Get subcategory before deletion to return categoryId for cache invalidation
        const subcategory = await subcategoryService.getSubcategoryById(
          input.id
        );
        if (!subcategory) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Subcategory not found with id ${input.id}`,
          });
        }

        await subcategoryService.deleteSubcategory(input.id);
        // Return the deleted subcategory data for cache invalidation
        return { id: input.id, categoryId: subcategory.categoryId };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete subcategory",
        });
      }
    }),
});
