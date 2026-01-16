import { injectable } from "tsyringe";
import { prisma, $Enums } from "@infra/db/prisma";

/**
 * Payout entity (plain object)
 */
export interface PayoutEntity {
  id: string;
  proProfileId: string;
  provider: "MERCADO_PAGO" | "BANK_TRANSFER" | "MANUAL";
  status: "CREATED" | "SENT" | "FAILED" | "SETTLED";
  currency: string;
  amount: number; // minor units
  providerReference: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null;
  settledAt: Date | null;
}

/**
 * Payout create input
 */
export interface PayoutCreateInput {
  proProfileId: string;
  provider: "MERCADO_PAGO" | "BANK_TRANSFER" | "MANUAL";
  currency: string;
  amount: number; // minor units
}

/**
 * Payout status update input
 */
export interface PayoutStatusUpdateInput {
  providerReference?: string | null;
  failureReason?: string | null;
  sentAt?: Date | null;
  settledAt?: Date | null;
}

/**
 * Payout repository interface
 * Handles all data access for payouts
 */
export interface PayoutRepository {
  createPayout(input: PayoutCreateInput): Promise<PayoutEntity>;
  updateStatus(
    payoutId: string,
    status: "CREATED" | "SENT" | "FAILED" | "SETTLED",
    patch?: PayoutStatusUpdateInput
  ): Promise<PayoutEntity>;
  findById(payoutId: string): Promise<PayoutEntity | null>;
  listAll(limit?: number): Promise<PayoutEntity[]>;
  listByStatus(
    status: "CREATED" | "SENT" | "FAILED" | "SETTLED",
    limit?: number
  ): Promise<PayoutEntity[]>;
  listByProProfileId(
    proProfileId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<PayoutEntity[]>;
}

/**
 * Payout repository implementation using Prisma
 */
@injectable()
export class PayoutRepositoryImpl implements PayoutRepository {
  async createPayout(input: PayoutCreateInput): Promise<PayoutEntity> {
    const payout = await prisma.payout.create({
      data: {
        proProfileId: input.proProfileId,
        provider: input.provider as $Enums.PayoutProvider,
        status: $Enums.PayoutStatus.CREATED,
        currency: input.currency,
        amount: input.amount,
      },
    });

    return this.mapPrismaToDomain(payout);
  }

  async updateStatus(
    payoutId: string,
    status: "CREATED" | "SENT" | "FAILED" | "SETTLED",
    patch?: PayoutStatusUpdateInput
  ): Promise<PayoutEntity> {
    const updateData: {
      status: $Enums.PayoutStatus;
      providerReference?: string | null;
      failureReason?: string | null;
      sentAt?: Date | null;
      settledAt?: Date | null;
    } = {
      status: status as $Enums.PayoutStatus,
    };

    if (patch) {
      if (patch.providerReference !== undefined) {
        updateData.providerReference = patch.providerReference;
      }
      if (patch.failureReason !== undefined) {
        updateData.failureReason = patch.failureReason;
      }
      if (patch.sentAt !== undefined) {
        updateData.sentAt = patch.sentAt;
      }
      if (patch.settledAt !== undefined) {
        updateData.settledAt = patch.settledAt;
      }
    }

    const payout = await prisma.payout.update({
      where: { id: payoutId },
      data: updateData,
    });

    return this.mapPrismaToDomain(payout);
  }

  async findById(payoutId: string): Promise<PayoutEntity | null> {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
    });

    return payout ? this.mapPrismaToDomain(payout) : null;
  }

  async listAll(limit?: number): Promise<PayoutEntity[]> {
    const payouts = await prisma.payout.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return payouts.map(this.mapPrismaToDomain);
  }

  async listByStatus(
    status: "CREATED" | "SENT" | "FAILED" | "SETTLED",
    limit?: number
  ): Promise<PayoutEntity[]> {
    const payouts = await prisma.payout.findMany({
      where: {
        status: status as $Enums.PayoutStatus,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
    });

    return payouts.map(this.mapPrismaToDomain);
  }

  async listByProProfileId(
    proProfileId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<PayoutEntity[]> {
    const payouts = await prisma.payout.findMany({
      where: {
        proProfileId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: options?.limit,
      skip: options?.offset,
    });

    return payouts.map(this.mapPrismaToDomain);
  }

  private mapPrismaToDomain(prismaPayout: {
    id: string;
    proProfileId: string;
    provider: string;
    status: string;
    currency: string;
    amount: number;
    providerReference: string | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    sentAt: Date | null;
    settledAt: Date | null;
  }): PayoutEntity {
    return {
      id: prismaPayout.id,
      proProfileId: prismaPayout.proProfileId,
      provider: prismaPayout.provider as
        | "MERCADO_PAGO"
        | "BANK_TRANSFER"
        | "MANUAL",
      status: prismaPayout.status as "CREATED" | "SENT" | "FAILED" | "SETTLED",
      currency: prismaPayout.currency,
      amount: prismaPayout.amount,
      providerReference: prismaPayout.providerReference,
      failureReason: prismaPayout.failureReason,
      createdAt: prismaPayout.createdAt,
      updatedAt: prismaPayout.updatedAt,
      sentAt: prismaPayout.sentAt,
      settledAt: prismaPayout.settledAt,
    };
  }
}
