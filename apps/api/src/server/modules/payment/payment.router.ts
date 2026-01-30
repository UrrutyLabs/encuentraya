import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import type { PaymentServiceFactory } from "@/server/container";
import type { PaymentRepository } from "./payment.repo";
import type { OrderRepository } from "@modules/order/order.repo";
import { PaymentProvider, PaymentStatus } from "@repo/domain";
import { TRPCError } from "@trpc/server";
import { mapDomainErrorToTRPCError } from "@shared/errors/error-mapper";

// Resolve payment service factory from container
const paymentServiceFactory = container.resolve<PaymentServiceFactory>(
  TOKENS.PaymentServiceFactory
);

export const paymentRouter = router({
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
   * Create a preauthorization for an order
   * Returns payment ID and checkout URL
   */
  createPreauthForOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
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
        return await paymentService.createPreauthForOrder(ctx.actor, input);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Get payment summary for an order
   * Only accessible by the order client or admin
   */
  getByOrder: protectedProcedure
    .input(z.object({ orderId: z.string() }))
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
        const orderRepo = container.resolve<OrderRepository>(
          TOKENS.OrderRepository
        );

        // Get order to verify ownership
        const order = await orderRepo.findById(input.orderId);
        if (!order) {
          return null;
        }

        // Authorization: Only order client or admin can view payment
        if (ctx.actor.role !== "admin" && order.clientUserId !== ctx.actor.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view payments for your own orders",
          });
        }

        const payment = await paymentRepo.findByOrderId(input.orderId);
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
        throw mapDomainErrorToTRPCError(error);
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
