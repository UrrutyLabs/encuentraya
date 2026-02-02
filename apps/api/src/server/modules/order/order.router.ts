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
import { OrderEstimationService } from "./order.estimation.service";
import { OrderLifecycleService } from "./order.lifecycle.service";
import { OrderFinalizationService } from "./order.finalization.service";
import { OrderService } from "./order.service";
import { OrderAdminService } from "./order.admin.service";
import type { ProRepository } from "@modules/pro/pro.repo";
import type { ClientProfileRepository } from "@modules/user/clientProfile.repo";
import { maskDisplayName } from "@shared/display-name";
import {
  orderCreateInputSchema,
  orderEstimateInputSchema,
  orderEstimateOutputSchema,
  orderSchema,
  orderStatusSchema,
  orderDetailViewSchema,
  OrderStatus,
  ApprovalMethod,
  type OrderCostBreakdown,
} from "@repo/domain";
import { photoUrlsSchema } from "@repo/upload";
import { mapDomainErrorToTRPCError } from "@shared/errors/error-mapper";
import type { OrderEstimateOutput, Order } from "@repo/domain";
import type { ReceiptRepository } from "./receipt.repo";
import { receiptEntityToOrderReceipt } from "./receipt.repo";

/** Fallback estimate when estimation service cannot be called (e.g. no proProfileId). */
function buildFallbackEstimate(order: Order): OrderEstimateOutput {
  const pricingMode = (order.pricingMode ?? "hourly") as string;
  if (pricingMode === "fixed") {
    if (order.quotedAmountCents != null && order.quotedAmountCents > 0) {
      return orderEstimationService.estimateFromQuotedAmount(
        order.quotedAmountCents,
        order.currency
      );
    }
    return buildNoQuoteEstimate(order.currency);
  }
  const hours = order.estimatedHours ?? 0;
  const laborAmount = Math.round(order.hourlyRateSnapshotAmount * hours);
  return {
    laborAmount,
    platformFeeAmount: 0,
    platformFeeRate: 0,
    taxAmount: 0,
    taxRate: 0.22,
    subtotalAmount: laborAmount,
    totalAmount: laborAmount,
    currency: order.currency,
    lineItems: [
      {
        type: "labor",
        description: `Labor (${hours} horas)`,
        amount: laborAmount,
      },
    ],
  };
}

/** Estimate for fixed-price order when no quote has been submitted yet. */
function buildNoQuoteEstimate(currency: string): OrderEstimateOutput {
  return {
    laborAmount: 0,
    platformFeeAmount: 0,
    platformFeeRate: 0,
    taxAmount: 0,
    taxRate: 0.22,
    subtotalAmount: 0,
    totalAmount: 0,
    currency,
    lineItems: [
      {
        type: "labor",
        description: "Presupuesto pendiente",
        amount: 0,
      },
    ],
  };
}

