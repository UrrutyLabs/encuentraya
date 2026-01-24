import { z } from "zod";
import { router, adminProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { PayoutService } from "./payout.service";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const payoutService = container.resolve<PayoutService>(TOKENS.PayoutService);

const payoutProviderSchema = z.enum([
  "MERCADO_PAGO",
  "BANK_TRANSFER",
  "MANUAL",
]);

export const payoutRouter = router({
  /**
   * List all payouts (for admin UI)
   */
  list: adminProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().max(1000).optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        return await payoutService.listPayouts(ctx.actor, input?.limit);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to list payouts",
        });
      }
    }),

  /**
   * List pros with payable earnings (for admin UI)
   */
  listPayablePros: adminProcedure.query(async ({ ctx }) => {
    try {
      return await payoutService.listPayablePros(ctx.actor);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to list payable pros",
      });
    }
  }),

  /**
   * Create a payout for a pro by batching their PAYABLE earnings
   */
  createForPro: adminProcedure
    .input(
      z.object({
        proProfileId: z.string(),
        provider: payoutProviderSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await payoutService.createPayoutForPro(ctx.actor, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to create payout for pro",
        });
      }
    }),

  /**
   * Send a payout to the provider
   */
  send: adminProcedure
    .input(
      z.object({
        payoutId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await payoutService.sendPayout(ctx.actor, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to send payout",
        });
      }
    }),

  /**
   * Get payout by ID
   */
  get: adminProcedure
    .input(
      z.object({
        payoutId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        return await payoutService.getPayout(ctx.actor, input.payoutId);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get payout",
        });
      }
    }),
});
