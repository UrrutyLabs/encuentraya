import { router, protectedProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { ClientProfileService } from "./clientProfile.service";
import { clientProfileUpdateInputSchema } from "@repo/domain";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const clientProfileService = container.resolve<ClientProfileService>(
  TOKENS.ClientProfileService
);

export const clientProfileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    try {
      const profile = await clientProfileService.getProfileByUserId(
        ctx.actor.id
      );
      if (!profile) {
        // Ensure profile exists
        return await clientProfileService.ensureClientProfileExists(
          ctx.actor.id
        );
      }
      return profile;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to get client profile",
      });
    }
  }),

  update: protectedProcedure
    .input(clientProfileUpdateInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await clientProfileService.updateProfile(ctx.actor.id, input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update client profile",
        });
      }
    }),
});
