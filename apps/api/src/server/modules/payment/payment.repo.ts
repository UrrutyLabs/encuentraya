import { injectable } from "tsyringe";
import { prisma } from "@infra/db/prisma";
import { PaymentProvider, PaymentType, PaymentStatus } from "@repo/domain";
import type { Prisma, $Enums } from "@infra/db/prisma";

/**
 * Payment entity (plain object)
 */
export interface PaymentEntity {
  id: string;
  provider: PaymentProvider;
  type: PaymentType;
  status: PaymentStatus;
  orderId: string;
  clientUserId: string;
  proProfileId: string | null;
  currency: string;
  amountEstimated: number;
  amountAuthorized: number | null;
  amountCaptured: number | null;
  providerReference: string | null;
  checkoutUrl: string | null;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment create input
 */
export interface PaymentCreateInput {
  provider: PaymentProvider;
  type: PaymentType;
  orderId: string;
  clientUserId: string;
  proProfileId: string | null;
  currency: string;
  amountEstimated: number;
  idempotencyKey: string;
}

/**
 * Payment update input
 */
export interface PaymentUpdateInput {
  status?: PaymentStatus;
  amountAuthorized?: number | null;
  amountCaptured?: number | null;
  providerReference?: string | null;
  checkoutUrl?: string | null;
}

/**
 * Payment repository interface
 * Handles all data access for payments
 */
export interface PaymentRepository {
  create(input: PaymentCreateInput): Promise<PaymentEntity>;
  findById(id: string): Promise<PaymentEntity | null>;
  findByOrderId(orderId: string): Promise<PaymentEntity | null>;
  findByProviderReference(
    provider: PaymentProvider,
    providerReference: string
  ): Promise<PaymentEntity | null>;
  findAll(filters?: {
    status?: PaymentStatus;
    query?: string; // Search by orderId or providerReference
    limit?: number;
    cursor?: string;
  }): Promise<PaymentEntity[]>;
  updateStatusAndAmounts(
    id: string,
    patch: PaymentUpdateInput
  ): Promise<PaymentEntity>;
  setCheckoutUrl(id: string, url: string): Promise<PaymentEntity>;
  setProviderReference(id: string, reference: string): Promise<PaymentEntity>;
  findPendingByClientUserId(clientUserId: string): Promise<PaymentEntity[]>;
}

/**
 * Payment repository implementation using Prisma
 */
@injectable()
export class PaymentRepositoryImpl implements PaymentRepository {
  async create(input: PaymentCreateInput): Promise<PaymentEntity> {
    const payment = await prisma.payment.create({
      data: {
        provider: input.provider as $Enums.PaymentProvider,
        type: input.type as $Enums.PaymentType,
        status: PaymentStatus.CREATED as $Enums.PaymentStatus,
        orderId: input.orderId,
        clientUserId: input.clientUserId,
        proProfileId: input.proProfileId,
        currency: input.currency,
        amountEstimated: input.amountEstimated,
        idempotencyKey: input.idempotencyKey,
      },
    });

    return this.mapPrismaToDomain(payment);
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    return payment ? this.mapPrismaToDomain(payment) : null;
  }

  async findByOrderId(orderId: string): Promise<PaymentEntity | null> {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    return payment ? this.mapPrismaToDomain(payment) : null;
  }

  async findByProviderReference(
    provider: PaymentProvider,
    providerReference: string
  ): Promise<PaymentEntity | null> {
    const payment = await prisma.payment.findFirst({
      where: {
        provider,
        providerReference,
      },
    });

    return payment ? this.mapPrismaToDomain(payment) : null;
  }

  async findAll(filters?: {
    status?: PaymentStatus;
    query?: string;
    limit?: number;
    cursor?: string;
  }): Promise<PaymentEntity[]> {
    const where: Prisma.PaymentWhereInput = {};

    if (filters?.status) {
      where.status = filters.status as $Enums.PaymentStatus;
    }

    if (filters?.query) {
      where.OR = [
        { orderId: { contains: filters.query } },
        { providerReference: { contains: filters.query } },
      ];
    }

    if (filters?.cursor) {
      where.id = { gt: filters.cursor };
    }

    const limit = filters?.limit ?? 100;

    const payments = await prisma.payment.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
    });

    return payments.map(this.mapPrismaToDomain);
  }

  async updateStatusAndAmounts(
    id: string,
    patch: PaymentUpdateInput
  ): Promise<PaymentEntity> {
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(patch.status !== undefined && {
          status: patch.status as unknown as $Enums.PaymentStatus,
        }),
        ...(patch.amountAuthorized !== undefined && {
          amountAuthorized: patch.amountAuthorized,
        }),
        ...(patch.amountCaptured !== undefined && {
          amountCaptured: patch.amountCaptured,
        }),
        ...(patch.providerReference !== undefined && {
          providerReference: patch.providerReference,
        }),
        ...(patch.checkoutUrl !== undefined && {
          checkoutUrl: patch.checkoutUrl,
        }),
      },
    });

    return this.mapPrismaToDomain(payment);
  }

  async setCheckoutUrl(id: string, url: string): Promise<PaymentEntity> {
    const payment = await prisma.payment.update({
      where: { id },
      data: { checkoutUrl: url },
    });

    return this.mapPrismaToDomain(payment);
  }

  async setProviderReference(
    id: string,
    reference: string
  ): Promise<PaymentEntity> {
    const payment = await prisma.payment.update({
      where: { id },
      data: { providerReference: reference },
    });

    return this.mapPrismaToDomain(payment);
  }

  /**
   * Find pending payments for a client
   * Pending payments are those with status: CREATED, REQUIRES_ACTION, AUTHORIZED
   * These prevent account deletion
   */
  async findPendingByClientUserId(
    clientUserId: string
  ): Promise<PaymentEntity[]> {
    const pendingStatuses: PaymentStatus[] = [
      PaymentStatus.CREATED,
      PaymentStatus.REQUIRES_ACTION,
      PaymentStatus.AUTHORIZED,
    ];

    const payments = await prisma.payment.findMany({
      where: {
        clientUserId,
        status: {
          in: pendingStatuses as $Enums.PaymentStatus[],
        },
      },
    });

    return payments.map(this.mapPrismaToDomain);
  }

  private mapPrismaToDomain(
    prismaPayment: Prisma.PaymentGetPayload<Record<string, never>>
  ): PaymentEntity {
    return {
      id: prismaPayment.id,
      provider: prismaPayment.provider as PaymentProvider,
      type: prismaPayment.type as PaymentType,
      status: prismaPayment.status as PaymentStatus,
      orderId: prismaPayment.orderId,
      clientUserId: prismaPayment.clientUserId,
      proProfileId: prismaPayment.proProfileId,
      currency: prismaPayment.currency,
      amountEstimated: prismaPayment.amountEstimated,
      amountAuthorized: prismaPayment.amountAuthorized,
      amountCaptured: prismaPayment.amountCaptured,
      providerReference: prismaPayment.providerReference,
      checkoutUrl: prismaPayment.checkoutUrl,
      idempotencyKey: prismaPayment.idempotencyKey,
      createdAt: prismaPayment.createdAt,
      updatedAt: prismaPayment.updatedAt,
    };
  }
}

export const paymentRepository: PaymentRepository = new PaymentRepositoryImpl();
