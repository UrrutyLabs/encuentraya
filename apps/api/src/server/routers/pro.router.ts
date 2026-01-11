import { z } from "zod";
import { router, publicProcedure, protectedProcedure, proProcedure } from "../trpc";
import { proService } from "../services/pro.service";
import {
  proOnboardInputSchema,
  proSetAvailabilityInputSchema,
} from "@repo/domain";
import { TRPCError } from "@trpc/server";

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
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const pro = await proService.getProById(input.id);
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
});
