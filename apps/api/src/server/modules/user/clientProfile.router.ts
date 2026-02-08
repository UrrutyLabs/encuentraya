import { router, protectedProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { ClientProfileService } from "./clientProfile.service";
import type { AvatarUrlService } from "@modules/avatar/avatar-url.service";
import { clientProfileUpdateInputSchema } from "@repo/domain";
import { TRPCError } from "@trpc/server";

const clientProfileService = container.resolve<ClientProfileService>(
  TOKENS.ClientProfileService
);
const avatarUrlService = container.resolve<AvatarUrlService>(
  TOKENS.AvatarUrlService
);

export const clientProfileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    try {
      let profile = await clientProfileService.getProfileByUserId(ctx.actor.id);
      if (!profile) {
        profile = await clientProfileService.ensureClientProfileExists(
          ctx.actor.id
        );
      }
      // Resolve avatar path to signed URL for display
      const avatarUrl =
        profile.avatarUrl != null
          ? await avatarUrlService.resolveClientAvatar(
              ctx.actor.id,
              profile.avatarUrl
            )
          : undefined;

      return { ...profile, avatarUrl: avatarUrl ?? profile.avatarUrl ?? null };
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
