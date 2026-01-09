import { z } from "zod";
import { router, publicProcedure, proProcedure } from "../trpc";
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

  setAvailability: proProcedure
    .input(proSetAvailabilityInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Use authenticated pro's ID from context
      const proId = ctx.actor.id;

      try {
        return await proService.setAvailability(proId, input);
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
