import { router, publicProcedure } from "@infra/trpc";
import { bookingRouter } from "@modules/booking/booking.router";
import { proRouter } from "@modules/pro/pro.router";
import { authRouter } from "./auth.router";
import { reviewRouter } from "@modules/review/review.router";
import { paymentRouter } from "@modules/payment/payment.router";
import { notificationRouter } from "@modules/notification/notification.router";
import { pushRouter } from "@modules/push/push.router";
import { container, TOKENS } from "@/server/container";
import { ProService } from "@modules/pro/pro.service";
import { clientSearchProsInputSchema } from "@repo/domain";

// Resolve service from container
const proService = container.resolve<ProService>(TOKENS.ProService);

export const appRouter = router({
  health: router({
    ping: publicProcedure.query(() => {
      return {
        ok: true,
        time: new Date(),
      };
    }),
  }),
  auth: authRouter,
  booking: bookingRouter,
  pro: proRouter,
  review: reviewRouter,
  payment: paymentRouter,
  notification: notificationRouter,
  push: pushRouter,
  client: router({
    searchPros: publicProcedure
      .input(clientSearchProsInputSchema)
      .query(async ({ input }) => {
        // Get all pros and filter
        const allPros = await proService.getAllPros();
        
        // Filter by category if provided
        const filtered = allPros.filter((pro) => {
          if (!pro.isApproved || pro.isSuspended) return false;
          if (input.category && !pro.categories.includes(input.category)) {
            return false;
          }
          return true;
        });

        // TODO: Filter by date/time when availability system is ready
        // For now, return all matching pros
        
        return filtered;
      }),
  }),
});

export type AppRouter = typeof appRouter;