// Resolve services from container
const orderCreationService = container.resolve<OrderCreationService>(
  TOKENS.OrderCreationService
);
const orderEstimationService = container.resolve<OrderEstimationService>(
  TOKENS.OrderEstimationService
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
const receiptRepository = container.resolve<ReceiptRepository>(
  TOKENS.ReceiptRepository
);
const clientProfileRepository = container.resolve<ClientProfileRepository>(
  TOKENS.ClientProfileRepository
);

async function getClientDisplayNameMasked(userId: string): Promise<string> {
  const profile = await clientProfileRepository.findByUserId(userId);
  if (!profile) return "Cliente";
  const first = profile.firstName?.trim() ?? "";
  const last = profile.lastName?.trim() ?? "";
  const full = [first, last].filter(Boolean).join(" ");
  return full ? maskDisplayName(full) : "Cliente";
}

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
   * Estimate order cost before creation
   * Returns breakdown of labor, platform fee, tax, and totals
   */
  estimateCost: publicProcedure
    .input(orderEstimateInputSchema)
    .output(orderEstimateOutputSchema)
    .query(async ({ input }) => {
      try {
        return await orderEstimationService.estimateOrderCost(input);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Get order by ID (detail view).
   * Returns OrderDetailView with costBreakdown: receipt when finalized, estimate otherwise.
   */
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(orderDetailViewSchema.nullable())
    .query(async ({ input }) => {
      try {
        const order = await orderService.getOrderById(input.id);
        if (!order) return null;

        const isFinalized =
          order.status === OrderStatus.COMPLETED ||
          order.status === OrderStatus.PAID;
        let costBreakdown: OrderCostBreakdown;

        if (isFinalized) {
          const receipt = await receiptRepository.findByOrderId(input.id);
          if (receipt) {
            costBreakdown = {
              kind: "receipt",
              ...receiptEntityToOrderReceipt(receipt),
            };
          } else {
            costBreakdown = {
              kind: "estimate",
              ...buildFallbackEstimate(order),
            };
          }
        } else {
          const pricingMode = (order.pricingMode ?? "hourly") as string;
          const isFixed = pricingMode === "fixed";
          let estimation: OrderEstimateOutput;
          if (isFixed) {
            estimation =
              order.quotedAmountCents != null && order.quotedAmountCents > 0
                ? orderEstimationService.estimateFromQuotedAmount(
                    order.quotedAmountCents,
                    order.currency
                  )
                : buildNoQuoteEstimate(order.currency);
          } else {
            estimation =
              (order.proProfileId && (order.estimatedHours ?? 0) > 0
                ? await orderEstimationService
                    .estimateOrderCost({
                      proProfileId: order.proProfileId,
                      estimatedHours: order.estimatedHours ?? 0,
                      categoryId: order.categoryId,
                    })
                    .catch(() => null)
                : null) ?? buildFallbackEstimate(order);
          }
          costBreakdown = { kind: "estimate", ...estimation };
        }

        const clientDisplayName = await getClientDisplayNameMasked(
          order.clientUserId
        );
        return { ...order, costBreakdown, clientDisplayName };
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
        const orders = await orderService.getOrdersByPro(proProfile.id);
        const withClientDisplayName = await Promise.all(
          orders.map(async (o) => ({
            ...o,
            clientDisplayName: await getClientDisplayNameMasked(o.clientUserId),
          }))
        );
        return withClientDisplayName;
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
        photoUrls: photoUrlsSchema.optional(),
      })
    )
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.submitHours(
          ctx.actor,
          input.orderId,
          input.finalHours,
          { photoUrls: input.photoUrls }
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Client approves submitted hours (or fixed-price completion)
   * This triggers finalization and payment capture
   * Transition: awaiting_client_approval → completed → paid
   * For fixed-price orders, approvedHours is ignored; finalization uses quotedAmountCents.
   */
  approveHours: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const order = await orderLifecycleService.approveHours(
          ctx.actor,
          input.orderId
        );

        const pricingMode = (order.pricingMode ?? "hourly") as string;
        const isFixed = pricingMode === "fixed";
        const approvedHoursForFinalization = isFixed
          ? 0
          : (order.finalHoursSubmitted ?? 0);

        const finalized = await orderFinalizationService.finalizeOrder(
          input.orderId,
          approvedHoursForFinalization,
          ApprovalMethod.CLIENT_ACCEPTED
        );

        return finalized;
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Pro submits a fixed-price quote (fixed orders only, status remains accepted)
   */
  submitQuote: proProcedure
    .input(
      z.object({
        orderId: z.string(),
        amountCents: z.number().int().positive(),
        message: z.string().optional(),
      })
    )
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.submitQuote(
          ctx.actor,
          input.orderId,
          input.amountCents,
          input.message
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Client accepts pro's fixed-price quote (fixed orders only)
   */
  acceptQuote: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.acceptQuote(
          ctx.actor,
          input.orderId
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  /**
   * Pro marks fixed-price job complete (no hours)
   * Transition: in_progress → awaiting_client_approval. Fixed orders only.
   */
  submitCompletion: proProcedure
    .input(
      z.object({
        orderId: z.string(),
        photoUrls: photoUrlsSchema.optional(),
      })
    )
    .output(orderSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await orderLifecycleService.submitCompletion(
          ctx.actor,
          input.orderId,
          { photoUrls: input.photoUrls }
        );
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
