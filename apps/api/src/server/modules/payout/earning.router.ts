import { z } from "zod";
import { router, adminProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { EarningService } from "./earning.service";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const earningService = container.resolve<EarningService>(TOKENS.EarningService);

export const earningRouter = router({
  /**
   * Mark all due earnings as PAYABLE
   * Admin-only endpoint to process pending earnings that have passed the cooling-off period
   */
  markDuePayable: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().optional(),
        })
        .optional()
    )
    .mutation(async () => {
      try {
        const count = await earningService.markPayableIfDue();
        return {
          success: true,
          count,
          message: `Marked ${count} earnings as PAYABLE`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to mark due earnings as payable",
        });
      }
    }),
});
