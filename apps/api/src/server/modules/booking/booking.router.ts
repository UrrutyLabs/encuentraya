import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
  proProcedure,
  adminProcedure,
} from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { BookingCreationService } from "./booking.creation.service";
import { BookingLifecycleService } from "./booking.lifecycle.service";
import { BookingCompletionService } from "./booking.completion.service";
import { BookingQueryService } from "./booking.query.service";
import { BookingAdminService } from "./booking.admin.service";
import {
  bookingCreateInputSchema,
  bookingCreateOutputSchema,
  BookingStatus,
} from "@repo/domain";
import { mapDomainErrorToTRPCError } from "@shared/errors/error-mapper";

// Resolve services from container
const bookingCreationService = container.resolve<BookingCreationService>(
  TOKENS.BookingCreationService
);
const bookingLifecycleService = container.resolve<BookingLifecycleService>(
  TOKENS.BookingLifecycleService
);
const bookingCompletionService = container.resolve<BookingCompletionService>(
  TOKENS.BookingCompletionService
);
const bookingQueryService = container.resolve<BookingQueryService>(
  TOKENS.BookingQueryService
);
const bookingAdminService = container.resolve<BookingAdminService>(
  TOKENS.BookingAdminService
);

export const bookingRouter = router({
  create: protectedProcedure
    .input(bookingCreateInputSchema)
    .output(bookingCreateOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingCreationService.createBooking(ctx.actor, input);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  accept: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingLifecycleService.acceptBooking(
          ctx.actor,
          input.bookingId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  reject: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingLifecycleService.rejectBooking(
          ctx.actor,
          input.bookingId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  onMyWay: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingLifecycleService.markOnMyWay(
          ctx.actor,
          input.bookingId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  arrive: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingLifecycleService.arriveBooking(
          ctx.actor,
          input.bookingId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingLifecycleService.cancelBooking(
          ctx.actor,
          input.bookingId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  complete: proProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingCompletionService.completeBooking(
          ctx.actor,
          input.bookingId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const booking = await bookingQueryService.getBookingById(input.id);
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
      return bookingQueryService.getClientBookings(input.clientId);
    }),

  getByPro: publicProcedure
    .input(z.object({ proId: z.string() }))
    .query(async ({ input }) => {
      return bookingQueryService.getProBookings(input.proId);
    }),

  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return bookingQueryService.getClientBookings(ctx.actor.id);
  }),

  rebookTemplate: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        return await bookingQueryService.getRebookTemplate(
          ctx.actor,
          input.bookingId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  proInbox: proProcedure.query(async ({ ctx }) => {
    try {
      const allBookings = await bookingQueryService.getProBookingsByUserId(
        ctx.actor.id
      );
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
      const allBookings = await bookingQueryService.getProBookingsByUserId(
        ctx.actor.id
      );
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

  /**
   * Admin: List all bookings with filters
   */
  adminList: adminProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(BookingStatus).optional(),
          query: z.string().optional(),
          dateFrom: z.date().optional(),
          dateTo: z.date().optional(),
          limit: z.number().int().positive().max(100).optional(),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        return await bookingAdminService.adminListBookings(input);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Admin: Get booking by ID with full details
   */
  adminById: adminProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ input }) => {
      try {
        return await bookingAdminService.adminGetBookingById(input.bookingId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Admin: Force update booking status (bypasses state machine)
   */
  adminForceStatus: adminProcedure
    .input(
      z.object({
        bookingId: z.string(),
        status: z.nativeEnum(BookingStatus),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await bookingAdminService.adminForceStatus(
          input.bookingId,
          input.status,
          ctx.actor
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),
});
