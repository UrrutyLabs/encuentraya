import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
  proProcedure,
  adminProcedure,
} from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { OrderCreationService } from "./order.creation.service";
import { OrderLifecycleService } from "./order.lifecycle.service";
import { OrderFinalizationService } from "./order.finalization.service";
import { OrderService } from "./order.service";
import { OrderAdminService } from "./order.admin.service";
import type { ProRepository } from "@modules/pro/pro.repo";
import {
  orderCreateInputSchema,
  orderSchema,
  orderStatusSchema,
  ApprovalMethod,
} from "@repo/domain";
import { mapDomainErrorToTRPCError } from "@shared/errors/error-mapper";

// Resolve services from container
const orderCreationService = container.resolve<OrderCreationService>(
  TOKENS.OrderCreationService
);
const orderLifecycleService = container.resolve<OrderLifecycleService>(
  TOKENS.OrderLifecycleService
);
const orderFinalizationService = container.resolve<OrderFinalizationService>(
  TOKENS.OrderFinalizationService
);
const orderService = container.resolve<OrderService>(TOKENS.OrderService);
const orderAdminService = container.resolve<OrderAdminService>(
  TOKENS.OrderAdminService
);
const proRepository = container.resolve<ProRepository>(TOKENS.ProRepository);

export const orderRouter = router({
  /**
   * Create a new order request
   * Client creates an order request for a pro
   */
  create: protectedProcedure
    .input(orderCreateInputSchema)
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderCreationService.createOrderRequest(ctx.actor, input);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Get order by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(orderSchema.nullable())
    .query(async ({ input }) => {
      try {
        return await orderService.getOrderById(input.id);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Get order by display ID
   */
  getByDisplayId: publicProcedure
    .input(z.object({ displayId: z.string() }))
    .output(orderSchema.nullable())
    .query(async ({ input }) => {
      try {
        return await orderService.getOrderByDisplayId(input.displayId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * List orders for authenticated client
   */
  listByClient: protectedProcedure
    .output(z.array(orderSchema))
    .query(async ({ ctx }) => {
      try {
        return await orderService.getOrdersByClient(ctx.actor.id);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * List orders for authenticated pro
   */
  listByPro: proProcedure
    .output(z.array(orderSchema))
    .query(async ({ ctx }) => {
      try {
        // Get pro profile ID from actor
        const proProfile = await proRepository.findByUserId(ctx.actor.id);
        if (!proProfile) {
          throw new Error("Pro profile not found");
        }
        return await orderService.getOrdersByPro(proProfile.id);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Pro accepts an order
   * Transition: pending_pro_confirmation → accepted
   */
  accept: proProcedure
    .input(z.object({ orderId: z.string() }))
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.acceptOrder(
          ctx.actor,
          input.orderId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Client confirms order and authorizes payment
   * Transition: accepted → confirmed
   */
  confirm: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.confirmOrder(
          ctx.actor,
          input.orderId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Pro marks order as in progress
   * Transition: confirmed → in_progress
   */
  markInProgress: proProcedure
    .input(z.object({ orderId: z.string() }))
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.markInProgress(
          ctx.actor,
          input.orderId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Pro marks as arrived at location
   * Status remains IN_PROGRESS, but arrivedAt timestamp is set
   */
  markArrived: proProcedure
    .input(z.object({ orderId: z.string() }))
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.markArrived(
          ctx.actor,
          input.orderId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Pro submits final hours
   * Transition: in_progress → awaiting_client_approval
   */
  submitHours: proProcedure
    .input(
      z.object({
        orderId: z.string(),
        finalHours: z.number().positive(),
      })
    )
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.submitHours(
          ctx.actor,
          input.orderId,
          input.finalHours
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Client approves submitted hours
   * This triggers finalization and payment capture
   * Transition: awaiting_client_approval → completed → paid
   */
  approveHours: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // First approve the hours
        const order = await orderLifecycleService.approveHours(
          ctx.actor,
          input.orderId
        );

        // Then finalize the order (creates line items, calculates totals, captures payment)
        const finalized = await orderFinalizationService.finalizeOrder(
          input.orderId,
          order.finalHoursSubmitted!,
          ApprovalMethod.CLIENT_ACCEPTED
        );

        return finalized;
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Client disputes submitted hours
   * Transition: awaiting_client_approval → disputed
   */
  disputeHours: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string().min(1),
      })
    )
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.disputeHours(
          ctx.actor,
          input.orderId,
          input.reason
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Cancel order
   * Can be called by client or pro
   */
  cancel: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: z.string().optional(),
      })
    )
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.cancelOrder(
          ctx.actor,
          input.orderId,
          input.reason
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Admin: List all orders
   */
  adminList: adminProcedure
    .input(
      z
        .object({
          status: orderStatusSchema.optional(),
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
        return await orderAdminService.adminListOrders(input);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Admin: Get order by ID
   */
  adminGetById: adminProcedure
    .input(z.object({ orderId: z.string() }))
    .output(orderSchema)
    .query(async ({ input }) => {
      try {
        return await orderAdminService.adminGetOrderById(input.orderId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Admin: Force update order status
   */
  adminUpdateStatus: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: orderStatusSchema,
        reason: z.string().optional(),
      })
    )
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderAdminService.adminUpdateStatus(
          ctx.actor,
          input.orderId,
          input.status,
          input.reason
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),
});
