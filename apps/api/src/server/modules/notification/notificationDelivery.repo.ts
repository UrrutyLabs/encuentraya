import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { Prisma, $Enums } from "@infra/db/prisma";

/**
 * Notification delivery entity (plain object)
 */
export interface NotificationDeliveryEntity {
  id: string;
  channel: $Enums.NotificationChannel;
  recipientRef: string;
  templateId: string;
  payload: unknown;
  idempotencyKey: string;
  provider: string | null;
  providerMessageId: string | null;
  status: $Enums.NotificationDeliveryStatus;
  error: string | null;
  attemptCount: number;
  lastAttemptAt: Date | null;
  createdAt: Date;
  sentAt: Date | null;
  failedAt: Date | null;
}

/**
 * Notification delivery create input
 */
export interface NotificationDeliveryCreateInput {
  channel: $Enums.NotificationChannel;
  recipientRef: string;
  templateId: string;
  payload: unknown;
  idempotencyKey: string;
}

/**
 * Notification delivery repository interface
 * Handles all data access for notification deliveries
 */
export interface NotificationDeliveryRepository {
  findByIdempotencyKey(key: string): Promise<NotificationDeliveryEntity | null>;
  createQueued(
    input: NotificationDeliveryCreateInput
  ): Promise<NotificationDeliveryEntity>;
  incrementAttempt(id: string, at: Date): Promise<NotificationDeliveryEntity>;
  markSent(
    id: string,
    data: { provider: string; providerMessageId?: string; sentAt: Date }
  ): Promise<NotificationDeliveryEntity>;
  markFailed(
    id: string,
    data: { error: string; failedAt: Date }
  ): Promise<NotificationDeliveryEntity>;
  listQueued(limit: number): Promise<NotificationDeliveryEntity[]>;
  listFailed(limit: number): Promise<NotificationDeliveryEntity[]>;
}

/**
 * Notification delivery repository implementation using Prisma
 */
@injectable()
export class NotificationDeliveryRepositoryImpl implements NotificationDeliveryRepository {
  async findByIdempotencyKey(
    key: string
  ): Promise<NotificationDeliveryEntity | null> {
    const delivery = await prisma.notificationDelivery.findUnique({
      where: { idempotencyKey: key },
    });

    return delivery ? this.mapPrismaToDomain(delivery) : null;
  }

  async createQueued(
    input: NotificationDeliveryCreateInput
  ): Promise<NotificationDeliveryEntity> {
    const delivery = await prisma.notificationDelivery.create({
      data: {
        channel: input.channel,
        recipientRef: input.recipientRef,
        templateId: input.templateId,
        payload: input.payload as object, // Prisma expects object for Json type
        idempotencyKey: input.idempotencyKey,
        status: $Enums.NotificationDeliveryStatus.QUEUED,
      },
    });

    return this.mapPrismaToDomain(delivery);
  }

  async incrementAttempt(
    id: string,
    at: Date
  ): Promise<NotificationDeliveryEntity> {
    const delivery = await prisma.notificationDelivery.update({
      where: { id },
      data: {
        attemptCount: { increment: 1 },
        lastAttemptAt: at,
      },
    });

    return this.mapPrismaToDomain(delivery);
  }

  async markSent(
    id: string,
    data: { provider: string; providerMessageId?: string; sentAt: Date }
  ): Promise<NotificationDeliveryEntity> {
    const delivery = await prisma.notificationDelivery.update({
      where: { id },
      data: {
        status: $Enums.NotificationDeliveryStatus.SENT,
        provider: data.provider,
        providerMessageId: data.providerMessageId ?? null,
        sentAt: data.sentAt,
      },
    });

    return this.mapPrismaToDomain(delivery);
  }

  async markFailed(
    id: string,
    data: { error: string; failedAt: Date }
  ): Promise<NotificationDeliveryEntity> {
    const delivery = await prisma.notificationDelivery.update({
      where: { id },
      data: {
        status: $Enums.NotificationDeliveryStatus.FAILED,
        error: data.error,
        failedAt: data.failedAt,
      },
    });

    return this.mapPrismaToDomain(delivery);
  }

  async listQueued(limit: number): Promise<NotificationDeliveryEntity[]> {
    const deliveries = await prisma.notificationDelivery.findMany({
      where: {
        status: $Enums.NotificationDeliveryStatus.QUEUED,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
    });

    return deliveries.map((d) => this.mapPrismaToDomain(d));
  }

  async listFailed(limit: number): Promise<NotificationDeliveryEntity[]> {
    const deliveries = await prisma.notificationDelivery.findMany({
      where: {
        status: $Enums.NotificationDeliveryStatus.FAILED,
      },
      orderBy: {
        failedAt: "desc",
      },
      take: limit,
    });

    return deliveries.map((d) => this.mapPrismaToDomain(d));
  }

  private mapPrismaToDomain(
    prismaDelivery: Prisma.NotificationDeliveryGetPayload<Record<string, never>>
  ): NotificationDeliveryEntity {
    return {
      id: prismaDelivery.id,
      channel: prismaDelivery.channel,
      recipientRef: prismaDelivery.recipientRef,
      templateId: prismaDelivery.templateId,
      payload: prismaDelivery.payload,
      idempotencyKey: prismaDelivery.idempotencyKey,
      provider: prismaDelivery.provider,
      providerMessageId: prismaDelivery.providerMessageId,
      status: prismaDelivery.status,
      error: prismaDelivery.error,
      attemptCount: prismaDelivery.attemptCount,
      lastAttemptAt: prismaDelivery.lastAttemptAt,
      createdAt: prismaDelivery.createdAt,
      sentAt: prismaDelivery.sentAt,
      failedAt: prismaDelivery.failedAt,
    };
  }
}
