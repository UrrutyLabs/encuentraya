import { injectable } from "tsyringe";
import { prisma, $Enums } from "@infra/db/prisma";

/**
 * Earning entity (plain object)
 */
export interface EarningEntity {
  id: string;
  bookingId: string;
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
  bookingId: string;
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
  createFromBooking(input: EarningCreateInput): Promise<EarningEntity>;
  findById(id: string): Promise<EarningEntity | null>;
  findByBookingId(bookingId: string): Promise<EarningEntity | null>;
  listPayableByPro(
    proProfileId: string,
    now: Date
  ): Promise<EarningEntity[]>;
  listPendingDue(now: Date): Promise<EarningEntity[]>;
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
  async createFromBooking(input: EarningCreateInput): Promise<EarningEntity> {
    const earning = await prisma.earning.create({
      data: {
        bookingId: input.bookingId,
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

  async findByBookingId(bookingId: string): Promise<EarningEntity | null> {
    const earning = await prisma.earning.findUnique({
      where: { bookingId },
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

  async markStatus(
    earningId: string,
    status: "PENDING" | "PAYABLE" | "PAID" | "REVERSED",
    patch?: EarningStatusUpdateInput
  ): Promise<EarningEntity> {
    const earning = await prisma.earning.update({
      where: { id: earningId },
      data: {
        status: status as $Enums.EarningStatus,
        availableAt: patch?.availableAt !== undefined ? patch.availableAt : undefined,
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
    bookingId: string;
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
      bookingId: prismaEarning.bookingId,
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
