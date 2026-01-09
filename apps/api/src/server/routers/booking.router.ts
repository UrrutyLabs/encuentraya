import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
  proProcedure,
} from "../trpc";
import { bookingService } from "../services/booking.service";
import {
  bookingCreateInputSchema,
  bookingCreateOutputSchema,
} from "@repo/domain";
import { mapDomainErrorToTRPCError } from "../errors/error-mapper";

export const bookingRouter = router({
  create: protectedProcedure
    .input(bookingCreateInputSchema)
    .output(bookingCreateOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingService.createBooking(ctx.actor, input);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  accept: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingService.acceptBooking(ctx.actor, input.bookingId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  reject: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingService.rejectBooking(ctx.actor, input.bookingId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingService.cancelBooking(ctx.actor, input.bookingId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  complete: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingService.completeBooking(ctx.actor, input.bookingId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const booking = await bookingService.getBookingById(input.id);
      if (!booking) {
        throw mapDomainErrorToTRPCError(
          new Error(`Booking not found: ${input.id}`)
        );
      }
      return booking;
    }),

  getByClient: publicProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ input }) => {
      return bookingService.getClientBookings(input.clientId);
    }),

  getByPro: publicProcedure
    .input(z.object({ proId: z.string() }))
    .query(async ({ input }) => {
      return bookingService.getProBookings(input.proId);
    }),
});
