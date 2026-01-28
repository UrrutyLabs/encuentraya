import { injectable } from "tsyringe";
import { prisma, $Enums } from "@infra/db/prisma";

/**
 * Earning entity (plain object)
 */
export interface EarningEntity {
  id: string;
  orderId: string;
  orderDisplayId?: string; // Optional, populated when fetched with order relation
  proProfileId: string;
  clientUserId: string;
  currency: string;
  grossAmount: number; // minor units
  platformFeeAmount: number; // minor units
  netAmount: number; // minor units
  status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
  availableAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Earning create input
 */
export interface EarningCreateInput {
  orderId: string;
  proProfileId: string;
  clientUserId: string;
  currency: string;
  grossAmount: number; // minor units
  platformFeeAmount: number; // minor units
  netAmount: number; // minor units
  availableAt?: Date | null;
}

/**
 * Earning status update input
 */
export interface EarningStatusUpdateInput {
  availableAt?: Date | null;
}

/**
 * Earning repository interface
 * Handles all data access for earnings
 */
export interface EarningRepository {
  createFromOrder(input: EarningCreateInput): Promise<EarningEntity>;
  findById(id: string): Promise<EarningEntity | null>;
  findByOrderId(orderId: string): Promise<EarningEntity | null>;
  listPayableByPro(proProfileId: string, now: Date): Promise<EarningEntity[]>;
  listPendingDue(now: Date): Promise<EarningEntity[]>;
  listByProProfileId(
    proProfileId: string,
    options?: {
      status?: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
      limit?: number;
      offset?: number;
    }
  ): Promise<EarningEntity[]>;
  markStatus(
    earningId: string,
    status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED",
    patch?: EarningStatusUpdateInput
  ): Promise<EarningEntity>;
  markManyStatus(
    ids: string[],
    status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED"
  ): Promise<EarningEntity[]>;
}

/**
 * Earning repository implementation using Prisma
 */
@injectable()
export class EarningRepositoryImpl implements EarningRepository {
  async createFromOrder(input: EarningCreateInput): Promise<EarningEntity> {
    const earning = await prisma.earning.create({
      data: {
        orderId: input.orderId,
        proProfileId: input.proProfileId,
        clientUserId: input.clientUserId,
        currency: input.currency,
        grossAmount: input.grossAmount,
        platformFeeAmount: input.platformFeeAmount,
        netAmount: input.netAmount,
        status: $Enums.EarningStatus.PENDING,
        availableAt: input.availableAt ?? null,
      },
    });

    return this.mapPrismaToDomain(earning);
  }

  async findById(id: string): Promise<EarningEntity | null> {
    const earning = await prisma.earning.findUnique({
      where: { id },
    });

    return earning ? this.mapPrismaToDomain(earning) : null;
  }

  async findByOrderId(orderId: string): Promise<EarningEntity | null> {
    const earning = await prisma.earning.findUnique({
      where: { orderId },
    });

    return earning ? this.mapPrismaToDomain(earning) : null;
  }

  async listPayableByPro(
    proProfileId: string,
    now: Date
  ): Promise<EarningEntity[]> {
    const earnings = await prisma.earning.findMany({
      where: {
        proProfileId,
        status: $Enums.EarningStatus.PAYABLE,
        availableAt: {
          lte: now, // availableAt <= now
        },
      },
      orderBy: {
        availableAt: "asc",
      },
    });

    return earnings.map(this.mapPrismaToDomain);
  }

  async listPendingDue(now: Date): Promise<EarningEntity[]> {
    const earnings = await prisma.earning.findMany({
      where: {
        status: $Enums.EarningStatus.PENDING,
        availableAt: {
          lte: now, // availableAt <= now
        },
      },
      orderBy: {
        availableAt: "asc",
      },
    });

    return earnings.map(this.mapPrismaToDomain);
  }

  async listByProProfileId(
    proProfileId: string,
    options?: {
      status?: "PENDING" | "PAYABLE" | "PAID" | "REVERSED";
      limit?: number;
      offset?: number;
    }
  ): Promise<EarningEntity[]> {
    const where: {
      proProfileId: string;
      status?: $Enums.EarningStatus;
    } = {
      proProfileId,
    };

    if (options?.status) {
      where.status = options.status as $Enums.EarningStatus;
    }

    const earnings = await prisma.earning.findMany({
      where,
      include: {
        order: {
          select: {
            displayId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: options?.limit,
      skip: options?.offset,
    });

    return earnings.map((e) => {
      const entity = this.mapPrismaToDomain(e);
      // Include orderDisplayId if order relation is loaded
      if (e.order?.displayId) {
        entity.orderDisplayId = e.order.displayId;
      }
      return entity;
    });
  }

  async markStatus(
    earningId: string,
    status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED",
    patch?: EarningStatusUpdateInput
  ): Promise<EarningEntity> {
    const earning = await prisma.earning.update({
      where: { id: earningId },
      data: {
        status: status as $Enums.EarningStatus,
        availableAt:
          patch?.availableAt !== undefined ? patch.availableAt : undefined,
      },
    });

    return this.mapPrismaToDomain(earning);
  }

  async markManyStatus(
    ids: string[],
    status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED"
  ): Promise<EarningEntity[]> {
    // Prisma doesn't have updateMany that returns updated records
    // So we need to update individually and return them
    const updated = await Promise.all(
      ids.map((id) =>
        prisma.earning.update({
          where: { id },
          data: {
            status: status as $Enums.EarningStatus,
          },
        })
      )
    );

    return updated.map(this.mapPrismaToDomain);
  }

  private mapPrismaToDomain(prismaEarning: {
    id: string;
    orderId: string;
    proProfileId: string;
    clientUserId: string;
    currency: string;
    grossAmount: number;
    platformFeeAmount: number;
    netAmount: number;
    status: string;
    availableAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): EarningEntity {
    return {
      id: prismaEarning.id,
      orderId: prismaEarning.orderId,
      proProfileId: prismaEarning.proProfileId,
      clientUserId: prismaEarning.clientUserId,
      currency: prismaEarning.currency,
      grossAmount: prismaEarning.grossAmount,
      platformFeeAmount: prismaEarning.platformFeeAmount,
      netAmount: prismaEarning.netAmount,
      status: prismaEarning.status as
        | "PENDING"
        | "PAYABLE"
        | "PAID"
        | "REVERSED",
      availableAt: prismaEarning.availableAt,
      createdAt: prismaEarning.createdAt,
      updatedAt: prismaEarning.updatedAt,
    };
  }
}
