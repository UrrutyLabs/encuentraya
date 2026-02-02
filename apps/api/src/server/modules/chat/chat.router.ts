import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "@infra/trpc";
import { container, TOKENS } from "@/server/container";
import { ChatService } from "./chat.service";
import { mapDomainErrorToTRPCError } from "@shared/errors/error-mapper";

const chatService = container.resolve<ChatService>(TOKENS.ChatService);

const orderMessageSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  senderUserId: z.string().nullable(),
  senderRole: z.enum(["client", "pro", "admin", "system"]),
  type: z.enum(["user", "system"]),
  text: z.string(),
  attachmentsJson: z.record(z.unknown()).nullable(),
  createdAt: z.date(),
});

export const chatRouter = router({
  listByOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        cursor: z.string().nullable().optional(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .output(
      z.object({
        items: z.array(orderMessageSchema),
        nextCursor: z.string().nullable(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        return await chatService.listByOrder(
          ctx.actor,
          input.orderId,
          input.cursor ?? null,
          input.limit ?? 20
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  send: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        text: z.string().min(1).max(10000),
        attachmentsJson: z.record(z.unknown()).nullable().optional(),
      })
    )
    .output(orderMessageSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await chatService.send(
          ctx.actor,
          input.orderId,
          input.text,
          input.attachmentsJson ?? null
        );
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  markRead: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await chatService.markRead(ctx.actor, input.orderId);
        return { ok: true };
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  unreadCount: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .output(z.number())
    .query(async ({ input, ctx }) => {
      try {
        return await chatService.unreadCount(ctx.actor, input.orderId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  isChatOpen: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .output(z.boolean())
    .query(async ({ input, ctx }) => {
      try {
        return await chatService.isChatOpenForOrder(ctx.actor, input.orderId);
      } catch (error) {
        throw mapDomainErrorToTRPCError(error);
      }
    }),

  adminListByOrder: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        cursor: z.string().nullable().optional(),
        limit: z.number().min(1).max(100).optional(),
      })
    )
    .output(
      z.object({
        items: z.array(orderMessageSchema),
        nextCursor: z.string().nullable(),
      })
    )
    .query(async ({ input }) => {
      return await chatService.listByOrderForAdmin(
        input.orderId,
        input.cursor ?? null,
        input.limit ?? 100
      );
    }),
});
