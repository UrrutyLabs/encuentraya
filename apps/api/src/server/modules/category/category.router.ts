import { router, publicProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { CategoryService } from "./category.service";
import { categorySchema } from "@repo/domain";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const categoryService = container.resolve<CategoryService>(
  TOKENS.CategoryService
);

export const categoryRouter = router({
  getMetadata: publicProcedure
    .input(z.object({ category: categorySchema }))
    .query(async ({ input }) => {
      try {
        const metadata = await categoryService.getCategoryMetadata(
          input.category
        );
        if (!metadata) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Category metadata not found for ${input.category}`,
          });
        }
        return metadata;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get category metadata",
        });
      }
    }),

  getAllMetadata: publicProcedure.query(async () => {
    try {
      return await categoryService.getAllCategoriesMetadata();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get all category metadata",
      });
    }
  }),
});
