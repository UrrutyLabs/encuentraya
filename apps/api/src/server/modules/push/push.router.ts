import { router, protectedProcedure } from "@infra/trpc";
import { z } from "zod";
import { container, TOKENS } from "@/server/container";
import type { PushTokenService } from "./pushToken.service";

export const pushRouter = router({
  /**
   * Register a push token for the authenticated user
   * Role-agnostic: can be used by any logged-in user
   */
  registerToken: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["IOS", "ANDROID"]),
        token: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const pushTokenService = container.resolve<PushTokenService>(TOKENS.PushTokenService);
      await pushTokenService.registerToken(ctx.actor, input);
      return { success: true };
    }),

  /**
   * Unregister a push token for the authenticated user
   * Role-agnostic: can be used by any logged-in user
   */
  unregisterToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const pushTokenService = container.resolve<PushTokenService>(TOKENS.PushTokenService);
      await pushTokenService.unregisterToken(ctx.actor, input);
      return { success: true };
    }),
});
