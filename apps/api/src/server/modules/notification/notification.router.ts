import { router, adminProcedure } from "@infra/trpc";
import { z } from "zod";
import { container, TOKENS } from "@/server/container";
import type { NotificationService } from "./notification.service";
import type { NotificationDeliveryRepository } from "./notificationDelivery.repo";

export const notificationRouter = router({
  /**
   * Deliver a test notification
   * Admin-only endpoint for testing notification delivery
   */
  deliverTest: adminProcedure
    .input(
      z.object({
        channel: z.enum(["EMAIL", "WHATSAPP", "PUSH"]),
        recipientRef: z.string(),
        templateId: z.string().optional().default("test-template"),
        payload: z.record(z.unknown()).optional().default({}),
      })
    )
    .mutation(async ({ input }) => {
      const notificationService = container.resolve<NotificationService>(
        TOKENS.NotificationService
      );

      const idempotencyKey = `test:${Date.now()}:${input.recipientRef}:${input.channel}`;

      const result = await notificationService.deliverNow({
        channel: input.channel,
        recipientRef: input.recipientRef,
        templateId: input.templateId,
        payload: input.payload,
        idempotencyKey,
      });

      return result;
    }),

  /**
   * Drain queued notifications
   * Admin-only endpoint for processing queued notifications (can be called by cron)
   */
  drainQueued: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).optional().default(25),
      })
    )
    .mutation(async ({ input }) => {
      const notificationService = container.resolve<NotificationService>(
        TOKENS.NotificationService
      );

      const result = await notificationService.drainQueued(input.limit);

      return result;
    }),

  /**
   * List failed notifications
   * Admin-only endpoint for viewing failed deliveries
   */
  listFailed: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).optional().default(25),
      })
    )
    .query(async ({ input }) => {
      const notificationDeliveryRepository =
        container.resolve<NotificationDeliveryRepository>(
          TOKENS.NotificationDeliveryRepository
        );

      const failed = await notificationDeliveryRepository.listFailed(
        input.limit
      );

      return failed;
    }),

  /**
   * Retry failed notifications
   * Admin-only endpoint for retrying failed deliveries
   */
  retryFailed: adminProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).optional().default(25),
      })
    )
    .mutation(async ({ input }) => {
      const notificationDeliveryRepository =
        container.resolve<NotificationDeliveryRepository>(
          TOKENS.NotificationDeliveryRepository
        );
      const notificationService = container.resolve<NotificationService>(
        TOKENS.NotificationService
      );

      const failed = await notificationDeliveryRepository.listFailed(
        input.limit
      );
      let retried = 0;
      let sent = 0;
      let failedAgain = 0;

      for (const delivery of failed) {
        // Reconstruct NotificationMessage from delivery row
        const message = {
          channel: delivery.channel as "EMAIL" | "WHATSAPP" | "PUSH",
          recipientRef: delivery.recipientRef,
          templateId: delivery.templateId,
          payload: delivery.payload,
          idempotencyKey: delivery.idempotencyKey, // Reuse same idempotencyKey
        };

        // Attempt delivery (deliverNow will short-circuit if already SENT)
        const result = await notificationService.deliverNow(message);
        retried++;

        if (result.status === "SENT") {
          sent++;
        } else if (result.status === "FAILED") {
          failedAgain++;
        }
      }

      return {
        retried,
        sent,
        failedAgain,
      };
    }),
});
