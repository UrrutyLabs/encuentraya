import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { ReviewService } from "./review.service";
import {
  reviewCreateInputSchema,
  reviewCreateOutputSchema,
  reviewSchema,
} from "@repo/domain";
import { mapDomainErrorToTRPCError } from "@shared/errors/error-mapper";

// Resolve service from container
const reviewService = container.resolve<ReviewService>(TOKENS.ReviewService);

export const reviewRouter = router({
  create: protectedProcedure
    .input(reviewCreateInputSchema)
    .output(reviewCreateOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await reviewService.createReview(ctx.actor, input);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  byBooking: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .output(reviewSchema.nullable())
    .query(async ({ input, ctx }) => {
      try {
        return await reviewService.getByBookingId(ctx.actor, input.bookingId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  listForPro: publicProcedure
    .input(
      z.object({
        proId: z.string(),
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().optional(),
      })
    )
    .output(z.array(reviewSchema))
    .query(async ({ input }) => {
      try {
        return await reviewService.listForPro(
          input.proId,
          input.limit,
          input.cursor
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  statusByBookingIds: protectedProcedure
    .input(z.object({ bookingIds: z.array(z.string()) }))
    .output(z.record(z.string(), z.boolean()))
    .query(async ({ input }) => {
      try {
        return await reviewService.getReviewStatusByBookingIds(
          input.bookingIds
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),
});
