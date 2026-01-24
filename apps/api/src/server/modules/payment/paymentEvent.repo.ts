import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { PaymentProvider } from "@repo/domain";
import type { Prisma, $Enums } from "@infra/db/prisma";

/**
 * Payment event entity (plain object)
 */
export interface PaymentEventEntity {
  id: string;
  paymentId: string;
  provider: PaymentProvider;
  eventType: string;
  raw: unknown; // JSON data
  createdAt: Date;
}

/**
 * Payment event create input
 */
export interface PaymentEventCreateInput {
  paymentId: string;
  provider: PaymentProvider;
  eventType: string;
  raw: unknown; // JSON data
}

/**
 * Payment event repository interface
 * Handles all data access for payment events (audit trail)
 */
export interface PaymentEventRepository {
  createEvent(input: PaymentEventCreateInput): Promise<PaymentEventEntity>;
  findByPaymentId(paymentId: string): Promise<PaymentEventEntity[]>;
}

/**
 * Payment event repository implementation using Prisma
 */
@injectable()
export class PaymentEventRepositoryImpl implements PaymentEventRepository {
  async createEvent(
    input: PaymentEventCreateInput
  ): Promise<PaymentEventEntity> {
    const event = await prisma.paymentEvent.create({
      data: {
        paymentId: input.paymentId,
        provider: input.provider as unknown as $Enums.PaymentProvider,
        eventType: input.eventType,
        raw: input.raw as object, // Prisma expects object for Json type
      },
    });

    return this.mapPrismaToDomain(event);
  }

  async findByPaymentId(paymentId: string): Promise<PaymentEventEntity[]> {
    const events = await prisma.paymentEvent.findMany({
      where: { paymentId },
      orderBy: { createdAt: "asc" },
    });

    return events.map(this.mapPrismaToDomain);
  }

  private mapPrismaToDomain(
    prismaEvent: Prisma.PaymentEventGetPayload<Record<string, never>>
  ): PaymentEventEntity {
    return {
      id: prismaEvent.id,
      paymentId: prismaEvent.paymentId,
      provider: prismaEvent.provider as PaymentProvider,
      eventType: prismaEvent.eventType,
      raw: prismaEvent.raw,
      createdAt: prismaEvent.createdAt,
    };
  }
}

export const paymentEventRepository: PaymentEventRepository =
  new PaymentEventRepositoryImpl();
