import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import type { PaymentServiceFactory } from "@/server/container";
import type { PaymentRepository } from "./payment.repo";
import type { BookingRepository } from "@modules/booking/booking.repo";
import { PaymentProvider, PaymentStatus } from "@repo/domain";
import { TRPCError } from "@trpc/server";

// Resolve payment service factory from container
const paymentServiceFactory = container.resolve<PaymentServiceFactory>(
  TOKENS.PaymentServiceFactory
);

export const paymentRouter = router({
  /**
   * Create a preauthorization for a booking
   * Returns payment ID and checkout URL
   */
  createPreauthForBooking: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .output(
      z.object({
        paymentId: z.string(),
        checkoutUrl: z.string().nullable(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const paymentService = await paymentServiceFactory(
          PaymentProvider.MERCADO_PAGO
        );
        return await paymentService.createPreauthForBooking(ctx.actor, input);
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create payment preauthorization",
        });
      }
    }),

  /**
   * Get payment summary for a booking
   * Only accessible by the booking client or admin
   */
  getByBooking: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .output(
      z
        .object({
          id: z.string(),
          status: z.string(),
          amountEstimated: z.number(),
          amountAuthorized: z.number().nullable(),
          amountCaptured: z.number().nullable(),
          checkoutUrl: z.string().nullable(),
          currency: z.string(),
          createdAt: z.date(),
        })
        .nullable()
    )
    .query(async ({ input, ctx }) => {
      try {
        const paymentRepo = container.resolve<PaymentRepository>(
          TOKENS.PaymentRepository
        );
        const bookingRepo = container.resolve<BookingRepository>(
          TOKENS.BookingRepository
        );

        // Get booking to verify ownership
        const booking = await bookingRepo.findById(input.bookingId);
        if (!booking) {
          return null;
        }

        // Authorization: Only booking client or admin can view payment
        if (
          ctx.actor.role !== "admin" &&
          booking.clientUserId !== ctx.actor.id
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view payments for your own bookings",
          });
        }

        const payment = await paymentRepo.findByBookingId(input.bookingId);
        if (!payment) {
          return null;
        }

        return {
          id: payment.id,
          status: payment.status,
          amountEstimated: payment.amountEstimated,
          amountAuthorized: payment.amountAuthorized,
          amountCaptured: payment.amountCaptured,
          checkoutUrl: payment.checkoutUrl,
          currency: payment.currency,
          createdAt: payment.createdAt,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get payment",
        });
      }
    }),

  /**
   * Sync payment status with provider
   * Admin-only endpoint for manual reconciliation
   */
  syncStatus: adminProcedure
    .input(z.object({ paymentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const paymentRepo = container.resolve<PaymentRepository>(
          TOKENS.PaymentRepository
        );
        const payment = await paymentRepo.findById(input.paymentId);

        if (!payment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment not found",
          });
        }

        // Create service instance with the payment's provider
        const service = await paymentServiceFactory(payment.provider);
        await service.syncPaymentStatus(input.paymentId, ctx.actor);

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to sync payment status",
        });
      }
    }),

  /**
   * Admin: List all payments with filters
   */
  adminList: adminProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(PaymentStatus).optional(),
          query: z.string().optional(),
          limit: z.number().int().positive().max(100).optional(),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        // Use service factory with default provider for admin methods
        const service = await paymentServiceFactory(
          PaymentProvider.MERCADO_PAGO
        );
        return await service.adminListPayments(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to list payments",
        });
      }
    }),

  /**
   * Admin: Get payment by ID with full details including webhook events
   */
  adminById: adminProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      try {
        // Use service factory with default provider for admin methods
        const service = await paymentServiceFactory(
          PaymentProvider.MERCADO_PAGO
        );
        return await service.adminGetPaymentById(input.paymentId);
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get payment",
        });
      }
    }),
});
