import { router, publicProcedure } from "../trpc";
import { bookingRouter } from "./booking.router";
import { proRouter } from "./pro.router";

export const appRouter = router({
  health: router({
    ping: publicProcedure.query(() => {
      return {
        ok: true,
        time: new Date(),
      };
    }),
  }),
  booking: bookingRouter,
  pro: proRouter,
});

export type AppRouter = typeof appRouter;
