import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
  proProcedure,
} from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { BookingService } from "./booking.service";
import {
  bookingCreateInputSchema,
  bookingCreateOutputSchema,
  BookingStatus,
} from "@repo/domain";
import { mapDomainErrorToTRPCError } from "@shared/errors/error-mapper";

// Resolve service from container
const bookingService = container.resolve<BookingService>(TOKENS.BookingService);

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

  onMyWay: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingService.markOnMyWay(ctx.actor, input.bookingId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  arrive: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingService.arriveBooking(ctx.actor, input.bookingId);
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

  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return bookingService.getClientBookings(ctx.actor.id);
  }),

  proInbox: proProcedure.query(async ({ ctx }) => {
    try {
      const allBookings = await bookingService.getProBookingsByUserId(ctx.actor.id);
      // Filter to pending and accepted bookings
      return allBookings.filter(
        (booking) =>
          booking.status === BookingStatus.PENDING ||
          booking.status === BookingStatus.ACCEPTED
      );
    } catch (error) {
      throw mapDomainErrorToTRPCError(error);
    }
  }),

  proJobs: proProcedure.query(async ({ ctx }) => {
    try {
      const allBookings = await bookingService.getProBookingsByUserId(ctx.actor.id);
      // Filter to accepted, on my way, arrived, and completed bookings
      return allBookings.filter(
        (booking) =>
          booking.status === BookingStatus.ACCEPTED ||
          booking.status === BookingStatus.ON_MY_WAY ||
          booking.status === BookingStatus.ARRIVED ||
          booking.status === BookingStatus.COMPLETED
      );
    } catch (error) {
      throw mapDomainErrorToTRPCError(error);
    }
  }),
});
