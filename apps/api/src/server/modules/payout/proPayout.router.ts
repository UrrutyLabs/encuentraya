import { z } from "zod";
import { router, proProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { ProPayoutProfileService } from "./proPayoutProfile.service";
import { EarningService } from "./earning.service";
import type { PayoutRepository } from "./payout.repo";
import type { ProRepository } from "@modules/pro/pro.repo";
import { TRPCError } from "@trpc/server";

// Resolve services from container
const proPayoutProfileService = container.resolve<ProPayoutProfileService>(
  TOKENS.ProPayoutProfileService
);
const earningService = container.resolve<EarningService>(TOKENS.EarningService);
const payoutRepository = container.resolve<PayoutRepository>(
  TOKENS.PayoutRepository
);
const proRepository = container.resolve<ProRepository>(TOKENS.ProRepository);

export const proPayoutRouter = router({
  /**
   * Get the current pro's payout profile
   * Creates profile if it doesn't exist
   */
  getMine: proProcedure.query(async ({ ctx }) => {
    try {
      return await proPayoutProfileService.getOrCreateForPro(ctx.actor);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get payout profile",
      });
    }
  }),

  /**
   * Update the current pro's payout profile
   * Allows partial updates and recomputes isComplete status
   */
  updateMine: proProcedure
    .input(
      z.object({
        fullName: z.string().nullable().optional(),
        documentId: z.string().nullable().optional(),
        bankName: z.string().nullable().optional(),
        bankAccountNumber: z.string().nullable().optional(),
        bankAccountType: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await proPayoutProfileService.updateForPro(ctx.actor, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update payout profile",
        });
      }
    }),

  /**
   * Get financial summary for the current pro
   * Returns available, pending, and total paid amounts
   */
  getSummary: proProcedure.query(async ({ ctx }) => {
    try {
      return await proPayoutProfileService.getFinancialSummary(ctx.actor);
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get financial summary",
      });
    }
  }),

  /**
   * Get earnings for the current pro
   * Returns list of earnings with optional filtering
   */
  getMineEarnings: proProcedure
    .input(
      z
        .object({
          status: z.enum(["PENDING", "PAYABLE", "PAID", "REVERSED"]).optional(),
          limit: z.number().int().positive().max(100).optional(),
          offset: z.number().int().nonnegative().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        return await earningService.getEarningsForPro(ctx.actor, {
          status: input?.status,
          limit: input?.limit,
          offset: input?.offset,
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get earnings",
        });
      }
    }),

  /**
   * Get payout history for the current pro
   * Returns list of payouts ordered by most recent first
   */
  getMinePayouts: proProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().max(100).optional(),
          offset: z.number().int().nonnegative().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get pro profile for actor
        const proProfile = await proRepository.findByUserId(ctx.actor.id);
        if (!proProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pro profile not found",
          });
        }

        const payouts = await payoutRepository.listByProProfileId(
          proProfile.id,
          {
            limit: input?.limit,
            offset: input?.offset,
          }
        );

        return payouts.map((payout) => ({
          id: payout.id,
          status: payout.status,
          amount: payout.amount,
          currency: payout.currency,
          provider: payout.provider,
          providerReference: payout.providerReference,
          failureReason: payout.failureReason,
          createdAt: payout.createdAt,
          sentAt: payout.sentAt,
          settledAt: payout.settledAt,
        }));
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get payout history",
        });
      }
    }),
});
