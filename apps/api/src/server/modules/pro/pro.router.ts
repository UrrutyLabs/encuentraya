import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
  proProcedure,
  adminProcedure,
} from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { ProService } from "./pro.service";
import {
  proOnboardInputSchema,
  proUpdateProfileInputSchema,
  proSetAvailabilityInputSchema,
  updateAvailabilitySlotsInputSchema,
} from "@repo/domain";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const proService = container.resolve<ProService>(TOKENS.ProService);

export const proRouter = router({
  onboard: publicProcedure
    .input(proOnboardInputSchema)
    .mutation(async ({ input }) => {
      try {
        return await proService.onboardPro(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to onboard pro",
        });
      }
    }),

  convertToPro: protectedProcedure
    .input(proOnboardInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await proService.convertUserToPro(ctx.actor.id, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to convert user to pro",
        });
      }
    }),

  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
        categoryId: z.string().optional(),
        subcategoryId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const pro = await proService.getProById(input.id, input.categoryId);
      if (!pro) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pro not found",
        });
      }
      return pro;
    }),

  getAll: publicProcedure.query(async () => {
    return proService.getAllPros();
  }),

  getMyProfile: proProcedure.query(async ({ ctx }) => {
    try {
      const pro = await proService.getProByUserId(ctx.actor.id);
      if (!pro) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pro profile not found",
        });
      }
      return pro;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error ? error.message : "Failed to get pro profile",
      });
    }
  }),

  setAvailability: proProcedure
    .input(proSetAvailabilityInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Get pro profile from user ID
      const proProfile = await proService.getProByUserId(ctx.actor.id);
      if (!proProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pro profile not found",
        });
      }

      try {
        return await proService.setAvailability(proProfile.id, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update availability",
        });
      }
    }),

  getAvailabilitySlots: proProcedure.query(async ({ ctx }) => {
    try {
      const proProfile = await proService.getProByUserId(ctx.actor.id);
      if (!proProfile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pro profile not found",
        });
      }
      return await proService.getAvailabilitySlots(proProfile.id);
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get availability slots",
      });
    }
  }),

  updateAvailabilitySlots: proProcedure
    .input(updateAvailabilitySlotsInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const proProfile = await proService.getProByUserId(ctx.actor.id);
        if (!proProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pro profile not found",
          });
        }
        return await proService.updateAvailabilitySlots(proProfile.id, input);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update availability slots",
        });
      }
    }),

  updateProfile: proProcedure
    .input(proUpdateProfileInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await proService.updateProfile(ctx.actor.id, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to update profile",
        });
      }
    }),

  /**
   * Admin: List all pros with filters
   */
  adminList: adminProcedure
    .input(
      z
        .object({
          query: z.string().optional(),
          status: z.enum(["pending", "active", "suspended"]).optional(),
          limit: z.number().int().positive().max(100).optional(),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        return await proService.adminListPros(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to list pros",
        });
      }
    }),

  /**
   * Admin: Get pro by ID with full details including payout profile
   */
  adminById: adminProcedure
    .input(z.object({ proProfileId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await proService.adminGetProById(input.proProfileId);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to get pro",
        });
      }
    }),

  /**
   * Admin: Suspend a pro
   */
  suspend: adminProcedure
    .input(
      z.object({
        proProfileId: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await proService.suspendPro(
          input.proProfileId,
          input.reason,
          ctx.actor
        );
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to suspend pro",
        });
      }
    }),

  /**
   * Admin: Approve a pro (set status from pending to active)
   */
  approve: adminProcedure
    .input(z.object({ proProfileId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await proService.approvePro(input.proProfileId, ctx.actor);
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        if (error instanceof Error && error.message.includes("not pending")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to approve pro",
        });
      }
    }),

  /**
   * Admin: Unsuspend a pro (set to active)
   */
  unsuspend: adminProcedure
    .input(z.object({ proProfileId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await proService.unsuspendPro(input.proProfileId, ctx.actor);
        return { success: true };
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to unsuspend pro",
        });
      }
    }),
});
