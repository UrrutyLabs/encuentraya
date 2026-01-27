import { router, publicProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { SubcategoryService } from "./subcategory.service";
import { categorySchema } from "@repo/domain";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const subcategoryService = container.resolve<SubcategoryService>(
  TOKENS.SubcategoryService
);

export const subcategoryRouter = router({
  getByCategory: publicProcedure
    .input(z.object({ category: categorySchema }))
    .query(async ({ input }) => {
      try {
        return await subcategoryService.getSubcategoriesByCategory(
          input.category
        );
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get subcategories by category",
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

  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        category: categorySchema,
      })
    )
    .query(async ({ input }) => {
      try {
        const subcategory = await subcategoryService.getSubcategoryBySlug(
          input.slug,
          input.category
        );
        if (!subcategory) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Subcategory not found with slug ${input.slug} for category ${input.category}`,
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
});
