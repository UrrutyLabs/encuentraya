import { router, publicProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { SearchService } from "./search.service";
import { clientSearchProsInputSchema } from "@repo/domain";
import { TRPCError } from "@trpc/server";

// Resolve service from container
const searchService = container.resolve<SearchService>(TOKENS.SearchService);

export const searchRouter = router({
  searchPros: publicProcedure
    .input(clientSearchProsInputSchema)
    .query(async ({ input }) => {
      try {
        // Validate date: only allow today (if time window is valid) or future dates
        if (input.date) {
          const now = new Date();

          // Get today's date in UTC (date-only, no time)
          const todayUTC = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
          );

          // Get input date in UTC (date-only, no time)
          const inputDateUTC = new Date(input.date);
          const inputDateOnlyUTC = new Date(
            Date.UTC(
              inputDateUTC.getUTCFullYear(),
              inputDateUTC.getUTCMonth(),
              inputDateUTC.getUTCDate()
            )
          );

          // Check if date is in the past
          if (inputDateOnlyUTC < todayUTC) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot search for dates in the past",
            });
          }

          // If date is today and a time window is provided, check if the window has already passed
          if (
            inputDateOnlyUTC.getTime() === todayUTC.getTime() &&
            input.timeWindow
          ) {
            const [windowStart] = input.timeWindow.split("-");
            if (!windowStart) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Invalid time window format",
              });
            }
            const [windowHour, windowMinute] = windowStart
              .split(":")
              .map(Number);

            // Create a date for today at the window start time (in UTC)
            const windowTimeUTC = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                windowHour,
                windowMinute,
                0,
                0
              )
            );

            // If current time is past the start of the time window, reject it
            if (now >= windowTimeUTC) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `The selected time window "${input.timeWindow}" has already passed for today`,
              });
            }
          }
        }

        return await searchService.searchPros({
          categoryId: input.categoryId,
          subcategory: input.subcategory,
          date: input.date,
          timeWindow: input.timeWindow,
        });
      } catch (error) {
        // Re-throw TRPCError as-is
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to search pros",
        });
      }
    }),
});
