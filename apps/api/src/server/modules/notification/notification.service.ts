import { injectable, inject } from "tsyringe";
import type { NotificationDeliveryRepository } from "./notificationDelivery.repo";
import { TOKENS } from "@/server/container";
import type { NotificationMessage } from "./provider";
import { getNotificationProvider } from "./registry";
import { $Enums } from "../../../../prisma/generated/prisma/client";

/**
 * Notification service
 * Handles business logic for notification delivery
 */
@injectable()
export class NotificationService {
  constructor(
    @inject(TOKENS.NotificationDeliveryRepository)
    private readonly notificationDeliveryRepository: NotificationDeliveryRepository
  ) {}

  /**
   * Enqueue a notification for delivery
   * Returns existing delivery if idempotencyKey already exists (deduplication)
   */
  async enqueue(message: NotificationMessage): Promise<{
    id: string;
    channel: $Enums.NotificationChannel;
    recipientRef: string;
    templateId: string;
    payload: unknown;
    idempotencyKey: string;
    status: $Enums.NotificationDeliveryStatus;
  }> {
    // Check for existing delivery by idempotencyKey
    const existing = await this.notificationDeliveryRepository.findByIdempotencyKey(message.idempotencyKey);
    if (existing) {
      return {
        id: existing.id,
        channel: existing.channel,
        recipientRef: existing.recipientRef,
        templateId: existing.templateId,
        payload: existing.payload,
        idempotencyKey: existing.idempotencyKey,
        status: existing.status,
      };
    }

    // Create new queued delivery
    const delivery = await this.notificationDeliveryRepository.createQueued({
      channel: message.channel as $Enums.NotificationChannel,
      recipientRef: message.recipientRef,
      templateId: message.templateId,
      payload: message.payload,
      idempotencyKey: message.idempotencyKey,
    });

    return {
      id: delivery.id,
      channel: delivery.channel,
      recipientRef: delivery.recipientRef,
      templateId: delivery.templateId,
      payload: delivery.payload,
      idempotencyKey: delivery.idempotencyKey,
      status: delivery.status,
    };
  }

  /**
   * Deliver a notification immediately
   * If already sent, returns existing delivery
   * Otherwise attempts delivery and updates status
   */
  async deliverNow(message: NotificationMessage): Promise<{
    id: string;
    status: $Enums.NotificationDeliveryStatus;
    provider?: string;
    providerMessageId?: string;
    error?: string;
  }> {
    // Enqueue (deduplication)
    const delivery = await this.enqueue(message);

    // If already sent, return existing
    if (delivery.status === $Enums.NotificationDeliveryStatus.SENT) {
      const existing = await this.notificationDeliveryRepository.findByIdempotencyKey(message.idempotencyKey);
      return {
        id: existing!.id,
        status: existing!.status,
        provider: existing!.provider ?? undefined,
        providerMessageId: existing!.providerMessageId ?? undefined,
      };
    }

    // Increment attempt
    const updated = await this.notificationDeliveryRepository.incrementAttempt(
      delivery.id,
      new Date()
    );

    try {
      // Get provider and send
      const provider = getNotificationProvider(message.channel);
      const result = await provider.send(message);

      // Mark as sent
      const sent = await this.notificationDeliveryRepository.markSent(delivery.id, {
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        sentAt: new Date(),
      });

      return {
        id: sent.id,
        status: sent.status,
        provider: sent.provider ?? undefined,
        providerMessageId: sent.providerMessageId ?? undefined,
      };
    } catch (error) {
      // Mark as failed
      const errorMessage = error instanceof Error ? error.message : String(error);
      const failed = await this.notificationDeliveryRepository.markFailed(delivery.id, {
        error: errorMessage,
        failedAt: new Date(),
      });

      return {
        id: failed.id,
        status: failed.status,
        error: failed.error ?? undefined,
      };
    }
  }

  /**
   * Drain queued notifications (process a bounded batch)
   * Suitable for serverless cron jobs
   */
  async drainQueued(limit: number = 25): Promise<{
    processed: number;
    sent: number;
    failed: number;
  }> {
    const queued = await this.notificationDeliveryRepository.listQueued(limit);
    let sent = 0;
    let failed = 0;

    for (const delivery of queued) {
      // Reconstruct NotificationMessage from delivery row
      const message: NotificationMessage = {
        channel: delivery.channel as "EMAIL" | "WHATSAPP" | "PUSH",
        recipientRef: delivery.recipientRef,
        templateId: delivery.templateId,
        payload: delivery.payload,
        idempotencyKey: delivery.idempotencyKey,
      };

      // Attempt delivery
      const result = await this.deliverNow(message);

      if (result.status === $Enums.NotificationDeliveryStatus.SENT) {
        sent++;
      } else if (result.status === $Enums.NotificationDeliveryStatus.FAILED) {
        failed++;
      }
    }

    return {
      processed: queued.length,
      sent,
      failed,
    };
  }
}
